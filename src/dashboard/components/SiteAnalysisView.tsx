import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ExternalLink } from "lucide-react";
import { formatDuration, formatDomain } from "../../utils/format";
import { getSiteAnalysisData, getTrendMetrics } from "../../utils/storage";
import type { SiteAnalysisData, TrendMetrics } from "../../utils/types";
import { ActivityHeatMap } from "./ActivityHeatMap";
import { TrendMetricsCard } from "./TrendMetricsCard";
import { BrowsingTrendsChart, VisitTrendsChart } from "./Charts";

interface SiteAnalysisViewProps {
  domain: string;
  onBack: () => void; // Kept for interface compatibility but unused in view
}

const toLocalDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const SiteAnalysisView: React.FC<SiteAnalysisViewProps> = ({
  domain,
}) => {
  const [data, setData] = useState<SiteAnalysisData | null>(null);
  const [trendMetrics, setTrendMetrics] = useState<TrendMetrics | null>(null);
  const [trendRange, setTrendRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const result = await getSiteAnalysisData(domain);
      setData(result);

      if (result) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 14);

        const startStr = toLocalDateStr(start);
        const endStr = toLocalDateStr(end);

        setTrendRange({ start: startStr, end: endStr });
        const metrics = await getTrendMetrics(domain, startStr, endStr);
        setTrendMetrics(metrics);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [domain]);

  // Update metrics when range changes
  useEffect(() => {
    if (domain && trendRange.start && trendRange.end) {
      getTrendMetrics(domain, trendRange.start, trendRange.end).then(
        setTrendMetrics
      );
    }
  }, [trendRange, domain]);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500 animate-pulse">
        Loading analysis...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 pb-4 pr-6 overflow-y-auto relative pt-1">
      <div className="flex flex-col xl:flex-row gap-5 mb-5 mt-4">
        <div className="w-full xl:w-[350px] flex flex-col gap-4 shrink-0">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Site Summary
                </span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={data.favicon}
                  className="w-16 h-16 rounded-2xl bg-black/20 p-2 shadow-inner"
                  alt=""
                />
                <div className="overflow-hidden">
                  <h1
                    className="text-2xl font-bold text-white mb-1 truncate"
                    title={domain}
                  >
                    {formatDomain(domain)}
                  </h1>
                  <a
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    Visit Site <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-neutral-500 mb-1">Total Time</div>
                <div className="text-lg font-bold text-white">
                  {formatDuration(data.totalTime)}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-neutral-500 mb-1">Active Days</div>
                <div className="text-lg font-bold text-white">
                  {data.totalActiveDays}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-neutral-500 mb-1">Visits</div>
                <div className="text-lg font-bold text-white">
                  {data.totalVisits}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-neutral-500 mb-1">First Seen</div>
                <div
                  className="text-sm font-medium text-white truncate"
                  title={data.firstUsed}
                >
                  {data.firstUsed}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/5 overflow-hidden min-h-[270px]">
          <ActivityHeatMap data={data.heatMapData} />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-neutral-200">Trends</h3>
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 w-fit">
            <div className="px-3 py-1.5 rounded-md bg-white/10 text-xs font-medium text-white flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
              {trendRange.start} - {trendRange.end}
            </div>
          </div>
        </div>
        {trendMetrics && <TrendMetricsCard metrics={trendMetrics} />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-6">
        <div className="xl:col-span-3 p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center space-y-8">
          <div>
            <div className="text-sm text-neutral-400 mb-1">Period Time</div>
            <div className="text-3xl font-bold text-white mb-2">
              {formatDuration(trendMetrics?.totalTime || 0)}
            </div>
            <div className="text-xs font-medium text-primary">
              {trendMetrics?.timeChange && trendMetrics.timeChange > 0
                ? "+"
                : ""}
              {formatDuration(
                Math.abs(
                  (trendMetrics?.totalTime || 0) *
                    ((trendMetrics?.timeChange || 0) / 100)
                )
              )}
              <span className="text-neutral-500 ml-1 font-normal">vs prev</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-400 mb-1">Period Visits</div>
            <div className="text-3xl font-bold text-white mb-2">
              {trendMetrics?.totalVisits}
            </div>
            <div className="text-xs font-medium text-primary">
              {trendMetrics?.visitsChange && trendMetrics.visitsChange > 0
                ? "+"
                : ""}
              {trendMetrics?.visitsChange.toFixed(1)}%
              <span className="text-neutral-500 ml-1 font-normal">vs prev</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 p-6 rounded-2xl bg-white/5 border border-white/5 min-h-[270px]">
          <BrowsingTrendsChart
            data={data.dailyData.filter(
              (d) => d.date >= trendRange.start && d.date <= trendRange.end
            )}
          />
        </div>

        <div className="xl:col-span-4 p-6 rounded-2xl bg-white/5 border border-white/5 min-h-[270px]">
          <VisitTrendsChart
            data={data.dailyData.filter(
              (d) => d.date >= trendRange.start && d.date <= trendRange.end
            )}
          />
        </div>
      </div>
    </div>
  );
};
