import { useState, useEffect } from "react";
import { Timer, Search, ShieldAlert } from "lucide-react";
import { formatDuration, formatDomain } from "../../utils/format";
import { getStorageData, saveLimit } from "../../utils/storage";
import type { Limit } from "../../utils/types";

export const DailyLimitsView = () => {
  const [limits, setLimits] = useState<{ [domain: string]: Limit }>({});
  const [newDomain, setNewDomain] = useState("");
  const [search, setSearch] = useState("");
  const [editingDomain, setEditingDomain] = useState<string | null>(null);

  const fetchData = async () => {
    const limitsData = await getStorageData("limits");
    setLimits(limitsData.limits || {});
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;

    const domain = newDomain
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .split("/")[0];

    // Default limit: 1 hour, notify 80/100, no block
    const defaultLimit: Limit = {
      timeLimit: 60 * 60 * 1000,
      notify80: true,
      notify100: true,
      blockOnLimit: false,
    };

    await saveLimit(domain, defaultLimit);
    setNewDomain("");
    fetchData();
    setEditingDomain(domain); // Auto-open edit mode
  };

  const domainList = Object.keys(limits).sort();
  const filteredDomains = domainList.filter((domain) =>
    domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 pb-4 pr-6 overflow-hidden relative pt-1">
      <div className="flex flex-col gap-6 mb-6 shrink-0">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
          <h3 className="text-lg font-bold mb-2 text-neutral-200 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Add Daily Limit
          </h3>
          <p className="text-sm text-neutral-400 mb-6">
            Add a website to set a daily time limit for it.
          </p>
          <form onSubmit={handleAddDomain} className="flex gap-4">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g. facebook.com"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-neutral-600"
            />
            <button
              type="submit"
              disabled={!newDomain}
              className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Add Website
            </button>
          </form>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search your limits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-4">
        {filteredDomains.map((domain) => (
          <LimitCard
            key={domain}
            domain={domain}
            favicon={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            currentLimit={limits[domain]}
            onSave={fetchData}
            isEditing={editingDomain === domain}
            onEdit={() =>
              setEditingDomain(domain === editingDomain ? null : domain)
            }
            onRemove={async () => {
              await saveLimit(domain, null);
              fetchData();
            }}
          />
        ))}
        {filteredDomains.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500 flex flex-col items-center gap-2">
            <Timer className="w-8 h-8 opacity-20" />
            {domainList.length === 0
              ? "No daily limits set yet."
              : "No websites found matching your search."}
          </div>
        )}
      </div>
    </div>
  );
};

const LimitCard = ({
  domain,
  favicon,
  currentLimit,
  onSave,
  isEditing,
  onEdit,
  onRemove,
}: {
  domain: string;
  favicon: string;
  currentLimit?: Limit;
  onSave: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) => {
  const [minutes, setMinutes] = useState(
    currentLimit ? Math.round(currentLimit.timeLimit / 60000) : 60
  );
  const [notify80, setNotify80] = useState(currentLimit?.notify80 ?? true);
  const [notify100, setNotify100] = useState(currentLimit?.notify100 ?? true);
  const [block, setBlock] = useState(currentLimit?.blockOnLimit ?? false);

  // Reset state when currentLimit changes, only if we have a limit
  useEffect(() => {
    if (!isEditing && currentLimit) {
      setMinutes(Math.round(currentLimit.timeLimit / 60000));
      setNotify80(currentLimit.notify80);
      setNotify100(currentLimit.notify100);
      setBlock(currentLimit.blockOnLimit);
    }
  }, [currentLimit, isEditing]);

  const handleSave = async () => {
    await saveLimit(domain, {
      timeLimit: minutes * 60000,
      notify80,
      notify100,
      blockOnLimit: block,
    });

    onSave();
    onEdit(); // Close edit mode
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isEditing
          ? "bg-white/10 border-white/20"
          : "bg-white/5 border-white/5 hover:border-white/10"
      }`}
    >
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src={favicon}
            className="w-8 h-8 rounded-lg bg-black/20 p-1"
            alt=""
          />
          <div className="min-w-0">
            <div
              className="font-semibold text-sm text-white truncate"
              title={domain}
            >
              {formatDomain(domain)}
            </div>
            <div className="text-xs text-primary font-medium flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {currentLimit
                ? formatDuration(currentLimit.timeLimit)
                : "No Limit"}{" "}
              limit
            </div>
          </div>
        </div>
        <button
          onClick={onEdit}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isEditing
              ? "bg-primary/20 text-primary"
              : "bg-white/5 hover:bg-white/10 text-neutral-300"
          }`}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {isEditing && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-white/5 mt-2 pt-4 animation-in slide-in-from-top-2 duration-200">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={minutes}
              onChange={(e) =>
                setMinutes(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Notify at 80%</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notify80}
                  onChange={(e) => setNotify80(e.target.checked)}
                />
                <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Notify at 100%</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notify100}
                  onChange={(e) => setNotify100(e.target.checked)}
                />
                <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300 flex items-center gap-1.5">
                Block access
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-500" />
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={block}
                  onChange={(e) => setBlock(e.target.checked)}
                />
                <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onRemove}
              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 text-sm font-bold transition-colors"
            >
              Remove
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
