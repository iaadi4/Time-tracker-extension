/**
 * Time Tracker - Background Service Worker
 *
 * This service worker tracks time spent on websites using Chrome's event-driven
 * architecture. It persists all state in chrome.storage.local to survive restarts.
 *
 * Key Events:
 * - chrome.tabs.onActivated: User switched tabs
 * - chrome.tabs.onUpdated: Page navigation completed
 * - chrome.windows.onFocusChanged: Window gained/lost focus
 * - chrome.idle.onStateChanged: User went idle or returned
 * - chrome.alarms: Periodic save every 1 minute
 */

import {
  saveTime,
  getSettings,
  incrementVisitCount,
  getLimit,
  getDailyUsage,
  updateNotificationState,
} from "../utils/storage";

// Storage keys for tracking state (prefixed with _ to avoid conflicts)
const STORAGE_KEYS = {
  CURRENT_URL: "_currentUrl",
  START_TIME: "_startTime",
  FAVICON: "_favicon",
} as const;

type TrackingState = {
  _currentUrl?: string;
  _startTime?: number;
  _favicon?: string;
};

// Visit debouncing state
let _lastVisit = {
  domain: "",
  timestamp: 0,
};

/**
 * Extracts the hostname from a URL, filtering out browser-internal pages.
 */
function getDomain(url: string): string | null {
  if (!url) return null;

  const blockedPrefixes = [
    "chrome://",
    "chrome-extension://",
    "about:",
    "edge://",
  ];

  if (blockedPrefixes.some((prefix) => url.startsWith(prefix))) {
    return null;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Gets the Google favicon URL for a domain.
 */
function getFavicon(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "";
  }
}

async function checkLimits(domain: string, timeToAdd = 0): Promise<void> {
  const limit = await getLimit(domain);
  if (!limit) return;

  const usage = await getDailyUsage(domain);
  const totalTime = usage.time + timeToAdd;

  const is80Percent = totalTime >= limit.timeLimit * 0.8;
  const is100Percent = totalTime >= limit.timeLimit;

  // Check 80% notification
  if (
    limit.notify80 &&
    is80Percent &&
    !usage.notifications.sent80 &&
    !is100Percent
  ) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: "Time Tracker Alert",
      message: `You have used 80% of your daily limit for ${domain}.`,
    });
    await updateNotificationState(domain, { sent80: true });
  }

  // Check 100% notification
  if (limit.notify100 && is100Percent && !usage.notifications.sent100) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: "Time Tracker Alert",
      message: `You have reached your daily limit for ${domain}.`,
    });
    await updateNotificationState(domain, { sent100: true });
  }

  // Block if limit reached and blocking enabled
  if (limit.blockOnLimit && is100Percent) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.id && tab.url && getDomain(tab.url) === domain) {
      const blockedUrl = chrome.runtime.getURL(
        `blocked.html?domain=${domain}&limit=${limit.timeLimit}`
      );
      chrome.tabs.update(tab.id, { url: blockedUrl });
    }
  }
}

/**
 * Calculates and saves the time spent on the previous URL.
 * Called before switching to a new URL or when the user leaves.
 */
async function commitTime(): Promise<void> {
  const data = (await chrome.storage.local.get(
    Object.values(STORAGE_KEYS)
  )) as TrackingState;

  if (!data._currentUrl || !data._startTime) return;

  const duration = Date.now() - data._startTime;
  const domain = getDomain(data._currentUrl);

  // Get configurable minimum delay from settings
  const settings = await getSettings();
  const minDuration = settings.trackingDelaySeconds * 1000;

  // Only save if user spent at least the configured time on the site (and less than 5 minutes per event)
  if (domain && duration >= minDuration && duration <= 300000) {
    await saveTime(domain, duration, data._favicon || "");
    await checkLimits(domain);
  }
}

/**
 * Starts tracking a new URL. Stores the URL and current timestamp.
 */
async function startTracking(url: string, trackVisit = false): Promise<void> {
  const domain = getDomain(url);

  if (domain) {
    // Check limits immediately upon navigation
    const limit = await getLimit(domain);
    if (limit && limit.blockOnLimit) {
      const usage = await getDailyUsage(domain);
      if (usage.time >= limit.timeLimit) {
        const blockedUrl = chrome.runtime.getURL(
          `blocked.html?domain=${domain}&limit=${limit.timeLimit}`
        );
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab && tab.id) {
          chrome.tabs.update(tab.id, { url: blockedUrl });
          return; // Do not start tracking if blocked
        }
      }
    }

    // If this is a navigation to a new domain, increment visit count
    if (trackVisit) {
      const now = Date.now();
      // Debounce visits: Ignore if same domain within 5 seconds
      const isDuplicate =
        domain === _lastVisit.domain && now - _lastVisit.timestamp < 5000;

      if (!isDuplicate) {
        await incrementVisitCount(domain, getFavicon(url));
        _lastVisit = { domain, timestamp: now };
      }
    }

    await chrome.storage.local.set({
      [STORAGE_KEYS.CURRENT_URL]: url,
      [STORAGE_KEYS.START_TIME]: Date.now(),
      [STORAGE_KEYS.FAVICON]: getFavicon(url),
    });
  } else {
    await stopTracking();
  }
}

/**
 * Stops tracking by removing the start time (but keeps URL for reference).
 */
async function stopTracking(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.CURRENT_URL,
    STORAGE_KEYS.START_TIME,
    STORAGE_KEYS.FAVICON,
  ]);
}

// --- Event Listeners ---

// User switched to a different tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await commitTime();

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await startTracking(tab.url, true); // Track visit on tab switch
    }
  } catch {
    // Tab may have been closed
  }
});

// Page finished loading (navigation within same tab)
chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active && tab.url) {
    await commitTime();
    await startTracking(tab.url, true); // Track visit on navigation
  }
});

// SPA Navigation (History API)
chrome.webNavigation?.onHistoryStateUpdated?.addListener(async (details) => {
  if (details.frameId === 0) {
    try {
      const tab = await chrome.tabs.get(details.tabId);
      if (tab.active) {
        await commitTime();
        await startTracking(details.url, true);
      }
    } catch {
      // Tab may have been closed
    }
  }
});

// Window gained or lost focus
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await commitTime();
    await chrome.storage.local.remove([STORAGE_KEYS.START_TIME]);
  } else {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab?.url) {
      await startTracking(tab.url);
    }
  }
});

// User went idle or returned
chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === "idle" || newState === "locked") {
    await commitTime();
    await chrome.storage.local.remove([STORAGE_KEYS.START_TIME]);
  } else if (newState === "active") {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (tab?.url) {
      await startTracking(tab.url);
    }
  }
});

// Periodic save (every 1 minute) to capture long sessions
chrome.alarms.create("time-tracker-save", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "time-tracker-save") {
    await commitTime();

    // Restart the timer for ongoing tracking
    const data = (await chrome.storage.local.get([
      STORAGE_KEYS.CURRENT_URL,
      STORAGE_KEYS.FAVICON,
    ])) as TrackingState;

    if (data._currentUrl) {
      const domain = getDomain(data._currentUrl);
      if (domain) {
        // Also check limits during periodic save for notifications (soft check)
        // Calculate theoretical accumulated time since start
        const startTime = (
          (await chrome.storage.local.get(
            STORAGE_KEYS.START_TIME
          )) as TrackingState
        )._startTime;
        if (startTime) {
          const currentDuration = Date.now() - startTime;
          await checkLimits(domain, currentDuration);
        }
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.START_TIME]: Date.now(),
      });
    }
  }
});

// Browser startup - register for tracking
chrome.runtime.onStartup.addListener(async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (tab?.url) {
    await startTracking(tab.url);
  }
});

// Extension installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (tab?.url) {
    await startTracking(tab.url);
  }
});
