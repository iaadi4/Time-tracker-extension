export interface DailyData {
  [domain: string]: {
    time: number; // milliseconds
    favicon: string;
    lastVisited: number; // timestamp
    visitCount: number; // number of visits per day
    notifications?: NotificationState;
  };
}

export interface NotificationState {
  sent80: boolean;
  sent100: boolean;
}

export interface Limit {
  timeLimit: number; // in milliseconds
  notify80: boolean;
  notify100: boolean;
  blockOnLimit: boolean;
}

export interface Settings {
  trackingDelaySeconds: number; // 1-100, default 15
  theme: string; // Theme color name (e.g. "red-500")
}

export interface StorageData {
  whitelist?: string[];
  settings?: Settings;
  limits?: { [domain: string]: Limit };
  [dateKey: string]:
    | DailyData
    | string[]
    | Settings
    | { [domain: string]: Limit }
    | undefined;
}

export interface AggregatedData {
  totalTime: number;
  byDomain: {
    domain: string;
    time: number;
    favicon: string;
    visitCount: number;
    lastVisited: number;
  }[];
}

export type TimeRange = "today" | "week" | "month" | "year" | "all-time";

export interface Insights {
  mostActiveDay: {
    date: string;
    time: number;
  } | null;
  dailyAverage: number;
}

// Site Analysis types
export interface SiteAnalysisData {
  domain: string;
  favicon: string;
  totalTime: number;
  totalVisits: number;
  totalActiveDays: number;
  firstUsed: string; // date string YYYY-MM-DD
  lastUsed: number; // timestamp

  // Daily breakdown for charts
  dailyData: {
    date: string;
    time: number;
    visits: number;
  }[];

  // Heat map data (last ~26 weeks)
  heatMapData: {
    date: string;
    time: number;
    intensity: number; // 0-4 scale
  }[];
}

export interface TrendMetrics {
  activeDays: number;
  totalDays: number;
  maxDailyTime: number;
  avgDailyTime: number;
  maxDailyVisits: number;
  avgDailyVisits: number;
  totalTime: number;
  totalVisits: number;
  // Comparison to previous period
  timeChange: number; // percentage
  visitsChange: number; // percentage
}
