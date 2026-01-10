/**
 * Dashboard - Main analytics view for the Time Tracker extension
 *
 * Views:
 * - dashboard: Shows stats, charts, and detailed activity list
 * - whitelist: Manage excluded domains
 * - settings: Configure tracking delay
 */
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  getAggregatedData,
  getInsights,
  getStorageData,
  addToWhitelist,
  removeFromWhitelist,
  getSettings,
  setSettings,
} from "../utils/storage";
import type { TimeRange, AggregatedData, Insights } from "../utils/types";
import {
  formatDuration,
  formatDurationLong,
  formatDomain,
} from "../utils/format";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Calendar,
  Clock,
  LayoutGrid,
  Shield,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  Trash2,
  Plus,
  ArrowLeft,
  PanelLeft,
  Settings as SettingsIcon,
} from "lucide-react";
import { SiteAnalysisView } from "./components/SiteAnalysisView";
import "../index.css";

export function Dashboard() {
  const [range, setRange] = useState<TimeRange>("today");
  const [data, setData] = useState<AggregatedData>({
    totalTime: 0,
    byDomain: [],
  });
  const [insights, setInsights] = useState<Insights>({
    mostActiveDay: null,
    dailyAverage: 0,
  });
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [view, setView] = useState<
    "dashboard" | "whitelist" | "settings" | "site-analysis"
  >(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    return v === "whitelist" || v === "settings" || v === "site-analysis"
      ? v
      : "dashboard";
  });
  const [selectedDomain, setSelectedDomain] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("domain") || null;
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== "dashboard") params.set("view", view);
    if (selectedDomain) params.set("domain", selectedDomain);

    const newUrl = `${window.location.pathname}${
      params.toString() ? "?" + params.toString() : ""
    }`;
    window.history.replaceState(null, "", newUrl);
  }, [view, selectedDomain]);

  const [trackingDelay, setTrackingDelay] = useState(15);
  const [currentThemeId, setCurrentThemeId] = useState("blue-500");
  const [currentThemeName, setCurrentThemeName] = useState("Blue");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Lazy load themes to avoid circular dependencies
  const [themes, setThemes] = useState<import("../utils/themes").Theme[]>([]);
  useEffect(() => {
    import("../utils/themes").then(({ THEMES }) => setThemes(THEMES));
  }, []);

  // Theme-based colors for charts (varied hues for distinction)
  const getThemeColors = () => {
    const activeTheme = themes.find((t) => t.id === currentThemeId);
    if (!activeTheme)
      return [
        "hsl(var(--primary))",
        "hsl(var(--primary))",
        "hsl(var(--primary))",
        "hsl(var(--primary))",
        "hsl(var(--primary))",
        "hsl(var(--primary))",
      ];

    // Parse HSL from the theme string "H S% L%"
    const [h, s, l] = activeTheme.primary.split(" ").map((v) => parseFloat(v));

    // Generate variations by rotating hue and adjusting lightness
    return [
      `hsl(${h} ${s}% ${l}%)`, // Base
      `hsl(${(h + 30) % 360} ${s}% ${l}%)`, // Analogous 1
      `hsl(${(h + 60) % 360} ${s}% ${l}%)`, // Analogous 2
      `hsl(${(h + 150) % 360} ${s}% ${l}%)`, // Complementaryish
      `hsl(${(h + 180) % 360} ${s}% ${l}%)`, // Complementary
      `hsl(${(h + 210) % 360} ${s}% ${l}%)`, // Triadic
      `hsl(${(h + 270) % 360} ${s}% ${l}%)`, // Tetradic
      `hsl(${(h + 330) % 360} ${s}% ${l}%)`, // Analogous 3
    ];
  };

  const applyTheme = (themeId: string) => {
    import("../utils/themes").then(({ THEMES }) => {
      const theme = THEMES.find((t) => t.id === themeId);
      if (theme) {
        const root = document.documentElement;
        root.style.setProperty("--primary", theme.primary);
        root.style.setProperty("--ring", theme.ring);
        setCurrentThemeName(theme.name);
      }
    });
  };

  const fetchData = async () => {
    const result = await getAggregatedData(range);
    const insightsResult = await getInsights(range);
    const whitelistData = await getStorageData("whitelist");
    setData(result);
    setInsights(insightsResult);
    setWhitelist(whitelistData.whitelist || []);
  };

  const fetchSettings = async () => {
    const settingsData = await getSettings();
    setTrackingDelay(settingsData.trackingDelaySeconds);
    if (settingsData.theme) {
      setCurrentThemeId(settingsData.theme);
      applyTheme(settingsData.theme);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [range]);

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain) {
      await addToWhitelist(newDomain);
      setNewDomain("");
      await fetchData();
    }
  };

  const handleRemoveWhitelist = async (domain: string) => {
    await removeFromWhitelist(domain);
    await fetchData();
  };

  const handleSaveSettings = async () => {
    await setSettings({
      trackingDelaySeconds: trackingDelay,
      theme: currentThemeId,
    });
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentThemeId(themeId);
    applyTheme(themeId);
    // Auto-save theme preference for better UX
    setSettings({
      trackingDelaySeconds: trackingDelay,
      theme: themeId,
    });
  };

  const navItems = [
    { id: "today", label: "Today", icon: Clock },
    { id: "week", label: "Week", icon: Calendar },
    { id: "month", label: "Month", icon: Calendar },
    { id: "all-time", label: "All Time", icon: LayoutGrid },
  ];

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const THEME_COLORS = getThemeColors();

  return (
    <div className="h-screen bg-black text-white font-sans flex relative overflow-hidden selection:bg-primary/30">
      <aside
        className={`${
          isSidebarCollapsed ? "w-20" : "w-72"
        } h-full pt-8 pb-4 px-4 flex flex-col gap-6 border-r border-white/10 relative z-10 bg-black overflow-y-auto transition-all duration-300 ease-in-out`}
      >
        <div
          className={`flex items-center gap-3 px-2 ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <img
            src="/icon_white.png"
            className="w-10 h-10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity rounded-lg"
            alt="Logo"
            onClick={toggleSidebar}
            title="Toggle Sidebar"
          />
          {!isSidebarCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-bold text-xl tracking-tight">Time Tracker</h1>
              <p className="text-xs text-neutral-500 font-medium">
                Browsing Tracker
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {!isSidebarCollapsed && (
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 px-2">
              Time Range
            </div>
          )}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setRange(item.id as TimeRange);
                setView("dashboard");
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                range === item.id && view === "dashboard"
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              } ${isSidebarCollapsed ? "justify-center" : ""}`}
              title={isSidebarCollapsed ? item.label : ""}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${
                  range === item.id && view === "dashboard"
                    ? "text-primary"
                    : ""
                }`}
              />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}

          <div className="my-8 border-t border-white/5 mx-2"></div>

          {!isSidebarCollapsed && (
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 px-2">
              Configuration
            </div>
          )}
          <button
            onClick={() => setView("whitelist")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              view === "whitelist"
                ? "bg-white/10 text-white shadow-inner"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            } ${isSidebarCollapsed ? "justify-center" : ""}`}
            title={isSidebarCollapsed ? "Excluded Sites" : ""}
          >
            <Shield
              className={`w-5 h-5 flex-shrink-0 ${
                view === "whitelist" ? "text-primary" : ""
              }`}
            />
            {!isSidebarCollapsed && <span>Excluded Sites</span>}
          </button>
          <button
            onClick={() => setView("settings")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              view === "settings"
                ? "bg-white/10 text-white shadow-inner"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            } ${isSidebarCollapsed ? "justify-center" : ""}`}
            title={isSidebarCollapsed ? "Settings" : ""}
          >
            <SettingsIcon
              className={`w-5 h-5 flex-shrink-0 ${
                view === "settings" ? "text-primary" : ""
              }`}
            />
            {!isSidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>

        <button
          onClick={toggleSidebar}
          className={`mt-auto w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isSidebarCollapsed
              ? "justify-center text-primary hover:bg-white/5"
              : "text-neutral-400 hover:bg-white/5 hover:text-white"
          }`}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <PanelLeft
            className={`w-5 h-5 flex-shrink-0 ${
              isSidebarCollapsed ? "text-primary" : ""
            }`}
          />
          {!isSidebarCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </aside>

      <main className="flex-1 pl-6 py-6 pr-0 flex flex-col overflow-hidden relative z-10">
        <header className="mb-8 pr-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              {view === "dashboard" && "Your Performance"}
              {view === "whitelist" && "Excluded Sites"}
              {view === "site-analysis" && "Site Analysis"}
              {view === "settings" && "Settings"}
            </h2>
            <p className="text-neutral-400 font-medium">
              {view === "dashboard" &&
                `Deep dive into your focus metrics for ${range.replace(
                  "-",
                  " "
                )}.`}
              {view === "whitelist" && "Manage websites that won't be tracked."}
              {view === "settings" &&
                "Configure how the extension tracks your time."}
              {view === "site-analysis" &&
                "Detailed analytics for a specific website."}
            </p>
          </div>

          {view === "site-analysis" && (
            <button
              onClick={() => {
                setView("dashboard");
                setSelectedDomain(null);
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 hover:border-white/10 transition-all flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </header>

        {view === "dashboard" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-6 pb-2 pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Total Browsing
                </h3>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {formatDuration(data.totalTime)}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  {range === "today" ? "Avg Per Site" : "Daily Average"}
                </h3>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {range === "today"
                    ? formatDuration(
                        data.byDomain.length > 0
                          ? Math.round(data.totalTime / data.byDomain.length)
                          : 0
                      )
                    : formatDuration(Math.round(insights.dailyAverage))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  Most Visited
                </h3>
                <div className="text-xl font-bold truncate text-white">
                  {formatDomain(data.byDomain[0]?.domain || "-")}
                </div>
                <div className="text-xs text-neutral-400 mt-1 font-mono">
                  {data.byDomain[0]
                    ? formatDuration(data.byDomain[0].time)
                    : ""}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Unique Sites
                </h3>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {data.byDomain.length}
                </div>
              </div>
            </div>

            {range !== "today" && insights.mostActiveDay && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/20 text-primary">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary/80">
                      Most Active Day
                    </div>
                    <div className="text-white font-bold text-lg">
                      {insights.mostActiveDay.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-400">Total Duration</div>
                  <div className="text-2xl font-bold text-white">
                    {formatDuration(insights.mostActiveDay.time)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col relative overflow-hidden h-full">
                <h3 className="text-lg font-bold mb-6 text-neutral-200">
                  Distribution
                </h3>
                <div className="flex-1 min-h-[250px] relative z-10 flex items-center gap-4">
                  <div className="w-2/3 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.byDomain.slice(0, 8).map((d) => ({
                            ...d,
                            domain: formatDomain(d.domain),
                          }))}
                          dataKey="time"
                          nameKey="domain"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          stroke="none"
                        >
                          {data.byDomain.slice(0, 8).map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={THEME_COLORS[index % THEME_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(
                            value:
                              | number
                              | string
                              | ReadonlyArray<number | string>
                              | null
                              | undefined
                          ) => [formatDuration(Number(value) || 0), "Time"]}
                          contentStyle={{
                            backgroundColor: "#09090b",
                            borderColor: "rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            color: "#fff",
                          }}
                          itemStyle={{ color: "#e4e4e7" }}
                          cursor={{ fill: "transparent" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-1/3 max-h-full overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {data.byDomain.slice(0, 8).map((d, i) => (
                      <div
                        key={d.domain}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              THEME_COLORS[i % THEME_COLORS.length],
                          }}
                        ></div>
                        <span
                          className="truncate text-neutral-300 font-medium"
                          title={d.domain}
                        >
                          {formatDomain(d.domain)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col h-full overflow-hidden">
                <h3 className="text-lg font-bold mb-6 text-neutral-200 flex-shrink-0">
                  Detailed Activity
                </h3>
                <div className="flex-1 overflow-y-scroll pr-2 space-y-3">
                  {data.byDomain.map((site, index) => (
                    <div
                      key={site.domain}
                      onClick={() => {
                        setSelectedDomain(site.domain);
                        setView("site-analysis");
                      }}
                      className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-4 overflow-hidden flex-1">
                        <span className="text-xs font-mono text-neutral-600 w-6 group-hover:text-primary transition-colors flex-shrink-0">
                          {index + 1}
                        </span>
                        <img
                          src={
                            site.favicon ||
                            `https://www.google.com/s2/favicons?domain=${site.domain}`
                          }
                          className="w-8 h-8 rounded-lg bg-black/50 p-1 opacity-70 group-hover:opacity-100 transition-all grayscale group-hover:grayscale-0 flex-shrink-0"
                          alt=""
                        />
                        <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                          <span className="truncate font-semibold text-sm text-neutral-300 group-hover:text-white transition-colors">
                            {formatDomain(site.domain)}
                          </span>
                          <div className="h-1.5 w-full bg-neutral-800 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  (site.time / (data.byDomain[0]?.time || 1)) *
                                    100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold text-neutral-500 group-hover:text-primary transition-colors whitespace-nowrap ml-4">
                        {formatDurationLong(site.time)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "whitelist" && (
          <div className="space-y-6 pr-6">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/5">
              <h3 className="text-lg font-bold mb-2 text-neutral-200 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Excluded Domains
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                Add domains that should not be tracked. Time spent on these
                sites won't count towards your stats.
              </p>
              <form onSubmit={handleAddWhitelist} className="flex gap-4">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-neutral-600"
                />
                <button
                  type="submit"
                  disabled={!newDomain}
                  className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Domain
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {whitelist.map((domain) => (
                <div
                  key={domain}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-colors"
                >
                  <span className="font-medium text-neutral-300">
                    {formatDomain(domain)}
                  </span>
                  <button
                    onClick={() => handleRemoveWhitelist(domain)}
                    className="p-2 rounded-lg text-neutral-500 hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {whitelist.length === 0 && (
                <div className="col-span-full p-8 text-center text-neutral-500 border border-dashed border-white/10 rounded-xl">
                  No excluded domains yet.
                </div>
              )}
            </div>
          </div>
        )}

        {view === "settings" && (
          <div className="space-y-6 pr-6">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/5">
              <h3 className="text-lg font-bold mb-2 text-neutral-200 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                Tracking Delay
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                Set how many seconds you need to stay on a website before it
                starts counting towards your tracked time. This helps filter out
                quick visits.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={trackingDelay}
                  onChange={(e) => {
                    const val = Math.min(
                      100,
                      Math.max(1, parseInt(e.target.value) || 1)
                    );
                    setTrackingDelay(val);
                  }}
                  className="w-24 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-primary/50 transition-colors"
                />
                <span className="text-neutral-400">seconds</span>
                <button
                  onClick={handleSaveSettings}
                  className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 ml-auto"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-neutral-200 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                    Appearance
                  </h3>
                  <p className="text-sm text-neutral-400 mb-6">
                    Customize the look and feel of the extension.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-neutral-300">
                        Accent Color
                      </div>
                      <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                        {currentThemeName}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeChange(theme.id)}
                          className={`
                          w-10 h-10 rounded-full cursor-pointer transition-all flex items-center justify-center relative group
                          ${theme.color}
                          ${
                            currentThemeId === theme.id
                              ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg shadow-white/10"
                              : "hover:scale-110 opacity-70 hover:opacity-100"
                          }
                        `}
                          title={theme.name}
                        >
                          {currentThemeId === theme.id && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="w-full lg:w-72 shrink-0 lg:mt-0">
                  <div className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">
                    Preview
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
                    <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      Daily Average
                    </h3>
                    <div className="text-2xl font-bold text-white tracking-tight mb-4">
                      2h 45m
                    </div>

                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-primary w-2/3 rounded-full"></div>
                    </div>

                    <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {view === "site-analysis" && selectedDomain && (
          <SiteAnalysisView
            domain={selectedDomain}
            onBack={() => {
              setView("dashboard");
              setSelectedDomain(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
