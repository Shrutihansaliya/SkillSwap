// // src/pages/User/Report.jsx
// import { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import axios from "axios";

// const API_BASE = "http://localhost:4000";

// const Report = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // swap data passed via state
//   const selectedSwap = location.state?.swap || null;
//   const user = JSON.parse(localStorage.getItem("user") || "{}");

//   const [reportReason, setReportReason] = useState("Spam");
//   const [reportDescription, setReportDescription] = useState("");
//   const [reportLoading, setReportLoading] = useState(false);

//   const reasons = [
//     "Spam",
//     "Abusive language",
//     "Fake profile",
//     "Harassment",
//     "Inappropriate content",
//     "Other",
//   ];

//   if (!selectedSwap) {
//     return (
//       <div className="p-6 text-center">
//         <p className="text-red-500">No swap selected to report.</p>
//         <button
//           onClick={() => navigate(-1)}
//           className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
//         >
//           Go Back
//         </button>
//       </div>
//     );
//   }

//   const norm = (v) => {
//     if (!v) return "";
//     try {
//       if (typeof v === "object" && v._id) return String(v._id).trim().toLowerCase();
//       if (typeof v === "object" && v.UserId) return String(v.UserId).trim().toLowerCase();
//       return String(v).trim().toLowerCase();
//     } catch {
//       return String(v).trim();
//     }
//   };

//   const getOtherUserId = () => {
//     const myId = norm(user._id || user.UserId);
//     const s = norm(selectedSwap.Sender?._id || selectedSwap.Sender?.UserId || selectedSwap.SenderId);
//     const r = norm(selectedSwap.Receiver?._id || selectedSwap.Receiver?.UserId || selectedSwap.ReceiverId);
//     if (s && r) return s === myId ? r : s;
//     return null;
//   };

//   const submitReport = async () => {
//     const reportedUserId = getOtherUserId();
//     if (!reportedUserId) return alert("Unable to determine reported user");
//     if (!reportReason) return alert("Please select a reason");

//     try {
//       setReportLoading(true);
//       const payload = {
//         reportedUser: reportedUserId,
//         reason: reportReason,
//         description: reportDescription || "",
//         evidence: [],
//       };
//       const res = await axios.post(`${API_BASE}/api/reports`, payload, { withCredentials: true });
//       if (res.data.success) {
//         alert("✅ Report submitted. Admin will review it soon.");
//         navigate(-1);
//       } else {
//         alert(res.data.message || "Failed to submit report");
//       }
//     } catch (err) {
//       console.error("Report error:", err?.response?.data || err);
//       alert(err?.response?.data?.message || "Failed to send report");
//     } finally {
//       setReportLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 w-full max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-lg">
//       <h2 className="text-2xl font-bold mb-4 text-gray-800">Report User</h2>
//       <p className="mb-4 text-gray-600">
//         Reporting user in swap: <strong>{selectedSwap.Sender?.Username} ↔ {selectedSwap.Receiver?.Username}</strong>
//       </p>

//       <label className="block mb-2 font-medium">Reason</label>
//       <select
//         value={reportReason}
//         onChange={(e) => setReportReason(e.target.value)}
//         className="w-full p-2 border rounded mb-4"
//       >
//         {reasons.map((r) => (
//           <option key={r} value={r}>{r}</option>
//         ))}
//       </select>

//       <label className="block mb-2 font-medium">Details (optional)</label>
//       <textarea
//         value={reportDescription}
//         onChange={(e) => setReportDescription(e.target.value)}
//         rows={4}
//         className="w-full p-2 border rounded mb-4"
//         placeholder="Describe what happened..."
//       />

//       <div className="flex justify-between">
//         <button
//           onClick={() => navigate(-1)}
//           className="px-4 py-2 rounded bg-gray-200"
//           disabled={reportLoading}
//         >
//           Cancel
//         </button>
//         <button
//           onClick={submitReport}
//           className="px-4 py-2 rounded bg-red-500 text-white"
//           disabled={reportLoading}
//         >
//           {reportLoading ? "Submitting..." : "Submit Report"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Report;


import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000";

export default function Report({ swap, user, onClose, onSubmitted }) {
  const [reason, setReason] = useState("Spam");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = [
    "Spam",
    "Abusive language",
    "Fake profile",
    "Harassment",
    "Inappropriate content",
    "Other",
  ];

  const norm = (v) => {
    if (!v) return "";
    try {
      if (typeof v === "object" && v._id)
        return String(v._id).trim().toLowerCase();
      if (typeof v === "object" && v.UserId)
        return String(v.UserId).trim().toLowerCase();
      return String(v).trim().toLowerCase();
    } catch {
      return String(v).trim().toLowerCase();
    }
  };

  const getOtherUserId = (swap) => {
    if (!swap || !user) return null;
    const myId = norm(user._id || user.UserId);
    const senderId =
      swap.Sender?._id || swap.Sender?.UserId || swap.SenderId;
    const receiverId =
      swap.Receiver?._id || swap.Receiver?.UserId || swap.ReceiverId;
    const s = norm(senderId);
    const r = norm(receiverId);
    if (s && r) return s === myId ? r : s;
    return null;
  };

  const submitReport = async () => {
    const reportedUserId = getOtherUserId(swap);
    if (!reportedUserId) return alert("Unable to determine reported user");
    if (!reason) return alert("Please select a reason");

    try {
      setLoading(true);
      const payload = {
        reportedUser: reportedUserId,
        reason,
        description: description || "",
        evidence: [],
      };
      const res = await axios.post(`${API_BASE}/api/reports`, payload, {
        withCredentials: true,
      });
      if (res.data.success) {
        alert("✅ Report submitted. Admin will review it soon.");
        onSubmitted?.();
        onClose?.();
      } else {
        alert(res.data.message || "Failed to submit report");
      }
    } catch (err) {
      console.error("Report error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Failed to send report");
    } finally {
      setLoading(false);
    }
  };

  const otherUsername =
    swap?.Sender?.Username && swap?.Receiver?.Username
      ? `${swap.Sender.Username} ↔ ${swap.Receiver.Username}`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#F7F4EA]/95 rounded-2xl p-6 shadow-2xl border border-[#A8BBA3]/70">
        <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent">
          Report User
        </h3>

        {otherUsername && (
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Reporting user in swap:{" "}
            <span className="font-semibold text-[#8E5C32]">
              {otherUsername}
            </span>
          </p>
        )}

        <label className="block mb-2 text-xs sm:text-sm font-medium text-gray-700">
          Reason
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2.5 border border-[#CBBFAE] rounded-lg mb-4 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#B87C4C]/40"
        >
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label className="block mb-2 text-xs sm:text-sm font-medium text-gray-700">
          Details (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full p-2.5 border border-[#CBBFAE] rounded-lg mb-5 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#B87C4C]/40"
          placeholder="Describe what happened..."
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-[#CBBFAE] bg-white/80 text-[#8E5C32] hover:bg-[#F0E2D2] transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={submitReport}
            className="px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
