import React from "react";
import { formatDuration } from "../../utils/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartProps {
  data: {
    date: string;
    time: number;
    visits: number;
  }[];
}

export const BrowsingTrendsChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-full w-full">
      <h3 className="text-sm font-medium text-neutral-400 mb-4 text-center">
        Browsing Time Trends
      </h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff10"
              vertical={false}
            />
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
              formatter={(value: any) => [
                formatDuration(Number(value) || 0),
                "Time",
              ]}
              labelStyle={{ color: "#a1a1aa" }}
              cursor={{ stroke: "rgba(255,255,255,0.2)" }}
            />
            <Area
              type="monotone"
              dataKey="time"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTime)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const VisitTrendsChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-full w-full">
      <h3 className="text-sm font-medium text-neutral-400 mb-4 text-center">
        Visit Trends
      </h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff10"
              vertical={false}
            />
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
              formatter={(value: any) => [Number(value) || 0, "Visits"]}
              labelStyle={{ color: "#a1a1aa" }}
              cursor={{ stroke: "rgba(255,255,255,0.2)" }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVisits)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
