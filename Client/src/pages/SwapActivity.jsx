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
  FaExchangeAlt,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaUsers,
  FaFileAlt,
  FaPlayCircle,
  FaPhone
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

  const [activePanel, setActivePanel] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const [materialsReload, setMaterialsReload] = useState(0);
  const [videoReload, setVideoReload] = useState(0);
  const [callHistoryReload, setCallHistoryReload] = useState(0);

  const fileInputRef = useRef(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
  }, [user?._id, user?.UserId]);

  // ... [All your existing logic functions remain exactly the same - keeping them to avoid errors]
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
      toast.warning("⚠️ You are not part of this swap. Check backend data structure.");
    }
    return result;
  };

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

  const togglePanel = (key) => {
    if (!ensureParticipant(`open ${key}`)) return;
    setActivePanel((prev) => (prev === key ? null : key));
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#8E5C32]/20 border-t-[#8E5C32] rounded-full animate-spin"></div>
          <FaExchangeAlt className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#8E5C32] text-xl" />
        </div>
        <p className="mt-4 text-[#8E5C32] font-medium">Loading swap activities...</p>
      </div>
    );

  return (
    <div className="p-4 md:p-6 w-full min-h-screen bg-gradient-to-br from-[#F8F5F0] via-[#E8F0E3] to-[#F8F5F0]">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
      />

      {!selectedSwap ? (
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#3A2A1A] flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#B87C4C] to-[#8E5C32] shadow-lg">
                  <FaExchangeAlt className="text-white text-2xl" />
                </div>
                Active Swap Activities
              </h1>
              <p className="text-gray-600 mt-2">Manage your ongoing skill exchanges and collaborations</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">{swaps.length} Active Swaps</span>
            </div>
          </div>

          {swaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 md:mt-24 p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-[#CBBFAE]/30 max-w-2xl mx-auto">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F7F4EA] to-[#A8BBA3] flex items-center justify-center">
                  <FaUsers className="text-4xl text-[#8E5C32]" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-full shadow-lg">
                  <FaExchangeAlt className="text-[#B87C4C]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#3A2A1A] mb-3">No Active Swaps Found</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                Start a skill exchange to collaborate, share materials, and connect with other learners.
              </p>
              <button 
                onClick={fetchSwaps}
                className="px-6 py-3 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Refresh Swaps
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {swaps.map((swap) => (
                <div
                  key={swap._id}
                  className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 
                  border border-[#CBBFAE]/50 hover:border-[#B87C4C] 
                  hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 
                  hover:bg-gradient-to-br hover:from-white hover:via-[#FDFCF8] hover:to-white"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B87C4C] to-[#8E5C32] flex items-center justify-center text-white font-semibold shadow-md">
                          {swap.Sender?.Username?.charAt(0) || "U"}
                        </div>
                        <div className="absolute -right-1 -bottom-1 bg-gradient-to-r from-[#3F6A48] to-[#31513A] text-white p-1 rounded-full">
                          <FaExchangeAlt className="text-xs" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-[#3A2A1A] text-lg">
                          {swap.Sender?.Username} ↔ {swap.Receiver?.Username}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <FaCalendarAlt className="text-gray-400 text-xs" />
                          <span className="text-xs text-gray-500">
                            {new Date(swap.CreatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      swap.Status === "Active"
                        ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border border-green-200"
                        : swap.Status === "Completed"
                        ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border border-blue-200"
                        : "bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-700 border border-red-200"
                    }`}>
                      {swap.Status}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50">
                      <FaGraduationCap className="text-[#3B82F6]" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Learning</p>
                        <p className="font-semibold text-gray-800">{swap.SkillToLearn?.Name || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50">
                      <FaChalkboardTeacher className="text-[#B87C4C]" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Teaching</p>
                        <p className="font-semibold text-gray-800">{swap.SkillToTeach?.Name || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSwap(swap);
                      setActivePanel(null);
                      setShowReportModal(false);
                    }}
                    className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] 
                    text-white rounded-xl py-3 px-4 shadow-lg 
                    hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold
                    flex items-center justify-center gap-2"
                  >
                    <span className="relative z-10">View Details</span>
                    <div className="relative z-10 transform group-hover/btn:translate-x-1 transition-transform">
                      →
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#8E5C32] to-[#B87C4C] opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Back Button - Kept exactly as requested */}
          <div className="max-w-7xl mx-auto mb-6">
            <button
              onClick={() => {
                setSelectedSwap(null);
                setActivePanel(null);
                setShowReportModal(false);
              }}
              className="bg-transparent mb-4 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <img 
                src="/backimg.png" 
                alt="Back to swaps"
                className="h-8 w-auto"
              />
            </button>
          </div>

          {/* DETAIL CARD */}
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-white via-[#FDFCF8] to-white backdrop-blur-sm 
              rounded-3xl p-6 md:p-8 shadow-2xl border border-[#CBBFAE]/50">
              
              {/* Header with Avatars */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B87C4C] to-[#8E5C32] flex items-center justify-center text-white font-semibold text-xl shadow-lg">
                      {selectedSwap.Sender?.Username?.charAt(0) || "S"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#3F6A48] to-[#31513A] text-white p-1.5 rounded-full">
                      <FaUsers className="text-xs" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#3A2A1A]">
                      Active Swap Session
                    </h1>
                    <p className="text-gray-600 flex items-center gap-2">
                      <FaExchangeAlt className="text-[#B87C4C]" />
                      <span className="font-medium text-[#8E5C32]">
                        {selectedSwap.Sender?.Username} ↔ {selectedSwap.Receiver?.Username}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${
                  selectedSwap.Status === "Active" 
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700"
                    : selectedSwap.Status === "Completed"
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700"
                    : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    selectedSwap.Status === "Active" ? "bg-green-500 animate-pulse" : 
                    selectedSwap.Status === "Completed" ? "bg-blue-500" : "bg-amber-500"
                  }`}></div>
                  <span className="font-medium">{selectedSwap.Status} Swap</span>
                </div>
              </div>

              {/* Skills Cards - Smaller version */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FaGraduationCap className="text-blue-600 text-sm" />
                    <h3 className="font-medium text-gray-700 text-sm">Learning</h3>
                  </div>
                  <div className="font-bold text-gray-800">
                    {selectedSwap.SkillToLearn?.Name || "N/A"}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FaChalkboardTeacher className="text-amber-600 text-sm" />
                    <h3 className="font-medium text-gray-700 text-sm">Teaching</h3>
                  </div>
                  <div className="font-bold text-gray-800">
                    {selectedSwap.SkillToTeach?.Name || "N/A"}
                  </div>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {/* Upload Material */}
                <button
                  onClick={openFilePicker}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-white px-3 py-2.5 rounded-lg hover:shadow-lg transition-all text-sm"
                >
                  <FaUpload /> Upload File
                </button>

                {/* Materials Panel */}
                <button
                  onClick={() => togglePanel("materials")}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    activePanel === "materials"
                      ? "bg-[#8E5C32] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaStar /> {activePanel === "materials" ? "Hide" : "Materials"}
                </button>

                {/* Chat */}
                <button
                  onClick={() => togglePanel("chat")}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    activePanel === "chat"
                      ? "bg-[#31513A] text-white"
                      : "bg-[#3F6A48] text-white hover:bg-[#31513A]"
                  }`}
                >
                  <FaComments /> Chat
                </button>

                {/* Video Call */}
                <button
                  onClick={() => togglePanel("call")}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    activePanel === "call"
                      ? "bg-[#4F6F52] text-white"
                      : "bg-[#6A8C6C] text-white hover:bg-[#4F6F52]"
                  }`}
                >
                  <FaVideo /> {activePanel === "call" ? "Close" : "Call"}
                </button>

                {/* Upload Video */}
                <button
                  onClick={openUploadModal}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#B87C4C] to-[#D47C4C] text-white px-3 py-2.5 rounded-lg hover:shadow-lg transition-all text-sm"
                >
                  <FaVideo /> Upload Video
                </button>

                {/* Show Videos */}
                <button
                  onClick={() => togglePanel("videos")}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    activePanel === "videos"
                      ? "bg-[#8E5C32] text-white"
                      : "bg-[#AE7A49] text-white hover:bg-[#8E5C32]"
                  }`}
                >
                  {activePanel === "videos" ? "Hide" : "Videos"}
                </button>

                {/* Confirm */}
                <button
                  onClick={handleConfirm}
                  disabled={confirmDisabled || selectedSwap.isConfirming}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                    selectedSwap.Status === "Completed"
                      ? "bg-blue-100 text-blue-700 cursor-not-allowed"
                      : confirmDisabled
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#3B7A57] to-[#256D4B] text-white hover:shadow-lg"
                  }`}
                >
                  <FaCheckCircle />
                  {selectedSwap.Status === "Completed"
                    ? "Completed"
                    : confirmDisabled
                    ? "Waiting"
                    : "Confirm"}
                </button>

                {/* Report */}
                <button
                  onClick={openReportModal}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F97373] to-[#B91C1C] text-white px-3 py-2.5 rounded-lg hover:shadow-lg transition-all text-sm"
                >
                  <FaFlag /> Report
                </button>
              </div>

              {/* Panels */}
              <div className="space-y-6">
                {activePanel === "materials" && (
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-[#CBBFAE]">
                    <h3 className="text-lg font-bold text-[#3A2A1A] mb-4 flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#B87C4C] to-[#8E5C32]">
                        <FaStar className="text-white" />
                      </div>
                      Shared Materials
                    </h3>
                    <Materials
                      selectedSwap={selectedSwap}
                      user={user}
                      reloadSignal={materialsReload}
                    />
                  </div>
                )}

                {activePanel === "chat" && (
                  <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl p-5 border border-emerald-200">
                    <h3 className="text-lg font-bold text-[#3A2A1A] mb-4 flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#3F6A48] to-[#31513A]">
                        <FaComments className="text-white" />
                      </div>
                      Swap Chat
                    </h3>
                    <Chat
                      selectedSwap={selectedSwap}
                      user={user}
                      onClose={() => setActivePanel(null)}
                    />
                  </div>
                )}

                {activePanel === "videos" && (
                  <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl p-5 border border-red-200">
                    <h3 className="text-lg font-bold text-[#3A2A1A] mb-4 flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#D47C4C] to-[#B72F2F]">
                        <FaPlayCircle className="text-white" />
                      </div>
                      Session Videos
                    </h3>
                    <VideoDetail
                      swapId={selectedSwap._id}
                      user={user}
                      reload={videoReload}
                    />
                  </div>
                )}

                {activePanel === "call" && (
                  <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-5 border border-green-200">
                    <h3 className="text-lg font-bold text-[#3A2A1A] mb-4 flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#4F6F52] to-[#3B5240]">
                        <FaPhone className="text-white" />
                      </div>
                      Video Call
                    </h3>
                    <Meet
                      swapId={selectedSwap._id}
                      swap={selectedSwap}
                      currentUser={user}
                      otherUserId={getOtherUserId(selectedSwap)}
                      onClose={() => setActivePanel(null)}
                      onCallEnded={() => setCallHistoryReload((r) => r + 1)}
                    />
                  </div>
                )}

                {/* Call History */}
                <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-5 border border-blue-200">
                  <h3 className="text-lg font-bold text-[#3A2A1A] mb-4 flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8]">
                      <FaCalendarAlt className="text-white" />
                    </div>
                    Call History
                  </h3>
                  <CallHistory
                    swapId={selectedSwap._id}
                    user={user}
                    reload={callHistoryReload}
                  />
                </div>
              </div>
            </div>
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

      {/* Video Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !uploading && setShowUploadModal(false)}
          />

          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-[#CBBFAE]">
            <div className="w-full bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] py-5 px-6 shadow-md">
              <h2 className="text-xl font-semibold text-white">Upload Video</h2>
              <p className="text-sm text-white/90 mt-1">Share your learning session</p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B87C4C]/40 outline-none"
                  placeholder="Describe this video session..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select MP4 Video</label>
                <input
                  type="file"
                  accept="video/mp4"
                  onChange={onVideoFileChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {uploading && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Uploading: {uploadProgress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => !uploading && setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={uploading}
                  onClick={submitVideoUpload}
                  className="px-4 py-2 bg-[#8E5C32] text-white rounded-lg hover:bg-[#7A4F2A] disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapActivity;