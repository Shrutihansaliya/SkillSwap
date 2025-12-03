// src/pages/Admin/SkillRequestsFromUser.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiCheckCircle, FiXCircle, FiMessageSquare, FiRefreshCw } from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext.jsx";

/**
 * Polished admin skill request list (compact)
 * - Smaller cards
 * - Smaller / lighter buttons
 * - Same API endpoints & behavior preserved
 */

export default function SkillRequestsFromUser() {
  const { user } = useAdmin();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // modal state
  const [openReplyFor, setOpenReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const textareaRef = useRef(null);

  const [filter, setFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const adminHeaders = { "x-admin": "true" };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (openReplyFor && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 80);
    }
  }, [openReplyFor]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/skill-requests", { headers: adminHeaders });
      if (res.data && res.data.requests) setRequests(res.data.requests);
      else if (res.data && res.data.success && Array.isArray(res.data.requests)) setRequests(res.data.requests);
      else setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching skill requests:", err);
      toast.error("Unable to load skill requests");
    } finally {
      setLoading(false);
    }
  };

  const openReplyModal = (reqId) => {
    const req = requests.find((r) => r._id === reqId || r.id === reqId);
    setReplyText(req?.AdminReply || req?.adminReply || "");
    setOpenReplyFor(reqId);
    document.body.style.overflow = "hidden";
  };

  const closeReplyModal = () => {
    setOpenReplyFor(null);
    setReplyText("");
    document.body.style.overflow = "";
  };

  const updateRequestStatus = async (reqId, status) => {
    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      toast.error("Invalid status");
      return;
    }
    if (status === "Rejected" && !replyText.trim()) {
      const ok = window.confirm("You're rejecting without a reply. Continue?");
      if (!ok) return;
    }

    setActionLoading(true);
    try {
      const payload = { status, adminReply: replyText ? replyText.trim() : null };
      const res = await axios.put(`/api/skill-requests/${reqId}/reply`, payload, { headers: adminHeaders });

      if (res.data && res.data.success) {
        toast.success(res.data.message || "Request updated");
        setRequests((prev) =>
          prev.map((p) =>
            (p._id === reqId || p.id === reqId)
              ? { ...p, Status: status, AdminReply: payload.adminReply, UpdatedAt: new Date().toISOString() }
              : p
          )
        );
        closeReplyModal();
      } else {
        toast.error(res.data?.message || "Failed to update");
      }
    } catch (err) {
      console.error("Error updating request:", err);
      toast.error("Error updating request");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (filter === "all") return true;
    const s = (r.Status || r.status || "").toString().toLowerCase();
    return s === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-800">Skill Requests</h3>
          <p className="text-sm text-slate-500 mt-1">Manage incoming skill requests from users. Approve to add the skill, or reject with a short reply.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
            <label className="text-xs text-slate-500">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm bg-transparent outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white hover:shadow-md transition"
            title="Refresh"
          >
            <FiRefreshCw />
            <span className="hidden sm:inline text-sm">Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-500">No skill requests found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div
                key={r._id || r.id}
                className="flex flex-col md:flex-row items-stretch gap-3 p-3 rounded-lg border border-slate-200 hover:shadow-md transition"
              >
                {/* Left content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                          {String((r.Username || r.username || "U").charAt(0)).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{r.Username || r.username || "Unknown user"}</div>
                          <div className="text-xs text-slate-400">{new Date(r.CreatedAt || r.createdAt || Date.now()).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="mt-2">
  <div className="text-base font-semibold text-slate-800">
    <span className="font-bold text-slate-700">Skill Name: </span>
    {r.SkillName || r.skillName}
  </div>

  {r.Message || r.message ? (
    <div className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
      <span className="font-bold text-slate-700">Message: </span>
      {r.Message || r.message}
    </div>
  ) : (
    <div className="mt-1 text-sm text-slate-400 italic">
      <span className="font-bold text-slate-700">Message: </span>
      No message provided
    </div>
  )}
</div>

                    </div>

                    <div className="text-right hidden md:block">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                          String(r.Status || r.status || "Pending").toLowerCase() === "approved"
                            ? "bg-green-50 text-green-700"
                            : String(r.Status || r.status || "Pending").toLowerCase() === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {r.Status || r.status || "Pending"}
                      </div>
                      <div className="text-xs text-slate-300 mt-2">ID: {r._id?.slice?.(0, 8) || "-"}</div>
                    </div>
                  </div>

                  {/* Admin reply box preview */}
                  {(r.AdminReply || r.adminReply) && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-md">
                      <div className="flex items-center gap-2 text-xs text-slate-500"><FiMessageSquare /> Admin reply</div>
                      <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{r.AdminReply || r.adminReply}</div>
                    </div>
                  )}
                </div>

                {/* Right actions (kept compact) */}
                <div className="w-full md:w-[240px] flex flex-col gap-2 items-stretch justify-center">
                  <button
                    onClick={() => {
                      setReplyText(r.AdminReply || r.adminReply || "");
                      if (!window.confirm(`Approve request "${r.SkillName || r.skillName}" by ${r.Username || r.username}?`)) return;
                      updateRequestStatus(r._id, "Approved");
                    }}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm font-medium transition"
                  >
                    <FiCheckCircle />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => openReplyModal(r._id || r.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition"
                  >
                    <FiXCircle />
                    <span>Reject (reply)</span>
                  </button>

                  {/* mobile status */}
                  <div className="block md:hidden mt-2 text-sm text-slate-500 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-slate-50">
                      {r.Status || r.status || "Pending"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Centered modal with stronger blur + subtle animation */}
      {openReplyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={closeReplyModal}
            aria-hidden="true"
          />

          {/* Modal content */}
          <div
            className="relative max-w-2xl w-full mx-4 rounded-2xl bg-white/100 border border-slate-100 shadow-2xl p-5 transform transition-all duration-200 ease-out animate-scale-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 rounded-full bg-gradient-to-b from-red-400 to-pink-500" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-slate-800">Reply to user</div>
                    <div className="text-sm text-slate-500 mt-1">Explain briefly why you are rejecting or any extra note to the user.</div>
                  </div>
                  <button onClick={closeReplyModal} className="text-slate-400 hover:text-slate-600 rounded-full p-2">✕</button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a short reply/explanation to the user..."
                  className="w-full mt-4 min-h-[110px] p-3 rounded-lg border border-slate-100 resize-y text-sm outline-none focus:ring-2 focus:ring-pink-100"
                />

                <div className="flex items-center gap-3 justify-end mt-4">
                  <button onClick={closeReplyModal} className="px-3 py-1.5 rounded-lg border text-xs">Cancel</button>

                

                  <button
                    onClick={() => {
                      if (!window.confirm("Are you sure you want to reject this request?")) return;
                      updateRequestStatus(openReplyFor, "Rejected");
                    }}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs"
                  >
                    Save & Reject
                  </button>

              
                </div>
              </div>
            </div>
          </div>

          {/* small animation CSS fallback for when tailwind plugin classes missing */}
          <style>{`
            @keyframes scaleIn {
              0% { opacity: 0; transform: translateY(8px) scale(.98); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-scale-in { animation: scaleIn 180ms ease-out both; }
          `}</style>
        </div>
      )}

      <div className="text-xs text-slate-400">Admin: {user?.Username || user?.username || "—"}</div>
    </div>
  );
}
