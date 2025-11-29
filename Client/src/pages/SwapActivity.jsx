// pages/SwapActivity.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import {
  FaVideo,
  FaComments,
  FaUpload,
  FaStar,
  FaCalendarAlt,
  FaFlag,
} from "react-icons/fa";
import Chat from "./Chat.jsx";
import Materials from "./Materials.jsx";
import Report from "./Report.jsx";
import VideoDetail from "./VideoDetail.jsx";
import Meet from "./Meet.jsx";
import CallHistory from "./CallHistory.jsx";

const API_BASE = "http://localhost:4000";

const SwapActivity = () => {
  const [swaps, setSwaps] = useState([]);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 ek j panel active rakhsu
  const [activePanel, setActivePanel] = useState(null); // "materials" | "chat" | "videos" | "call" | null

  const [showReportModal, setShowReportModal] = useState(false);

  // reload signals
  const [materialsReload, setMaterialsReload] = useState(0);
  const [videoReload, setVideoReload] = useState(0);
  const [callHistoryReload, setCallHistoryReload] = useState(0);

  // file refs
  const fileInputRef = useRef(null);

  // Upload modal state (video)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // user loaded from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // -------------------------
  // Fetch swaps for user
  // -------------------------
  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/swaps/user/${user._id || user.UserId}`,
        {
          withCredentials: true,
        }
      );
      if (res.data.success) setSwaps(res.data.swaps || []);
    } catch (err) {
      console.error("fetchSwaps error:", err);
      toast.error("Failed to load swaps");

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.UserId]);

  // -------------------------
  // Robust participant helpers
  // -------------------------
  const norm = (v) => {
    if (!v) return "";
    try {
      if (typeof v === "object" && v._id) return String(v._id).trim().toLowerCase();
      if (typeof v === "object" && v.UserId)
        return String(v.UserId).trim().toLowerCase();
      if (typeof v === "object" && typeof v.toString === "function") {
        const s = v.toString();
        if (s && s !== "[object Object]") return s.trim().toLowerCase();
      }
    } catch {}
    return String(v).trim().toLowerCase();
  };

  const extractPossibleIds = (obj) => {
    if (!obj) return [];
    const ids = [];
    const keys = ["_id", "id", "UserId", "userId", "SenderId", "ReceiverId", "ID", "Id"];
    keys.forEach((k) => {
      if (obj[k]) ids.push(norm(obj[k]));
    });
    if (obj && obj.User && (obj.User._id || obj.User.UserId))
      ids.push(norm(obj.User._id || obj.User.UserId));
    if (typeof obj === "string" || typeof obj === "number") ids.push(norm(obj));
    return [...new Set(ids)].filter(Boolean);
  };

  const isParticipant = (swap) => {
    try {
      if (!swap || !user) return false;

      const myIds = [
        ...(extractPossibleIds(user) || []),
        norm(user._id),
        norm(user.UserId),
      ].filter(Boolean);

      let candidateIds = [];

      if (swap.Sender) candidateIds = candidateIds.concat(extractPossibleIds(swap.Sender));
      if (swap.Receiver)
        candidateIds = candidateIds.concat(extractPossibleIds(swap.Receiver));

      if (swap.SenderId)
        candidateIds = candidateIds.concat(extractPossibleIds(swap.SenderId));
      if (swap.ReceiverId)
        candidateIds = candidateIds.concat(extractPossibleIds(swap.ReceiverId));

      if (swap.RequestId) {
        if (swap.RequestId.SenderId)
          candidateIds = candidateIds.concat(
            extractPossibleIds(swap.RequestId.SenderId)
          );
        if (swap.RequestId.ReceiverId)
          candidateIds = candidateIds.concat(
            extractPossibleIds(swap.RequestId.ReceiverId)
          );
      }

      if (swap.UserId) candidateIds.push(norm(swap.UserId));
      if (swap.OwnerId) candidateIds.push(norm(swap.OwnerId));

      const normMy = [...new Set(myIds.map(norm))].filter(Boolean);
      const normCandidates = [...new Set(candidateIds.map(norm))].filter(Boolean);

      return normMy.some((id) => normCandidates.includes(id));
    } catch (err) {
      console.error("isParticipant error:", err);
      return false;
    }
  };

  const ensureParticipant = (actionName = "perform this action") => {
    if (!selectedSwap) {
      toast.info("Please select a swap first.");

      return false;
    }

    const result = isParticipant(selectedSwap);
    if (!result) {
      console.warn("⛔ Blocked:", { action: actionName, user, selectedSwap });
      // alert("⚠️ You are not part of this swap. Check backend data structure.");
      toast.warning("⚠️ You are not part of this swap. Check backend data structure.");

    }
    return result;
  };

  // helper: get other user's id (for reporting / call)
  const getOtherUserId = (swap) => {
    if (!swap || !user) return null;
    const myId = norm(user._id || user.UserId);

    const senderId = swap.Sender?._id || swap.Sender?.UserId || swap.SenderId;
    const receiverId =
      swap.Receiver?._id || swap.Receiver?.UserId || swap.ReceiverId;

    const s = norm(senderId);
    const r = norm(receiverId);

    if (s && r) {
      if (s === myId) return r;
      if (r === myId) return s;
    }

    if (swap.RequestId) {
      const reqS =
        swap.RequestId.SenderId?._id ||
        swap.RequestId.SenderId?.UserId ||
        swap.RequestId.SenderId;
      const reqR =
        swap.RequestId.ReceiverId?._id ||
        swap.RequestId.ReceiverId?.UserId ||
        swap.RequestId.ReceiverId;
      const rs = norm(reqS);
      const rr = norm(reqR);
      if (rs && rr) {
        if (rs === myId) return rr;
        if (rr === myId) return rs;
      }
    }

    if (s && s !== myId) return s;
    if (r && r !== myId) return r;

    return null;
  };

  // -------------------------
  // File upload (materials)
  // -------------------------
  const openFilePicker = () => {
    if (!ensureParticipant("upload materials")) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    if (!ensureParticipant("upload materials")) {
      e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const allowedExtensions = [
      "pdf",
      "txt",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "xls",
      "xlsx",
      "csv",
    ];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
     toast.error("❌ Invalid file type!");

      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.warning("⚠️ Max size 10 MB");

      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user._id);

      const res = await axios.post(
        `${API_BASE}/api/materials/${selectedSwap._id}/upload`,
        formData,
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        toast.success("✅ Upload OK");

        setMaterialsReload((r) => r + 1);
        setActivePanel("materials");
      } else {
        alert(res.data.message || "Upload failed");
      }
    } catch (err) {
      console.error("upload err:", err);
      const serverMsg =
        err?.response?.data?.message || err?.message || "Upload failed";
     toast.error(`Upload failed: ${serverMsg}`);

    }
  };

  // -------------------------
  // Video upload modal & logic
  // -------------------------
  const openUploadModal = () => {
    if (!ensureParticipant("upload video")) return;
    setUploadFile(null);
    setUploadDescription("");
    setUploadProgress(0);
    setShowUploadModal(true);
  };

  const onVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "mp4") {
     toast.error("❌ Only MP4 files are allowed.");

      e.target.value = "";
      return;
    }
    if (file.size > 1024 * 1024 * 1024) {
     toast.warning("⚠️ Max size is 1 GB.");

      e.target.value = "";
      return;
    }
    setUploadFile(file);
  };

  const submitVideoUpload = async () => {
    if (!uploadFile) return toast.info("Please select a video file (.mp4)");
    if (!uploadDescription || !uploadDescription.trim())
      return toast.info("Please enter a description");

    try {
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("video", uploadFile);
      formData.append("userId", user._id);
      formData.append("description", uploadDescription);

      const res = await axios.post(
        `${API_BASE}/api/videos/${selectedSwap._id}/upload`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (p) => {
            if (p.total) {
              const percent = Math.round((p.loaded / p.total) * 100);
              setUploadProgress(percent);
            }
          },
        }
      );

      if (res.data.success) {
       toast.success("✅ Video uploaded.");

        setShowUploadModal(false);
        setUploadFile(null);
        setUploadDescription("");
        setVideoReload((v) => v + 1);
        setActivePanel("videos");
      } else {
        alert(res.data.message || "Upload failed");
      }
    } catch (err) {
      console.error("video upload err", err);
      toast.error(err?.response?.data?.message || "Upload failed");

    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // -------------------------
  // Confirm swap
  // -------------------------
  const handleConfirm = async () => {
    if (!ensureParticipant("confirm this swap")) return;

    const senderId = (() => {
      if (selectedSwap.Sender?._id) return norm(selectedSwap.Sender._id);
      if (selectedSwap.RequestId?.SenderId)
        return norm(selectedSwap.RequestId.SenderId._id);
      return "";
    })();

    const currentUserId = norm(user._id || user.UserId);
    const myKey = senderId === currentUserId ? "SenderConfirmed" : "ReceiverConfirmed";
    const alreadyConfirmed = Boolean(selectedSwap?.Confirmations?.[myKey]);

    if (selectedSwap?.Status === "Completed")
      return toast.info("✅ This swap is already completed.");
 
    if (alreadyConfirmed) return toast.info("ℹ️ You have already confirmed this swap.");
    if (!window.confirm("Have you completed this swap? Confirm to mark as done."))
      return;

    try {
      setSelectedSwap((prev) => ({ ...prev, isConfirming: true }));

      const res = await axios.put(
        `${API_BASE}/api/swaps/${selectedSwap._id}/confirm`,
        {
          userId: user._id || user.UserId,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
       toast.success(res.data.message);

        setSelectedSwap((prev) => ({
          ...prev,
          Confirmations: res.data.swap.Confirmations,
          Status: res.data.swap.Status,
          isConfirming: false,
        }));
        fetchSwaps();
      } else {
        toast.error(res.data.message || "Failed to confirm swap");
        setSelectedSwap((prev) => ({ ...prev, isConfirming: false }));
      }
    } catch (err) {
      console.error("Confirm swap error:", err.response?.data || err);
     toast.error(err.response?.data?.message || "❌ Error confirming swap");

      setSelectedSwap((prev) => ({ ...prev, isConfirming: false }));
    }
  };

  const computeConfirmDisabled = () => {
    if (!selectedSwap || !user?._id) return true;

    const senderId = (() => {
      if (selectedSwap.Sender?._id) return norm(selectedSwap.Sender._id);
      if (selectedSwap.RequestId?.SenderId)
        return norm(selectedSwap.RequestId.SenderId._id);
      return "";
    })();

    const currentUserId = norm(user._id || user.UserId);
    const myKey = senderId === currentUserId ? "SenderConfirmed" : "ReceiverConfirmed";
    const alreadyConfirmed = Boolean(selectedSwap?.Confirmations?.[myKey]);

    return selectedSwap?.Status === "Completed" || alreadyConfirmed;
  };

  const confirmDisabled = computeConfirmDisabled();

  const openReportModal = () => {
    if (!ensureParticipant("report user")) return;
    setShowReportModal(true);
  };

  // -------------------------
  // Render
  // -------------------------
  if (loading)
    return (
      <p className="text-center mt-6 text-[#8E5C32] font-medium">
        Loading swap details...
      </p>
    );

  // helper to toggle panel: same button click → close, any other → open new & close old
  const togglePanel = (key) => {
    if (!ensureParticipant(`open ${key}`)) return;
    setActivePanel((prev) => (prev === key ? null : key));
  };

  return (
    <div
      className="p-6 w-full min-h-screen mx-auto 
      bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA] 
      rounded-2xl border border-[#A8BBA3]/60 shadow-inner flex flex-col"
    >
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
      />

      {!selectedSwap ? (
        <>
          <h2 className="text-3xl font-semibold mb-6 text-center bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent">
            🌿 Your Swap Activities
          </h2>

          {swaps.length === 0 ? (
            <p className="text-center text-gray-600 italic">
              No swap activities found yet.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {swaps.map((swap) => (
                <div
                  key={swap._id}
                  className="bg-[#FDFCF8] rounded-3xl shadow-md p-6 border border-[#CBBFAE] 
                  hover:border-[#B87C4C] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#3A2A1A]">
                      {swap.Sender?.Username} ↔ {swap.Receiver?.Username}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
                        swap.Status === "Active"
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : swap.Status === "Completed"
                          ? "bg[#DBEAFE] text-[#1D4ED8]"
                          : "bg-[#FEE2E2] text-[#B91C1C]"
                      }`}
                    >
                      {swap.Status}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm">
                    <strong>Learning:</strong>{" "}
                    {swap.SkillToLearn?.Name || "N/A"}
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Teaching:</strong>{" "}
                    {swap.SkillToTeach?.Name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Created:{" "}
                    {new Date(swap.CreatedAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSwap(swap);
                      setActivePanel(null);
                      setShowReportModal(false);
                    }}
                    className="mt-4 w-full bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] 
                    text-white font-medium rounded-full px-6 py-2 shadow-md 
                    hover:shadow-lg hover:scale-[1.02] transition-all"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => {
              setSelectedSwap(null);
              setActivePanel(null);
              setShowReportModal(false);
            }}
            className="text-[#8E5C32] hover:underline mb-4 font-medium text-sm"
          >
            ← Back to swaps
          </button>

          <h3 className="text-2xl font-bold text-[#3A2A1A] mb-2">
            {selectedSwap.Sender?.Username} ↔{" "}
            {selectedSwap.Receiver?.Username}
          </h3>
          <p className="text-gray-700">
            <strong>Learning:</strong>{" "}
            {selectedSwap.SkillToLearn?.Name || "N/A"}
          </p>
          <p className="text-gray-700 mb-6">
            <strong>Teaching:</strong>{" "}
            {selectedSwap.SkillToTeach?.Name || "N/A"}
          </p>

          {/* Action panel – buttons neatly aligned, only one panel active */}
          <div className="mt-6 bg-[#FDFCF8]/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-[#CBBFAE]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Upload Material (opens file picker, panel → materials) */}
              <button
                type="button"
                onClick={openFilePicker}
                className="flex items-center justify-center gap-2 
                bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] 
                text-white px-4 py-3 rounded-xl font-medium shadow-md 
                hover:shadow-lg hover:scale-[1.02] transition-all text-sm"
              >
                <FaUpload className="text-lg" />
                Upload Material
              </button>

              {/* Materials panel toggle */}
              <button
                onClick={() => togglePanel("materials")}
                className={`flex items-center justify-center gap-2 
                px-4 py-3 rounded-xl font-medium shadow-md transition-all text-sm
                ${
                  activePanel === "materials"
                    ? "bg-[#A8BBA3] text-[#1F3424]"
                    : "bg-[#DDE5D9] text-[#1F3424] hover:bg-[#C7D3C3]"
                }`}
              >
                <FaStar className="text-lg" />
                {activePanel === "materials" ? "Hide Materials" : "Show Materials"}
              </button>

              {/* Chat */}
              <button
                onClick={() => togglePanel("chat")}
                className={`flex items-center justify-center gap-2 
                px-4 py-3 rounded-xl font-medium shadow-md transition-all text-sm
                ${
                  activePanel === "chat"
                    ? "bg-[#31513A] text-white"
                    : "bg-[#3F6A48] text-white hover:bg-[#31513A]"
                }`}
              >
                <FaComments className="text-lg" />
                Chat
              </button>

              {/* Video Call */}
              <button
                onClick={() => togglePanel("call")}
                className={`flex items-center justify-center gap-2 
                px-4 py-3 rounded-xl font-medium shadow-md transition-all text-sm
                ${
                  activePanel === "call"
                    ? "bg-[#4F6F52] text-white"
                    : "bg-[#6A8C6C] text-white hover:bg-[#4F6F52]"
                }`}
              >
                <FaVideo className="text-lg" />
                {activePanel === "call" ? "Close Call" : "Video Call"}
              </button>

              {/* Upload Video (modal) */}
              <button
                onClick={openUploadModal}
                className="flex items-center justify-center gap-2 
                bg-gradient-to-r from-[#B87C4C] to-[#D47C4C]
                text-white px-4 py-3 rounded-xl font-medium shadow-md 
                hover:shadow-lg hover:scale-[1.02] transition-all text-sm"
              >
                <FaVideo className="text-lg" />
                Upload Video
              </button>

              {/* Show / Hide video list */}
              <button
                onClick={() => togglePanel("videos")}
                className={`flex items-center justify-center gap-2 px-4 py-3 
                rounded-xl font-medium shadow-md transition-all text-sm
                ${
                  activePanel === "videos"
                    ? "bg-[#8E5C32] text-white"
                    : "bg-[#AE7A49] text-white hover:bg-[#8E5C32]"
                }`}
              >
                {activePanel === "videos" ? "Hide Videos" : "Show Videos"}
              </button>

              {/* Confirm */}
              <button
                onClick={handleConfirm}
                disabled={confirmDisabled || selectedSwap.isConfirming}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium shadow-md transition-all text-sm
                  ${
                    selectedSwap.Status === "Completed"
                      ? "bg-[#DBEAFE] text-[#1D4ED8] cursor-not-allowed"
                      : selectedSwap.isConfirming
                      ? "bg-gray-400 text-white cursor-wait"
                      : confirmDisabled
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#3B7A57] to-[#256D4B] text-white hover:shadow-lg hover:scale-[1.02]"
                  }`}
              >
                <FaCalendarAlt className="text-lg" />
                {selectedSwap.Status === "Completed"
                  ? "✅ Completed"
                  : selectedSwap.isConfirming
                  ? "⏳ Confirming..."
                  : confirmDisabled
                  ? "Waiting for Partner"
                  : "✅ Confirm"}
              </button>

              {/* Report */}
              <button
                onClick={openReportModal}
                className="flex items-center justify-center gap-2 
                bg-gradient-to-r from-[#F97373] to-[#B91C1C]
                text-white px-4 py-3 rounded-xl font-medium shadow-md 
                hover:shadow-lg hover:scale-[1.02] transition-all text-sm"
              >
                <FaFlag className="text-lg" />
                Report
              </button>
            </div>
          </div>

          {/* Panels – ek waqt ek j dekhashe */}
          <div className="mt-8 space-y-8">
            {activePanel === "materials" && (
              <Materials
                selectedSwap={selectedSwap}
                user={user}
                reloadSignal={materialsReload}
              />
            )}

            {activePanel === "chat" && (
              <Chat
                selectedSwap={selectedSwap}
                user={user}
                onClose={() => setActivePanel(null)}
              />
            )}

            {activePanel === "videos" && (
              <VideoDetail
                swapId={selectedSwap._id}
                user={user}
                reload={videoReload}
              />
            )}

            {activePanel === "call" && (
              <Meet
                swapId={selectedSwap._id}
                swap={selectedSwap}
                currentUser={user}
                otherUserId={getOtherUserId(selectedSwap)}
                onClose={() => setActivePanel(null)}
                onCallEnded={() =>
                  setCallHistoryReload((r) => r + 1)
                }
              />
            )}

            {/* Call history for this swap – ye always niche j rahe */}
            <CallHistory
              swapId={selectedSwap._id}
              user={user}
              reload={callHistoryReload}
            />
          </div>
        </>
      )}

      {showReportModal && (
        <Report
          swap={selectedSwap}
          user={user}
          onClose={() => setShowReportModal(false)}
          onSubmitted={() => fetchSwaps()}
        />
      )}

      {/* ---- Video Upload Modal ---- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Dim Background */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !uploading && setShowUploadModal(false)}
          />

          {/* Popup Card */}
          <div
            className="relative w-full max-w-md bg-[#F7F4EA]/95 backdrop-blur-xl
                    rounded-2xl shadow-2xl overflow-hidden
                    border border-[#A8BBA3]/70"
          >
            {/* Header */}
            <div
              className="w-full bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] 
                      py-4 px-6 shadow-md"
            >
              <h2 className="text-xl font-semibold text-white tracking-wide">
                Upload Video
              </h2>
              <p className="text-xs text-[#F7F4EA] mt-1">
                Share your learning session with your partner
              </p>
            </div>

            <div className="p-7">
              {/* Description Field */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
                className="w-full mb-4 p-3 border border-[#CBBFAE] rounded-lg 
                     focus:ring-2 focus:ring-[#B87C4C]/40 outline-none 
                     text-gray-700 bg-white/90 text-sm"
                placeholder="Write a short description..."
              />

              {/* File Upload */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Video (MP4)
              </label>
              <input
                type="file"
                accept="video/mp4"
                onChange={onVideoFileChange}
                className="w-full p-2 border border-[#CBBFAE] rounded-lg mb-3
                     bg:white/90 text-sm"
              />

              {uploadFile && (
                <p className="text-xs text-gray-500 mb-4">
                  {uploadFile.name} —{" "}
                  {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}

              {/* Progress Bar */}
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="h-2 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => !uploading && setShowUploadModal(false)}
                  className="px-4 py-2 text-sm rounded-lg 
                       bg-white/90 border border-[#CBBFAE]
                       text-[#8E5C32] hover:bg-[#F0E2D2] 
                       shadow-sm transition-all"
                >
                  Cancel
                </button>

                <button
                  disabled={uploading}
                  onClick={submitVideoUpload}
                  className="px-5 py-2 text-sm rounded-lg 
                       bg-gradient-to-r from-[#B87C4C] to-[#8E5C32]
                       text-white shadow-md hover:shadow-lg hover:scale-[1.02]
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading
                    ? `Uploading ${uploadProgress}%`
                    : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ---------- end modal ---------- */}
    </div>
  );
};

export default SwapActivity;
