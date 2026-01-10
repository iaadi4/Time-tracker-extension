/**
 * Storage Utilities - Chrome storage API wrapper
 *
 * Key functions:
 * - saveTime(): Save browsing time for a domain
 * - getAggregatedData(): Get stats for a time range
 * - getSettings/setSettings(): Manage user preferences
 * - addToWhitelist/removeFromWhitelist(): Manage excluded domains
 */
import type {
  StorageData,
  DailyData,
  AggregatedData,
  TimeRange,
  Insights,
  Settings,
} from "./types";

const WHITELIST_KEY = "whitelist";
const SETTINGS_KEY = "settings";

let _mutex = Promise.resolve();
const withLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  let release: () => void;
  const lock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const prev = _mutex;
  _mutex = lock;
  await prev;
  try {
    return await fn();
  } finally {
    release!();
  }
};

const DEFAULT_SETTINGS: Settings = {
  trackingDelaySeconds: 15,
  theme: "blue-500", // Default to blue-500 which matches the original primary color
};

export const getTodayKey = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getStorageData = async (
  keys?: string | string[] | null
): Promise<StorageData> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys || null, (result) => {
      resolve(result as StorageData);
    });
  });
};

export const setStorageData = async (
  data: Partial<StorageData>
): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
};

export const addToWhitelist = async (domain: string): Promise<void> => {
  const data = await getStorageData(WHITELIST_KEY);
  const whitelist = data[WHITELIST_KEY] || [];
  if (!whitelist.includes(domain)) {
    whitelist.push(domain);
    await setStorageData({ [WHITELIST_KEY]: whitelist });
  }
};

export const removeFromWhitelist = async (domain: string): Promise<void> => {
  const data = await getStorageData(WHITELIST_KEY);
  const whitelist = data[WHITELIST_KEY] || [];
  const newWhitelist = whitelist.filter((d: string) => d !== domain);
  await setStorageData({ [WHITELIST_KEY]: newWhitelist });
};

export const getSettings = async (): Promise<Settings> => {
  const data = await getStorageData(SETTINGS_KEY);
  return (data[SETTINGS_KEY] as Settings) || DEFAULT_SETTINGS;
};

export const setSettings = async (
  settings: Partial<Settings>
): Promise<void> => {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await setStorageData({ [SETTINGS_KEY]: updated });
};

export const saveTime = async (
  domain: string,
  duration: number,
  favicon: string
) => {
  return withLock(async () => {
    if (!domain || duration <= 0) return;

    const today = getTodayKey();
    const data = await getStorageData([today, WHITELIST_KEY]);

    const whitelist = data[WHITELIST_KEY] || [];
    if (whitelist.includes(domain)) return;

    const todayData: DailyData = (data[today] as DailyData) || {};

    if (!todayData[domain]) {
      todayData[domain] = {
        time: 0,
        favicon: favicon,
        lastVisited: Date.now(),
        visitCount: 0,
      };
    }

    todayData[domain].time += duration;
    todayData[domain].lastVisited = Date.now();
    if (favicon) todayData[domain].favicon = favicon;

    await setStorageData({ [today]: todayData });
  });
};

export const getAggregatedData = async (
  range: TimeRange
): Promise<AggregatedData> => {
  const data = await getStorageData(null); // Fetch all data
  const today = new Date();
  const result: DailyData = {};

  Object.keys(data).forEach((key) => {
    if (key === WHITELIST_KEY) return;

    // Check if key is a date and within range
    // Simple date check
    if (!key.match(/^\d{4}-\d{2}-\d{2}$/)) return;

    const date = new Date(key);
    let include = false;

    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (range) {
      case "today":
        include = key === getTodayKey();
        break;
      case "week":
        include = diffDays <= 7;
        break;
      case "month":
        include = diffDays <= 30;
        break;
      case "year":
        include = diffDays <= 365;
        break;
      case "all-time":
        include = true;
        break;
    }

    if (include) {
      const dayData = data[key] as DailyData;
      Object.keys(dayData).forEach((domain) => {
        if (!result[domain]) {
          result[domain] = {
            time: 0,
            favicon: dayData[domain].favicon,
            lastVisited: dayData[domain].lastVisited,
            visitCount: 0,
          };
        }
        result[domain].time += dayData[domain].time;
        result[domain].visitCount += dayData[domain].visitCount || 0;
        // Keep the most recent lastVisited
        if (dayData[domain].lastVisited > result[domain].lastVisited) {
          result[domain].lastVisited = dayData[domain].lastVisited;
          result[domain].favicon = dayData[domain].favicon; // Update favicon to most recent
        }
      });
    }
  });

  const byDomain = Object.keys(result)
    .map((domain) => ({
      domain,
      ...result[domain],
    }))
    .sort((a, b) => b.time - a.time);

  const totalTime = byDomain.reduce((acc, curr) => acc + curr.time, 0);

  return { totalTime, byDomain };
};

export const getInsights = async (range: TimeRange): Promise<Insights> => {
  const data = await getStorageData(null);
  const today = new Date();

  let totalTime = 0;
  let daysCount = 0;
  let mostActiveDay = { date: "", time: 0 };

  Object.keys(data).forEach((key) => {
    if (key === WHITELIST_KEY) return;
    if (!key.match(/^\d{4}-\d{2}-\d{2}$/)) return;

    const date = new Date(key);
    let include = false;

    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (range) {
      case "today":
        include = key === getTodayKey();
        break;
      case "week":
        include = diffDays <= 7;
        break;
      case "month":
        include = diffDays <= 30;
        break;
      case "year":
        include = diffDays <= 365;
        break;
      case "all-time":
        include = true;
        break;
    }

    if (include) {
      const dayData = data[key] as DailyData;
      let dayTotal = 0;
      Object.values(dayData).forEach((site) => {
        dayTotal += site.time;
      });

      if (dayTotal > 0) {
        // Only count active days
        totalTime += dayTotal;
        daysCount++;

        if (dayTotal > mostActiveDay.time) {
          mostActiveDay = { date: key, time: dayTotal };
        }
      }
    }
  });

  return {
    mostActiveDay: mostActiveDay.time > 0 ? mostActiveDay : null,
    dailyAverage: daysCount > 0 ? totalTime / daysCount : 0,
  };
};

// Increment visit count for a domain (called on navigation)
export const incrementVisitCount = async (
  domain: string,
  favicon: string
): Promise<void> => {
  return withLock(async () => {
    const today = getTodayKey();
    const data = await getStorageData([today, WHITELIST_KEY]);

    const whitelist = data[WHITELIST_KEY] || [];
    if (whitelist.includes(domain)) return;

    const todayData: DailyData = (data[today] as DailyData) || {};

    if (!todayData[domain]) {
      todayData[domain] = {
        time: 0,
        favicon: favicon,
        lastVisited: Date.now(),
        visitCount: 1,
      };
    } else {
      todayData[domain].visitCount = (todayData[domain].visitCount || 0) + 1;
      todayData[domain].lastVisited = Date.now();
      if (favicon) todayData[domain].favicon = favicon;
    }

    await setStorageData({ [today]: todayData });
  });
};

// Get comprehensive analysis data for a specific site
export const getSiteAnalysisData = async (
  domain: string
): Promise<import("./types").SiteAnalysisData | null> => {
  const data = await getStorageData(null);

  let totalTime = 0;
  let totalVisits = 0;
  let firstUsed: string | null = null;
  let lastUsed = 0;
  let favicon = "";
  const dailyData: { date: string; time: number; visits: number }[] = [];

  // Get all date keys sorted
  const dateKeys = Object.keys(data)
    .filter((key) => key.match(/^\d{4}-\d{2}-\d{2}$/))
    .sort();

  dateKeys.forEach((key) => {
    const dayData = data[key] as DailyData;
    if (dayData[domain]) {
      const siteData = dayData[domain];
      totalTime += siteData.time;
      totalVisits += siteData.visitCount || 0;

      if (!firstUsed) firstUsed = key;
      if (siteData.lastVisited > lastUsed) {
        lastUsed = siteData.lastVisited;
        favicon = siteData.favicon;
      }

      dailyData.push({
        date: key,
        time: siteData.time,
        visits: siteData.visitCount || 0,
      });
    }
  });

  if (!firstUsed) return null;

  // Generate heat map data (last 26 weeks = 182 days)
  const heatMapData: { date: string; time: number; intensity: number }[] = [];
  const today = new Date();
  const maxTimeForIntensity = Math.max(...dailyData.map((d) => d.time), 1);

  for (let i = 181; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const dayEntry = dailyData.find((d) => d.date === dateStr);
    const time = dayEntry?.time || 0;
    const intensity =
      time > 0 ? Math.min(4, Math.ceil((time / maxTimeForIntensity) * 4)) : 0;

    heatMapData.push({ date: dateStr, time, intensity });
  }

  return {
    domain,
    favicon,
    totalTime,
    totalVisits,
    totalActiveDays: dailyData.length,
    firstUsed,
    lastUsed,
    dailyData,
    heatMapData,
  };
};

// Get trend metrics for a date range
export const getTrendMetrics = async (
  domain: string,
  startDate: string,
  endDate: string
): Promise<import("./types").TrendMetrics> => {
  const data = await getStorageData(null);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Previous period for comparison
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff + 1);

  let activeDays = 0;
  let totalTime = 0;
  let totalVisits = 0;
  let maxDailyTime = 0;
  let maxDailyVisits = 0;
  const dailyTimes: number[] = [];
  const dailyVisits: number[] = [];

  let prevTotalTime = 0;
  let prevTotalVisits = 0;

  Object.keys(data).forEach((key) => {
    if (!key.match(/^\d{4}-\d{2}-\d{2}$/)) return;

    const keyDate = new Date(key);
    const dayData = data[key] as DailyData;

    if (!dayData[domain]) return;

    const siteData = dayData[domain];

    // Current period
    if (keyDate >= start && keyDate <= end) {
      activeDays++;
      totalTime += siteData.time;
      totalVisits += siteData.visitCount || 0;
      dailyTimes.push(siteData.time);
      dailyVisits.push(siteData.visitCount || 0);

      if (siteData.time > maxDailyTime) maxDailyTime = siteData.time;
      if ((siteData.visitCount || 0) > maxDailyVisits)
        maxDailyVisits = siteData.visitCount || 0;
    }

    // Previous period
    if (keyDate >= prevStart && keyDate <= prevEnd) {
      prevTotalTime += siteData.time;
      prevTotalVisits += siteData.visitCount || 0;
    }
  });

  const avgDailyTime =
    dailyTimes.length > 0 ? totalTime / dailyTimes.length : 0;
  const avgDailyVisits =
    dailyVisits.length > 0 ? totalVisits / dailyVisits.length : 0;

  const timeChange =
    prevTotalTime > 0 ? ((totalTime - prevTotalTime) / prevTotalTime) * 100 : 0;
  const visitsChange =
    prevTotalVisits > 0
      ? ((totalVisits - prevTotalVisits) / prevTotalVisits) * 100
      : 0;

  return {
    activeDays,
    totalDays: daysDiff,
    maxDailyTime,
    avgDailyTime,
    maxDailyVisits,
    avgDailyVisits,
    totalTime,
    totalVisits,
    timeChange,
    visitsChange,
  };
};
