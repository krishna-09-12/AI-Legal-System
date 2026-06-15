import { useEffect, useState } from "react";
import { getHistory } from "../lib/api";
import { RefreshCw, Clock, FileText, Activity } from "lucide-react";

export default function History({ onSelectReport, refreshTrigger, globalTaskActive, setGlobalTaskActive }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      if (setGlobalTaskActive) setGlobalTaskActive(true);
      const res = await getHistory();
      setData(res);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
      if (setGlobalTaskActive) setGlobalTaskActive(false);
    }
  };

  const handleCardClick = (item, index) => {
    if (globalTaskActive) return;
    setActiveIndex(index);
    if (onSelectReport) {
      onSelectReport(item);
    }
  };

  const getSeverityBadgeClass = (level) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className={`glass p-6 rounded-3xl border border-slate-800/80 transition-all duration-300 hover:border-slate-700 max-w-7xl mx-auto m-4 md:m-8 ${globalTaskActive ? 'opacity-70 pointer-events-none' : ''}`}>
      
      {/* Title block */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold tracking-tight text-white">Complaint Registry History</h2>
        </div>
        
        <button
          onClick={fetchHistory}
          disabled={loading || globalTaskActive}
          className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl border border-slate-800/60 transition disabled:opacity-50"
          title="Refresh history log"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          <span>Synchronizing records database...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm leading-relaxed border border-dashed border-slate-800/50 rounded-2xl">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          No complaints registered in this session.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">
          {data.map((item, index) => {
            const dateStr = item.timestamp 
              ? new Date(item.timestamp).toLocaleString()
              : "Recent date";
            
            // Format input text to truncate
            const inputSnippet = item.input_text || item.text || "";
            const truncatedSnippet = inputSnippet.length > 80
              ? inputSnippet.substring(0, 80) + "..."
              : inputSnippet;

            const isSelected = activeIndex === index;

            return (
              <div
                key={item._id || index}
                onClick={() => handleCardClick(item, index)}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between rainbow-hover ${
                  isSelected
                    ? "bg-indigo-950/20 border-indigo-500/50 shadow-[0_4px_20px_rgba(99,102,241,0.15)]"
                    : "bg-slate-900/20 border-slate-800/60 hover:bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div className="space-y-2.5">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-black text-slate-400 tracking-wider font-mono">
                      {item.complaint_id || `ALS-REF-${index}`}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase border ${getSeverityBadgeClass(item.severity_level)}`}>
                      {item.severity_level || "Medium"}
                    </span>
                  </div>

                  {/* Body Text */}
                  <p className="text-xs text-slate-300 font-medium leading-relaxed italic line-clamp-2">
                    "{truncatedSnippet}"
                  </p>

                </div>

                {/* Footer details */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-indigo-400" />
                    {item.category || "General"}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {dateStr.split(",")[0]}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}