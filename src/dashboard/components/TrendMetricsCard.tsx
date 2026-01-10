import React from "react";
import { formatDuration } from "../../utils/format";
import type { TrendMetrics } from "../../utils/types";
import {
  Calendar,
  Clock,
  Trophy,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface TrendMetricsCardProps {
  metrics: TrendMetrics;
}

export const TrendMetricsCard: React.FC<TrendMetricsCardProps> = ({
  metrics,
}) => {
  const cards = [
    {
      label: "Active Days",
      value: metrics.activeDays,
      subtext: "Days visited",
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Max Daily Time",
      value: formatDuration(metrics.maxDailyTime),
      subtext: "Personal best",
      icon: Trophy,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Avg Daily Time",
      value: formatDuration(metrics.avgDailyTime),
      subtext: (
        <span className="flex items-center gap-1 text-primary">
          {metrics.timeChange >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(metrics.timeChange).toFixed(0)}% vs prev
        </span>
      ),
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Max Visits",
      value: metrics.maxDailyVisits,
      subtext: "Peak traffic",
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Avg Visits",
      value: metrics.avgDailyVisits.toFixed(1),
      subtext: (
        <span className="flex items-center gap-1 text-primary">
          {metrics.visitsChange >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(metrics.visitsChange).toFixed(1)}% vs prev
        </span>
      ),
      icon: Activity,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col hover:bg-white/[0.07] transition-colors relative overflow-hidden group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-auto">
            <div className="text-2xl font-bold text-white mb-1 tracking-tight">
              {card.value}
            </div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              {card.label}
            </div>
            <div className="text-xs text-neutral-500 font-medium">
              {card.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
