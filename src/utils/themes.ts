/**
 * Application themes
 *
 * Maps theme names to their HSL color values.
 * Used for dynamic theming of the application.
 */

export interface Theme {
  id: string;
  name: string;
  color: string; // Tailwind class for preview (e.g., bg-red-400)
  primary: string; // HSL value for primary color
  ring: string; // HSL value for focus rings
}

export const THEMES: Theme[] = [
  {
    id: "red-500",
    name: "Red",
    color: "bg-red-500",
    primary: "0 84.2% 60.2%",
    ring: "0 84.2% 60.2%",
  },
  {
    id: "orange-500",
    name: "Orange",
    color: "bg-orange-500",
    primary: "24.6 95% 53.1%",
    ring: "24.6 95% 53.1%",
  },
  {
    id: "amber-500",
    name: "Amber",
    color: "bg-amber-500",
    primary: "45.4 93.4% 47.5%",
    ring: "45.4 93.4% 47.5%",
  },
  {
    id: "yellow-500",
    name: "Yellow",
    color: "bg-yellow-500",
    primary: "47.9 95.8% 53.1%",
    ring: "47.9 95.8% 53.1%",
  },
  {
    id: "lime-500",
    name: "Lime",
    color: "bg-lime-500",
    primary: "84.8 85.2% 51.4%",
    ring: "84.8 85.2% 51.4%",
  },
  {
    id: "green-500",
    name: "Green",
    color: "bg-green-500",
    primary: "142.1 76.2% 36.3%",
    ring: "142.1 76.2% 36.3%",
  },
  {
    id: "emerald-500",
    name: "Emerald",
    color: "bg-emerald-500",
    primary: "160.1 84.1% 39.4%",
    ring: "160.1 84.1% 39.4%",
  },
  {
    id: "teal-500",
    name: "Teal",
    color: "bg-teal-500",
    primary: "173.4 80.4% 40%",
    ring: "173.4 80.4% 40%",
  },
  {
    id: "cyan-500",
    name: "Cyan",
    color: "bg-cyan-500",
    primary: "188.7 94.5% 42.7%",
    ring: "188.7 94.5% 42.7%",
  },
  {
    id: "sky-500",
    name: "Sky",
    color: "bg-sky-500",
    primary: "198.6 88.7% 48.4%",
    ring: "198.6 88.7% 48.4%",
  },
  {
    id: "blue-500",
    name: "Blue",
    color: "bg-blue-500",
    primary: "217.2 91.2% 59.8%",
    ring: "221.2 83.2% 53.3%",
  },
  {
    id: "indigo-500",
    name: "Indigo",
    color: "bg-indigo-500",
    primary: "238.7 83.5% 66.7%",
    ring: "238.7 83.5% 66.7%",
  },
  {
    id: "violet-500",
    name: "Violet",
    color: "bg-violet-500",
    primary: "258.3 89.5% 66.3%",
    ring: "258.3 89.5% 66.3%",
  },
  {
    id: "purple-500",
    name: "Purple",
    color: "bg-purple-500",
    primary: "271.5 81.3% 55.9%",
    ring: "271.5 81.3% 55.9%",
  },
  {
    id: "fuchsia-500",
    name: "Fuchsia",
    color: "bg-fuchsia-500",
    primary: "292.2 84.1% 60.6%",
    ring: "292.2 84.1% 60.6%",
  },
  {
    id: "pink-500",
    name: "Pink",
    color: "bg-pink-500",
    primary: "330.4 81.2% 60.4%",
    ring: "330.4 81.2% 60.4%",
  },
  {
    id: "rose-500",
    name: "Rose",
    color: "bg-rose-500",
    primary: "349.7 79.2% 59.8%",
    ring: "349.7 79.2% 59.8%",
  },
];
