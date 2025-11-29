// pages/CallHistory.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:4000";

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0s";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

const CallHistory = ({ swapId, user, reload }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!swapId || !user?._id) return;

    const fetchCalls = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE}/api/calls/by-swap/${swapId}`,
          { withCredentials: true }
        );
        if (res.data?.success) setCalls(res.data.calls || []);
      } catch (err) {
        console.error("fetchCalls error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [swapId, user?._id, reload]);

  if (!swapId) return null;

  return (
    <div className="mt-4 bg-white/80 rounded-2xl shadow p-4 border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        Call History for this Swap
      </h4>

      {loading ? (
        <p className="text-xs text-gray-500">Loading call history...</p>
      ) : calls.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          No calls recorded for this swap yet.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {calls.map((call) => {
            const youId = String(user._id || user.UserId || "").toLowerCase();
            const callerId = String(
              call.callerId?._id || call.callerId
            ).toLowerCase();
            const receiverId = String(
              call.receiverId?._id || call.receiverId
            ).toLowerCase();

            const isOutgoing = callerId === youId;
            const other =
              isOutgoing ? call.receiverId?.Username : call.callerId?.Username;

            const status = call.status || "unknown";
            const started =
              call.startedAt && new Date(call.startedAt).toLocaleString();
            const durationLabel =
              status === "missed"
                ? "Missed"
                : formatDuration(call.durationSeconds);

            return (
              <div
                key={call._id}
                className="flex items-center justify-between text-[11px] bg-gray-50 rounded-xl px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-gray-700">
                    {isOutgoing ? "Outgoing" : "Incoming"} call{" "}
                    {other ? `with ${other}` : ""}
                  </p>
                  <p className="text-gray-400">{started}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-700">{durationLabel}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-[2px] rounded-full text-[10px] ${
                      status === "completed"
                        ? "bg-green-100 text-green-700"
                        : status === "ongoing"
                        ? "bg-blue-100 text-blue-700"
                        : status === "missed"
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CallHistory;
