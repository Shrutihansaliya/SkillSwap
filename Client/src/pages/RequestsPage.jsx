import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FiUser } from "react-icons/fi";

const RequestsPage = () => {
  const [activeTab, setActiveTab] = useState("sent");
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptingReq, setAcceptingReq] = useState(null);
  const [senderSkills, setSenderSkills] = useState([]);
  const [selectedSkillToTeach, setSelectedSkillToTeach] = useState("");

  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);

  // Load sent + received requests
  const loadRequests = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const [sentRes, recvRes] = await Promise.all([
        axios.get(`http://localhost:4000/api/requests/sent/${user._id}`),
        axios.get(`http://localhost:4000/api/requests/received/${user._id}`),
      ]);
      setSentRequests(sentRes.data.requests || []);
      setReceivedRequests(recvRes.data.requests || []);
    } catch (err) {
      console.error("Error loading requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Cancel request
  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/requests/cancel/${id}`);
      await loadRequests();
      alert("Request cancelled successfully");
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel request");
    }
  };

  const handleConfirmSwap = async (requestId) => {
    if (!window.confirm("Confirm this skill swap?")) return;

    try {
      await axios.post(
        `http://localhost:4000/api/requests/swap/confirm/${requestId}`
      );
      alert("Skill swap confirmed successfully!");
      await loadRequests();
    } catch (err) {
      console.error("Error confirming swap:", err);
      alert("Failed to confirm swap.");
    }
  };

  // Reject request
  const handleReject = async (id) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await axios.put(
        `http://localhost:4000/api/requests/status/${id}`,
        { status: "Rejected" }
      );
      await loadRequests();
      alert("Request rejected.");
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject request");
    }
  };

  // Open Accept modal — fetch sender’s skills
  const handleOpenAcceptModal = async (req) => {
    try {
      setAcceptingReq(req);
      setSelectedSkillToTeach("");
      setSenderSkills([]);
      setAcceptModalOpen(true);

      const senderId = req.SenderId?._id || req.SenderId;
      if (!senderId) {
        console.error("Missing SenderId in request", req);
        alert("Sender information missing.");
        return;
      }

      const res = await axios.get(
        `http://localhost:4000/api/requests/sender-skills/${senderId}`
      );
      const skills = res.data.skills || [];

      if (!skills.length) {
        alert("No skills found for this sender.");
        setAcceptModalOpen(false);
        return;
      }

      const normalized = skills.map((s) => ({
        _id: s._id,
        SkillAvailability: s.SkillAvailability,
        displayName: s.Skill?.Name || s.SkillName || "Unnamed Skill",
      }));

      setSenderSkills(normalized);
    } catch (err) {
      console.error("Error fetching sender skills:", err);
      alert("Failed to load sender's skills.");
      setAcceptModalOpen(false);
    }
  };

  const handleConfirmAccept = async () => {
    if (!acceptingReq) return;
    if (!selectedSkillToTeach) return alert("Please select a skill.");

    try {
      await axios.put(
        `http://localhost:4000/api/requests/accept/${acceptingReq._id}`,
        {
          SkillToTeachId: selectedSkillToTeach,
        }
      );

      alert("Request accepted successfully.");
      setAcceptModalOpen(false);
      setAcceptingReq(null);
      setSelectedSkillToTeach("");
      await loadRequests();
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept request.");
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case "Accepted":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#A8BBA3]/30 text-[#31513A] text-xs font-semibold">
            ✅ Accepted
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
            ❌ Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
            ⏳ Pending
          </span>
        );
    }
  };

  const renderRequestCard = (req, type) => {
    const otherUser = type === "sent" ? req.ReceiverId : req.SenderId;
    const skillName = req.SkillToLearnId?.SkillName || "N/A";

    return (
      <div
        key={req._id}
        className="bg-white/90 p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-[#CBBFAE] hover:border-[#B87C4C] hover:-translate-y-1"
      >
        {/* top user info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-[#B87C4C]/20 p-3 rounded-full shadow-sm">
            <FiUser className="text-xl text-[#B87C4C]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              {otherUser?.Username || "Unknown"}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm">
              {otherUser?.Email}
            </p>
          </div>
        </div>

        {/* Skill */}
        <p className="mb-2 text-sm text-gray-700">
          <span className="font-medium text-gray-800">Skill:</span>{" "}
          <span className="text-[#B87C4C] font-semibold">{skillName}</span>
        </p>

        {/* Date */}
        <p className="text-xs text-gray-500 mb-3">
          Requested on:{" "}
          <span className="font-medium text-gray-700">
            {req.RequestedDate
              ? new Date(req.RequestedDate).toLocaleDateString("en-IN")
              : "—"}
          </span>
        </p>

        {/* Status */}
        <div className="mb-4">{renderStatus(req.Status)}</div>

        {/* Buttons */}
        {type === "sent" && (
          <>
            {req.Status === "Accepted" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirmSwap(req._id)}
                  className="flex-1 py-2 bg-[#A8BBA3] text-[#15341E] rounded-lg shadow-sm hover:bg-[#91A58E] hover:shadow-md text-sm font-semibold transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleCancel(req._id)}
                  className="flex-1 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg shadow-sm hover:shadow-md text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleCancel(req._id)}
                className="w-full py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg shadow-sm hover:shadow-md text-sm font-semibold transition-all"
              >
                Cancel Request
              </button>
            )}
          </>
        )}

        {type === "received" && req.Status === "Pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenAcceptModal(req)}
              className="flex-1 py-2 bg-[#A8BBA3] text-[#15341E] rounded-lg shadow-sm hover:bg-[#91A58E] hover:shadow-md text-sm font-semibold transition-all"
            >
              Accept
            </button>

            <button
              onClick={() => handleReject(req._id)}
              className="flex-1 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg shadow-sm hover:shadow-md text-sm font-semibold transition-all"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  const requests = activeTab === "sent" ? sentRequests : receivedRequests;

  if (loading)
    return (
      <div className="flex justify-center items-center text-lg text-gray-500 h-[60vh] bg-[#F7F4EA] rounded-2xl border border-[#A8BBA3]/60">
        Loading requests...
      </div>
    );

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA] rounded-2xl border border-[#A8BBA3]/60 min-h-[80vh]">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-transparent bg-clip-text drop-shadow-sm">
        💬 Skill Swap Requests
      </h1>

      {/* Accept Modal */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#F7F4EA] rounded-2xl p-6 w-96 shadow-2xl border border-[#A8BBA3]/70">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-[#B87C4C] text-center">
              Select a skill to learn from sender
            </h3>

            {senderSkills.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4 text-center">
                Loading sender’s skills...
              </p>
            ) : (
              <select
                value={selectedSkillToTeach}
                onChange={(e) => setSelectedSkillToTeach(e.target.value)}
                className="w-full border border-[#CBBFAE] rounded-lg p-2 mb-4 focus:ring-2 focus:ring-[#B87C4C]/40 bg-white/90 text-sm"
              >
                <option value="">-- choose skill --</option>

                {senderSkills
                  .filter((s) => s.SkillAvailability === "Available")
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.displayName}
                    </option>
                  ))}
              </select>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleConfirmAccept}
                disabled={!selectedSkillToTeach}
                className={`flex-1 py-2 rounded text-white text-sm font-semibold transition-all duration-300 ${
                  selectedSkillToTeach
                    ? "bg-[#A8BBA3] text-[#15341E] hover:bg-[#91A58E] hover:shadow-md"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Confirm Accept
              </button>
              <button
                onClick={() => {
                  setAcceptModalOpen(false);
                  setAcceptingReq(null);
                  setSelectedSkillToTeach("");
                }}
                className="flex-1 py-2 bg-gradient-to-r from-gray-500 to-gray-700 hover:shadow-md text-white rounded text-sm font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-[#F7F4EA]/90 backdrop-blur-lg rounded-full shadow-sm border border-[#CBBFAE] overflow-hidden">
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-2 text-sm sm:text-base font-semibold transition-all duration-300 ${
              activeTab === "sent"
                ? "bg-[#B87C4C] text-white shadow-inner"
                : "text-[#8E5C32] hover:bg-[#F0E2D2]"
            }`}
          >
            📤 Sent
          </button>
          <button
            onClick={() => setActiveTab("received")}
            className={`px-6 py-2 text-sm sm:text-base font-semibold transition-all duration-300 ${
              activeTab === "received"
                ? "bg-[#A8BBA3] text-[#15341E] shadow-inner"
                : "text-[#31513A] hover:bg-[#E0EBE0]"
            }`}
          >
            📥 Received
          </button>
        </div>
      </div>

      {/* Request Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {requests.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full text-sm sm:text-lg italic bg-white/70 backdrop-blur-md py-6 rounded-xl shadow-sm border border-dashed border-[#CBBFAE]">
            {activeTab === "sent"
              ? "No sent requests."
              : "No received requests."}
          </p>
        ) : (
          requests.map((req) => renderRequestCard(req, activeTab))
        )}
      </div>
    </div>
  );
};

export default RequestsPage;
