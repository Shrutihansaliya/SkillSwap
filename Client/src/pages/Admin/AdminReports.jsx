// Client/src/pages/Admin/AdminReports.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaSearch, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify"; // ✅ ADDED

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:4000";

const STATUS_MAP = {
  pending: { key: "pending", label: "Pending" },
  pending_review: { key: "pending", label: "Pending" },
  in_review: { key: "in_review", label: "In Review" },
  "in-review": { key: "in_review", label: "In Review" },
  review: { key: "in_review", label: "In Review" },
  resolved: { key: "resolved", label: "Resolved" },
  closed: { key: "resolved", label: "Resolved" },
  rejected: { key: "rejected", label: "Rejected" },
  suspended: { key: "suspended", label: "Suspended" },
};

const normalizeStatusKey = (raw) => {
  if (!raw && raw !== 0) return "";
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, "_");
  if (STATUS_MAP[s]) return STATUS_MAP[s].key;
  const alt = s.replace(/-/, "_");
  if (STATUS_MAP[alt]) return STATUS_MAP[alt].key;
  if (s.includes("pending")) return "pending";
  if (s.includes("review")) return "in_review";
  if (s.includes("resolve")) return "resolved";
  if (s.includes("reject")) return "rejected";
  if (s.includes("suspend")) return "suspended";
  return s;
};

const prettyLabel = (raw) => {
  if (!raw && raw !== 0) return "";
  const key = normalizeStatusKey(raw);
  for (const k of Object.keys(STATUS_MAP)) {
    if (STATUS_MAP[k].key === key) return STATUS_MAP[k].label;
  }
  return String(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function AdminReports() {
  const [reports, setReports] = useState([]); // canonical list from server
  const [filteredReports, setFilteredReports] = useState([]); // client-side filtered view
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [sendEmail, setSendEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // debounce refs / config
  const typingTimerRef = useRef(null);
  const DEBOUNCE_DELAY = 300; // ms - change to 500-700 to reduce requests
  const MIN_SEARCH_CHARS = 1; // triggers search even for 1 char

  const asString = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
      return String(v);
    if (typeof v === "object") {
      if (v._id) return String(v._id);
      if (v.id) return String(v.id);
      if (v.$oid) return String(v.$oid);
      if (v.Username) return v.Username;
      if (v.Username === 0) return String(v.Username);
      if (v.name) return v.name;
      if (v.email) return v.email;
      if (v.Email) return v.Email;
      try {
        const s = JSON.stringify(v);
        return s.length > 80 ? `${s.slice(0, 80)}...` : s;
      } catch {
        return String(v);
      }
    }
    return String(v);
  };

  // helper: does report match query (search multiple fields)
  const matchesQuery = (r, query) => {
    if (!query || query.trim() === "") return true;
    const ql = query.trim().toLowerCase();
    // fields to search: reason, description, reporter username/email, reportedUser username/email, maybe actionTaken/status
    const fields = [
      asString(r.reason),
      asString(r.description),
      asString(r.reporter?.Username ?? r.reporter?.email ?? r.reporter),
      asString(r.reportedUser?.Username ?? r.reportedUser?.email ?? r.reportedUser),
      asString(r.actionTaken),
      asString(r.status),
    ];
    return fields.some((f) => f.toLowerCase().includes(ql));
  };

  const load = async (p = 1, statusParam = null) => {
    try {
      setLoading(true);
      const params = { page: p, limit };
      if (q) params.search = q;
      const statusToSend = statusParam !== null ? statusParam : statusFilter;
      if (statusToSend) params.status = normalizeStatusKey(statusToSend);

      const res = await axios.get(`${API_BASE}/api/reports`, {
        withCredentials: true,
        params,
      });

      if (res?.data?.success === false) {
        toast.error(res.data.message || "Failed to load reports");
        setReports([]);
        setTotal(0);
        return;
      }

      if (res?.data?.reports && Array.isArray(res.data.reports)) {
        setReports(res.data.reports);
        setTotal(res.data.total ?? res.data.reports.length);
      } else if (Array.isArray(res?.data)) {
        setReports(res.data);
        setTotal(res.data.length);
      } else if (res?.data) {
        const maybeReports =
          res.data.reports ?? res.data.data ?? res.data.items ?? res.data;
        if (Array.isArray(maybeReports)) {
          setReports(maybeReports);
          setTotal(res.data.total ?? maybeReports.length);
        } else {
          setReports([]);
          setTotal(0);
        }
      } else {
        setReports([]);
        setTotal(0);
      }

      setPage(p);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load reports");
      setReports([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // whenever canonical reports or q/statusFilter changes, compute client-side filtered list
  useEffect(() => {
    const list = reports.filter((r) => {
      // apply statusFilter first if set (client-side)
      if (statusFilter) {
        const st = normalizeStatusKey(r.status ?? r.Status ?? "");
        if (st !== normalizeStatusKey(statusFilter)) return false;
      }
      // then apply q text match
      return matchesQuery(r, q);
    });
    setFilteredReports(list);
  }, [reports, q, statusFilter]);

  // handle search input with debounce: update q (client-filter) immediately, and also debounce server load(1)
  const handleSearchChange = (val) => {
    setQ(val);

    // clear previous timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    // schedule new server search after debounce (so backend also filters & page results)
    typingTimerRef.current = setTimeout(() => {
      load(1);
      typingTimerRef.current = null;
    }, DEBOUNCE_DELAY);
  };

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, []);

  const prepareReportedName = (r) => {
    const u = r?.reportedUser;
    if (!u) return "User";
    if (u.Username && u.Username.trim().length > 0) return u.Username;
    if (u.Email && u.Email.trim().length > 0) return u.Email;
    return asString(u._id || u);
  };

  const openDetails = (r) => {
    setSelected(r);
    const reportedName = prepareReportedName(r);
    setSendEmail(false);
    setEmailSubject(`Account action notification for ${reportedName}`);
    setEmailBody(
      `Hello ${reportedName},\n\nAn administrative action has been taken regarding a report filed related to your account.\n\nAction: ${r.actionTaken || "none"}\nStatus: ${r.status || "N/A"}\n\nIf you believe this is a mistake, please contact support.`
    );
  };

  const closeDetails = () => {
    setSelected(null);
    setSendEmail(false);
    setEmailSubject("");
    setEmailBody("");
  };

  const performAction = async (
    reportId,
    payload,
    doReload = true,
    skipConfirm = false
  ) => {
    try {
      if (!skipConfirm) {
        if (!window.confirm("Are you sure? This action will be recorded.")) return false;
      }

      setActionLoading(true);

      const res = await axios.put(`${API_BASE}/api/reports/${reportId}`, payload, {
        withCredentials: true,
      });

      if (res?.data?.success === false) {
        toast.error(res.data.message || "Action failed");
        return false;
      }

      const updatedReport = res?.data?.report ?? null;

      if (updatedReport) {
        setReports((prev) =>
          prev.map((r) =>
            asString(r._id) === asString(reportId) ? updatedReport : r
          )
        );
        if (selected && asString(selected._id) === asString(reportId))
          setSelected(updatedReport);
      }

      if (doReload) await load(page);

      toast.success("Action completed");
      return true;
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message || err.message || "Action failed";
      toast.error(serverMsg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const onSuspend = async (r) => {
    const id = asString(r._id);
    if (!window.confirm("Suspend this user indefinitely?")) return;

    const payload = {
      status: "suspended",
      actionTaken: "suspended",
      suspendUntil: null,
      sendEmail: sendEmail,
      emailSubject: sendEmail ? emailSubject : undefined,
      emailBody: sendEmail ? emailBody : undefined,
      adminNote: "",
    };

    await performAction(id, payload, true, true);
  };

  const onUnsuspend = async (r) => {
    const id = asString(r._id);
    if (!window.confirm("Un-suspend this user?")) return;

    const payload = {
      status: "resolved",
      actionTaken: "none",
      suspendUntil: null,
      sendEmail: sendEmail,
      emailSubject: sendEmail ? emailSubject : undefined,
      emailBody: sendEmail ? emailBody : undefined,
      adminNote: "",
    };

    await performAction(id, payload, true, true);
  };

  const onReject = (r) => {
    const note = prompt("Reason for rejection (optional):", "");
    const payload = {
      status: "rejected",
      actionTaken: "none",
      adminNote: note || "",
      sendEmail: sendEmail,
      emailSubject: sendEmail ? emailSubject : undefined,
      emailBody: sendEmail ? emailBody : undefined,
    };
    performAction(asString(r._id), payload, true);
  };

  const onDelete = (r) => {
    if (!window.confirm("Delete this report permanently?")) return;

    (async () => {
      try {
        setActionLoading(true);
        const res = await axios.delete(
          `${API_BASE}/api/reports/${asString(r._id)}`,
          { withCredentials: true }
        );

        if (res?.data?.success === false) {
          toast.error(res.data.message || "Delete failed");
        } else {
          toast.success("Report deleted");
          setReports((prev) =>
            prev.filter((it) => asString(it._id) !== asString(r._id))
          );
          setTotal((t) => Math.max(0, t - 1));
          if (selected && asString(selected._id) === asString(r._id))
            closeDetails();
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Delete failed");
      } finally {
        setActionLoading(false);
      }
    })();
  };

  // total pages based on client-side filtered list
  const totalPages = Math.max(1, Math.ceil((total || filteredReports.length) / limit));

  const safeDate = (d) => {
    try {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return asString(d);
      return dt.toLocaleString();
    } catch {
      return asString(d);
    }
  };

  // helper to render current page slice of filteredReports
  const pagedReports = () => {
    const start = (page - 1) * limit;
    return filteredReports.slice(start, start + limit);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* EVERYTHING BELOW IS UNCHANGED */}
      {/* (UI untouched exactly as you wanted) */}

      {/* ----------- SEARCH BAR & FILTERS ----------- */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Complaints from Members</h1>

        <div className="flex items-center gap-3">
          {/* LIVE SEARCH (debounced + instant local filter) */}
          <div className="flex items-center bg-white rounded-md shadow px-2 border border-gray-300">
            <input
              className="px-3 py-2 outline-none w-64 text-gray-800 bg-white placeholder-gray-400"
              placeholder="Search reason or description..."
              value={q}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
            />
            <button
              onClick={() => load(1)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <FaSearch />
            </button>

            {/* live indicator */}
            <div className="ml-3 text-xs text-gray-500">
              {loading ? "Searching..." : q.length >= 1 ? `Showing ${filteredReports.length} result(s)` : `Showing ${filteredReports.length} record(s)`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                const v = e.target.value;
                setStatusFilter(v);
                // we still call server to get filtered list (page reset)
                load(1, v);
              }}
              className="px-3 py-2 rounded-md border"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
              <option value="resolved">Resolved</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter("");
                setQ("");
                load(1, "");
              }}
              className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ----------- TABLE OF REPORTS ----------- */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Complainant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Defendant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No Complaints found.
                </td>
              </tr>
            ) : (
              pagedReports().map((r, i) => {
                const globalIndex = (page - 1) * limit + i;
                const rowKey = asString(r._id) || globalIndex;
                const rawStatus = r.status ?? r.Status ?? "";
                const st = normalizeStatusKey(rawStatus);

                return (
                  <tr key={rowKey} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {globalIndex + 1}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {asString(r.reporter?.Username ?? r.reporter?.email ?? r.reporter)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {asString(r.reportedUser?.Username ?? r.reportedUser?.email ?? r.reportedUser)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {asString(r.reason)}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          st === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : st === "in_review"
                            ? "bg-indigo-100 text-indigo-800"
                            : st === "resolved"
                            ? "bg-green-100 text-green-800"
                            : st === "rejected"
                            ? "bg-red-100 text-red-800"
                            : st === "suspended"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {prettyLabel(rawStatus)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">
                      {safeDate(r.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetails(r)}
                          className="px-3 py-1 rounded-md bg-blue-50 text-blue-600 text-sm"
                        >
                          View
                        </button>

                        <button
                          onClick={() => openDetails(r)}
                          className="px-3 py-1 rounded-md bg-pink-50 text-pink-700 text-sm"
                          disabled={actionLoading}
                        >
                          Suspend
                        </button>

                        <button
                          onClick={() => onReject(r)}
                          className="px-3 py-1 rounded-md bg-gray-50 text-gray-700 text-sm"
                          disabled={actionLoading}
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => onDelete(r)}
                          className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-sm"
                          disabled={actionLoading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* -------- PAGINATION -------- */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
            }}
            disabled={page <= 1}
            className="px-3 py-1 rounded border"
          >
            Prev
          </button>

          <button
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border"
          >
            Next
          </button>
        </div>
      </div>

      {/* -------- DETAILS MODAL -------- */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/40">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-auto max-h-[85vh]">
            <div className="flex items-start justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Report Details</h2>

              <button onClick={closeDetails} className="px-3 py-1 rounded bg-gray-100">
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-sm font-medium text-gray-600">Reporter</h3>
                  <p className="text-sm text-gray-800 mt-2">
                    {asString(selected.reporter?.Username ?? selected.reporter)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-sm font-medium text-gray-600">Reported User</h3>
                  <p className="text-sm text-gray-800 mt-2">
                    {asString(selected.reportedUser?.Username ?? selected.reportedUser)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600">Reason</h3>
                <p className="mt-2 text-gray-800">{asString(selected.reason)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600">Description</h3>
                <p className="mt-2 text-gray-700 whitespace-pre-line">
                  {selected.description ? asString(selected.description) : "-"}
                </p>
              </div>

              {/* EMAIL */}
              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Send email notification</span>
                </label>

                {sendEmail && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Email subject"
                    />

                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={6}
                      className="w-full border rounded p-2"
                      placeholder="Email body"
                    />
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2">
                <button
                  onClick={() => onSuspend(selected)}
                  className="px-4 py-2 rounded bg-pink-50 text-pink-700"
                  disabled={actionLoading}
                >
                  Suspend
                </button>

                <button
                  onClick={() => onUnsuspend(selected)}
                  className="px-4 py-2 rounded bg-green-50 text-green-700"
                  disabled={actionLoading}
                >
                  Unsuspend
                </button>

                <button
                  onClick={() => onReject(selected)}
                  className="px-4 py-2 rounded bg-gray-50 text-gray-700"
                  disabled={actionLoading}
                >
                  Reject
                </button>

                <button
                  onClick={() => onDelete(selected)}
                  className="ml-auto px-4 py-2 rounded bg-red-50 text-red-700 flex items-center gap-2"
                  disabled={actionLoading}
                >
                  <FaTrash /> Delete
                </button>
              </div>

              <div className="text-xs text-gray-400 mt-4">
                Status: {prettyLabel(selected.status)} • Created:{" "}
                {safeDate(selected.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
