import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiUser } from "react-icons/fi";

const RequestInfo = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch all requests sent by the logged-in user
  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:4000/api/requests/sent/${user._id}`
      );
      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error("Failed to load sent requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Cancel (delete) a pending request
  const handleCancel = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/requests/${requestId}`);
      // Remove the cancelled request from state
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error("Failed to cancel request:", err);
      alert("Error cancelling request");
    }
  };

  // Show status badge with color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Accepted":
        return (
          <span className="bg-[#A8BBA3]/30 text-[#31513A] px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
            ✅ Accepted
          </span>
        );
      case "Rejected":
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
            ❌ Rejected
          </span>
        );
      default:
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
            ⏳ Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-lg sm:text-xl text-gray-500 bg-[#F7F4EA] rounded-2xl border border-[#A8BBA3]/60">
        Loading your sent requests...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#F7F4EA] rounded-2xl shadow-md border border-[#A8BBA3]/60">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#B87C4C]">
            Your Sent Requests
          </h2>
          <p className="text-sm text-gray-600">
            Track status of all skill swap requests you have sent.
          </p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 bg-white/70 border border-[#CBBFAE] px-3 py-1.5 rounded-full">
          Total Requests:{" "}
          <span className="font-semibold text-[#8E5C32]">
            {requests.length}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 rounded-full bg-[#A8BBA3]/40 flex items-center justify-center mb-3">
            <FiUser className="text-3xl text-[#B87C4C]" />
          </div>
          <p className="text-center text-gray-600 text-base sm:text-lg font-medium">
            You haven’t sent any requests yet.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Explore members, pick a skill and start your first skill swap ✨
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white/90 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-[#CBBFAE]"
            >
              {/* Receiver Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#B87C4C]/20 flex items-center justify-center">
                  <FiUser className="text-xl text-[#B87C4C]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                    {req.ReceiverId?.Username || "Unknown User"}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {req.ReceiverId?.Email || "No Email"}
                  </p>
                </div>
              </div>

              {/* Skill Info */}
              <p className="mb-2 text-sm text-gray-700">
                <span className="font-medium text-gray-800">
                  Skill Requested:
                </span>{" "}
                <span className="text-[#B87C4C] font-semibold">
                  {req.UserSkill?.Skill?.Name || "N/A"}
                </span>
              </p>

              {/* Requested Date */}
              <p className="text-xs sm:text-sm text-gray-500 mb-3">
                Requested on:{" "}
                <span className="font-medium text-gray-700">
                  {req.RequestedDate
                    ? new Date(req.RequestedDate).toLocaleDateString("en-IN")
                    : "—"}
                </span>
              </p>

              {/* Status Badge */}
              <div className="mb-4">{getStatusBadge(req.Status)}</div>

              {/* Cancel Button */}
              {req.Status === "Pending" && (
                <button
                  onClick={() => handleCancel(req._id)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white text-sm font-semibold hover:shadow-md hover:scale-[1.01] transition-all"
                >
                  Cancel Request
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestInfo;
