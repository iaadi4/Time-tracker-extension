import React from "react";
import { formatDuration } from "../../utils/format";

interface ActivityHeatMapProps {
  data: {
    date: string;
    time: number;
    intensity: number;
  }[];
}

export const ActivityHeatMap: React.FC<ActivityHeatMapProps> = ({ data }) => {
  // Group data by week for the grid layout
  // 7 rows (days), ~26 columns (weeks)
  const weeks: { date: string; time: number; intensity: number }[][] = [];
  let currentWeek: { date: string; time: number; intensity: number }[] = [];

  // Assuming data is sorted by date ascending
  // Pad the beginning to start on Sunday if needed
  if (data.length > 0) {
    const firstDate = new Date(data[0].date);
    const dayOfWeek = firstDate.getDay(); // 0 = Sunday
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ date: "", time: 0, intensity: -1 }); // Placeholder
    }
  }

  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return "bg-white/5";
      case 1:
        return "bg-primary/20";
      case 2:
        return "bg-primary/40";
      case 3:
        return "bg-primary/70";
      case 4:
        return "bg-primary";
      default:
        return "bg-transparent"; // Placeholder
    }
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Calculate month labels positions
  const monthLabels: { label: string; index: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, index) => {
    const validDay = week.find((d) => d.date);
    if (validDay) {
      const date = new Date(validDay.date);
      const month = date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: months[month], index });
        lastMonth = month;
      }
    }
  });

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-neutral-400">
          Activity in Recent Weeks
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center w-full overflow-hidden">
        {/* Month Labels */}
        <div className="flex mb-2 pl-8 text-xs text-neutral-500 font-mono w-full">
          <div className="flex gap-1 w-full">
            {weeks.map((_, i) => {
              const label = monthLabels.find((l) => l.index === i);
              return (
                <div
                  key={i}
                  className="flex-1 text-center relative min-w-[12px]"
                >
                  {label && (
                    <span className="absolute left-0 top-0 whitespace-nowrap">
                      {label.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 w-full">
          {/* Day Labels */}
          <div className="flex flex-col gap-1 text-[10px] text-neutral-600 font-mono justify-between py-1 shrink-0">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid */}
          <div className="flex gap-1 flex-1">
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="flex flex-col gap-1 flex-1 min-w-[12px]"
              >
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-full aspect-square rounded-sm ${getIntensityColor(
                      day.intensity
                    )} transition-all duration-200 group relative hover:z-50`}
                  >
                    {/* Tooltip */}
                    {day.date && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                        <div className="bg-neutral-900 border border-white/10 rounded-lg py-1 px-2 text-xs whitespace-nowrap shadow-xl">
                          <div className="font-bold text-white">{day.date}</div>
                          <div className="text-neutral-400">
                            {formatDuration(day.time)}
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
