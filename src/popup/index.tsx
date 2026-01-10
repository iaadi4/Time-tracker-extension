/**
 * Popup - Toolbar widget for quick stats view
 *
 * Shows today's total browsing time, top 3 sites, and a link to the full dashboard.
 * Refreshes every second to show live tracking updates.
 */
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { getAggregatedData } from "../utils/storage";
import { formatDuration } from "../utils/format";
import { Maximize2, Activity } from "lucide-react";
import "../index.css";

const MOTIVATIONAL_QUOTES = [
  "Time is what we want most, but use worst.",
  "Until we can manage time, we can manage nothing else.",
  "Lost time is never found again.",
  "The key is not spending time, but investing it.",
  "Time is the coin of your life. Only you can determine how it will be spent.",
  "Either you run the day, or the day runs you.",
  "Focus on what matters. Let go of what doesn't.",
  "Small disciplines repeated with consistency lead to great achievements.",
  "Productivity is never an accident. It's the result of commitment to excellence.",
  "What gets measured gets managed.",
];

export function Sidebar() {
  const [totalTime, setTotalTime] = useState(0);
  const [topSites, setTopSites] = useState<
    { domain: string; time: number; favicon: string }[]
  >([]);
  const [quote] = useState(() => {
    return MOTIVATIONAL_QUOTES[
      Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
    ];
  });

  const applyTheme = (themeId: string) => {
    import("../utils/themes").then(({ THEMES }) => {
      const theme = THEMES.find((t) => t.id === themeId);
      if (theme) {
        const root = document.documentElement;
        root.style.setProperty("--primary", theme.primary);
        root.style.setProperty("--ring", theme.ring);
      }
    });
  };

  useEffect(() => {
    const fetchSettingsAndData = async () => {
      const settingsData = await import("../utils/storage").then((m) =>
        m.getSettings()
      );
      if (settingsData.theme) {
        applyTheme(settingsData.theme);
      }

      const data = await getAggregatedData("today");
      setTotalTime(data.totalTime);
      setTopSites(data.byDomain.slice(0, 3));
    };

    fetchSettingsAndData();
    const interval = setInterval(async () => {
      const data = await getAggregatedData("today");
      setTotalTime(data.totalTime);
      setTopSites(data.byDomain.slice(0, 3));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const openDashboard = () => {
    chrome.tabs.create({ url: "dashboard.html" });
  };

  return (
    <div className="w-full h-full p-0 bg-black text-white flex flex-col font-sans selection:bg-primary/30 overflow-hidden relative">
      <div className="px-6 py-4 flex-1 flex flex-col relative z-10">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <img
              src="/icon_white.png"
              className="w-8 h-8 rounded-lg"
              alt="Logo"
            />
            <span>Time Tracker</span>
          </h1>
          <div
            className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            style={{ boxShadow: `0 0 10px hsl(var(--primary) / 0.5)` }}
          ></div>
        </header>

        <div className="glass-panel p-6 rounded-2xl mb-6 text-center shadow-lg border-white/10 bg-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3 relative z-10">
            Today's Browsing
          </h2>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 relative z-10">
            {formatDuration(totalTime)}
          </div>
          <p className="text-xs text-neutral-500 mt-2 relative z-10">
            Total active time today
          </p>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
              <Activity className="w-3 h-3 text-primary" />
              Top Sites
            </h3>
          </div>

          <div className="space-y-2">
            {topSites.map((site, idx) => (
              <div
                key={site.domain}
                className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xs font-mono text-neutral-600 w-3">
                    {idx + 1}
                  </span>
                  <img
                    src={
                      site.favicon ||
                      `https://www.google.com/s2/favicons?domain=${site.domain}`
                    }
                    className="w-4 h-4 rounded-sm opacity-60 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all"
                    alt=""
                  />
                  <span className="truncate font-medium text-sm text-neutral-300 group-hover:text-white transition-colors">
                    {site.domain}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-primary/80 group-hover:text-primary">
                  {formatDuration(site.time)}
                </span>
              </div>
            ))}
            {topSites.length === 0 && (
              <div className="text-center text-neutral-600 py-6 text-sm italic">
                Start browsing to track stats.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 mt-auto pt-4 text-center">
          <p className="text-xs text-neutral-500 font-medium italic mb-3">
            "{quote}"
          </p>
          <button
            onClick={openDashboard}
            className="w-full py-3 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Full Dashboard</span>
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sidebar />
  </React.StrictMode>
);
