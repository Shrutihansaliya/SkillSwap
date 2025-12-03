// // ActivityHistory.jsx
// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { FaUpload, FaStar, FaFlag } from "react-icons/fa";
// import Materials from "../pages/Materials.jsx";
// import Feedback from "../pages/Feedback.jsx";

// const API_BASE = "http://localhost:4000";

// // Small circular initials avatar
// const InitialsAvatar = ({ name, size = 36 }) => {
//   const initials = (name || "")
//     .split(" ")
//     .map((p) => p[0])
//     .join("")
//     .slice(0, 2)
//     .toUpperCase();
//   return (
//     <div
//       style={{ width: size, height: size }}
//       className="flex items-center justify-center rounded-full bg-indigo-200 text-indigo-800 font-semibold"
//     >
//       {initials || "U"}
//     </div>
//   );
// };

// // Stars or "No rating yet" badge
// const StarsInline = ({ value }) => {
//   if (!value || Number(value) <= 0) {
//     return (
//       <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 inline-block">
//         No rating yet
//       </div>
//     );
//   }
//   return (
//     <div className="text-yellow-500 inline-block select-none">
//       {Array.from({ length: 5 }).map((_, i) => (
//         <span key={i} className={`text-sm ${i < value ? "" : "opacity-40"}`}>{i < value ? "★" : "☆"}</span>
//       ))}
//     </div>
//   );
// };

// const ActivityHistory = () => {
//   const [swaps, setSwaps] = useState([]);
//   const [selectedSwap, setSelectedSwap] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showMaterials, setShowMaterials] = useState(false);
//   const [materialsReload, setMaterialsReload] = useState(0);

//   // feedback panel state (panel contains partner feedbacks + optional form)
//   const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
//   const [showFeedbackForm, setShowFeedbackForm] = useState(false); // form shown above partner feedbacks
//   const [feedbackSavedSignal, setFeedbackSavedSignal] = useState(0);

//   // feedbacks for selected swap (only loaded when Feedback is opened)
//   const [feedbacks, setFeedbacks] = useState([]);
//   const [feedbacksLoading, setFeedbacksLoading] = useState(false);

//   const fileInputRef = useRef(null);
//   const user = JSON.parse(localStorage.getItem("user") || "{}");
//   const myId = user?._id || user?.UserId;

//   // Fetch completed swaps
//   const fetchSwaps = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${API_BASE}/api/swaps/user/${user._id}/history`);
//       if (res.data.success) setSwaps(res.data.swaps || []);
//     } catch (err) {
//       console.error("fetchSwaps error:", err);
//       alert("Failed to load completed swaps");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSwaps();
//   }, [user?._id, feedbackSavedSignal]);

//   // fetch feedbacks for a given swap (call only when user opens Feedback)
//   const fetchFeedbacksForSwap = async (swapId) => {
//     try {
//       setFeedbacksLoading(true);
//       const res = await axios.get(`${API_BASE}/api/feedbacks/swap/${swapId}`);
//       if (res.data.success) {
//         setFeedbacks(res.data.feedbacks || []);
//       } else {
//         setFeedbacks([]);
//       }
//     } catch (err) {
//       console.error("fetchFeedbacks error:", err);
//       setFeedbacks([]);
//     } finally {
//       setFeedbacksLoading(false);
//     }
//   };

//   if (loading)
//     return (
//       <p className="text-center mt-6 text-indigo-500 font-medium">
//         Loading completed swaps...
//       </p>
//     );

//   const handleReport = async () => {
//     const msg = prompt("Enter your report message:");
//     if (!msg) return;
//     try {
//       await axios.post(`${API_BASE}/api/swaps/${selectedSwap._id}/report`, {
//         ReporterId: user._id,
//         Message: msg,
//       });
//       alert("Report sent successfully!");
//     } catch (err) {
//       console.error("Report error:", err);
//       alert("Failed to send report");
//     }
//   };

//   // compute average rating
//   const computeAvgRating = (items) => {
//     if (!items || items.length === 0) return { avg: 0, count: 0 };
//     const sum = items.reduce((s, f) => s + (Number(f.Rating) || 0), 0);
//     const avg = Math.round((sum / items.length) * 10) / 10;
//     return { avg, count: items.length };
//   };

//   // open feedback panel: fetch feedbacks then open panel
//   const openFeedbackPanel = async () => {
//     if (!selectedSwap || !selectedSwap._id) return;
//     await fetchFeedbacksForSwap(selectedSwap._id);
//     // hide form by default when opening panel
//     setShowFeedbackForm(false);
//     setShowFeedbackPanel(true);
//   };

//   // show form (placed above partner feedbacks)
//   const openFeedbackForm = () => {
//     setShowFeedbackForm(true);
//   };

//   // partner feedbacks only (filter out logged-in user's feedback)
//   const partnerFeedbacks = feedbacks.filter(
//     (f) => String(f.SenderId?._id || f.SenderId) !== String(myId)
//   );

//   return (
//     <div className="p-6 w-full min-h-screen mx-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl shadow-inner flex flex-col border border-indigo-100">
//       <input
//         ref={fileInputRef}
//         type="file"
//         className="hidden"
//         accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
//       />

//       {!selectedSwap ? (
//         <>
//           <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
//              Completed Swap History
//           </h2>

//           {swaps.length === 0 ? (
//             <div className="flex flex-col items-center justify-center mt-20 text-center">
//               <div className="text-6xl mb-4">🤝</div>
//               <h3 className="text-xl font-semibold text-gray-700">No Completed Swaps Yet</h3>
//               <p className="text-gray-500 mt-2 max-w-md">
//                 You haven’t completed any swaps yet. Once both you and your partner confirm a swap, it will appear here.
//               </p>
//             </div>
//           ) : (
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {swaps.map((swap) => (
//                 <div
//                   key={swap._id}
//                   className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-indigo-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
//                 >
//                   <div className="flex items-center justify-between mb-3">
//                     <h3 className="font-semibold text-gray-800">{swap.Sender?.Username} ↔ {swap.Receiver?.Username}</h3>
//                     <span className="text-xs font-semibold px-3 py-1 rounded-full shadow-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
//                       Completed
//                     </span>
//                   </div>

//                   <p className="text-gray-600 text-sm"><strong>Learning:</strong> {swap.SkillToLearn?.Name || "N/A"}</p>
//                   <p className="text-gray-600 text-sm"><strong>Teaching:</strong> {swap.SkillToTeach?.Name || "N/A"}</p>
//                   <p className="text-xs text-gray-400 mt-2">
//                     Completed: {swap.CompletedAt ? new Date(swap.CompletedAt).toLocaleDateString() : new Date(swap.CreatedAt).toLocaleDateString()}
//                   </p>

//                   <button
//                     onClick={() => {
//                       setSelectedSwap(swap);
//                       // do not fetch feedbacks here — user must click Feedback to open it
//                     }}
//                     className="mt-4 w-full bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-medium rounded-full px-6 py-2 shadow-md hover:from-indigo-500 hover:to-purple-600 hover:shadow-lg transition-all"
//                   >
//                     View Details
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </>
//       ) : (
//         <>
//           <button
//             onClick={() => {
//               setSelectedSwap(null);
//               setShowMaterials(false);
//               setShowFeedbackPanel(false);
//               setShowFeedbackForm(false);
//             }}
//             className="text-indigo-600 hover:underline mb-4 font-medium"
//           >
//             ← Back to History
//           </button>

//           <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-indigo-100">
//             <div className="flex items-start gap-4">
//               <div>
//                 <InitialsAvatar name={`${selectedSwap.Sender?.Username || "User"}`} />
//               </div>

//               <div className="flex-1">
//                 <h3 className="text-2xl font-bold text-gray-700 mb-1">
//                   {selectedSwap.Sender?.Username} ↔ {selectedSwap.Receiver?.Username}
//                 </h3>
//                 <p className="text-gray-600"><strong>Learning:</strong> {selectedSwap.SkillToLearn?.Name || "N/A"}</p>
//                 <p className="text-gray-600 mb-2"><strong>Teaching:</strong> {selectedSwap.SkillToTeach?.Name || "N/A"}</p>

//                 {/* feedback summary (uses already-loaded feedbacks; empty until Feedback opened) */}
//                 <div className="flex items-center gap-4 mt-3">
//                   {feedbacksLoading ? (
//                     <div className="text-sm text-gray-500">Loading feedbacks…</div>
//                   ) : (
//                     (() => {
//                       const { avg, count } = computeAvgRating(feedbacks);
//                       return (
//                         <>
//                           <div className="flex items-center gap-2">
//                             <StarsInline value={Math.round(avg)} />
//                             <div className="text-sm text-gray-700 font-medium">{avg || 0} / 5</div>
//                           </div>
//                           <div className="text-sm text-gray-500">({count} feedback{count !== 1 ? "s" : ""})</div>
//                         </>
//                       );
//                     })()
//                   )}
//                   <div className="ml-auto text-xs text-gray-500">Click Feedback to view partner feedback or give feedback</div>
//                 </div>
//               </div>
//             </div>

//             {/* Buttons */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-6">
//               <button
//                 onClick={() => setShowMaterials((p) => !p)}
//                 className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-3 rounded-xl font-medium shadow-md transition-all hover:scale-[1.02]"
//               >
//                 <FaUpload className="text-lg" />
//                 {showMaterials ? "Hide Materials" : "Show Materials"}
//               </button>

//               {/* Feedback button now fetches and opens the feedback panel */}
//               <button
//                 onClick={openFeedbackPanel}
//                 className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-xl font-medium shadow-md transition-all"
//               >
//                 <FaStar className="text-lg" />
//                 Feedback
//               </button>

//               <button
//                 onClick={handleReport}
//                 className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-3 rounded-xl font-medium shadow-md transition-all"
//               >
//                 <FaFlag className="text-lg" />
//                 Report
//               </button>
//             </div>

//             {/* Panels */}
//             <div className="mt-4 space-y-6">
//               {showMaterials && (
//                 <Materials selectedSwap={selectedSwap} user={user} reloadSignal={materialsReload} />
//               )}

//               {/* Feedback panel (only shown when Feedback button is used) */}
//            {showFeedbackPanel && (
//   <div className="bg-white rounded-lg p-4"> {/* removed border class here */}
//     <h1 className="text-3xl font-bold mb-6 text-indigo-900">Feedback</h1>

//     {showFeedbackForm ? (
//       <div className="mb-4 p-3 rounded bg-gray-50"> {/* removed border here too */}    <Feedback
//                         swap={selectedSwap}
//                         user={user}
//                         onClose={() => {
//                           // hide form and show partner feedbacks again
//                           setShowFeedbackForm(false);
//                         }}
//                         onSaved={() => {
//                           // after save: hide form, refresh list and swaps
//                           setFeedbackSavedSignal((s) => s + 1);
//                           setShowFeedbackForm(false);
//                           fetchFeedbacksForSwap(selectedSwap._id);
//                           fetchSwaps();
//                         }}
//                       />
//                     </div>
//                   ) : (
//                     <>
//                       {/* Give feedback button (opens form ABOVE partner feedbacks) */}
//                       <div className="mb-6">
//                         <button
//                           onClick={openFeedbackForm}
//                           className="
//                             bg-indigo-800 
//                             text-white 
//                             px-5 
//                             py-3 
//                             rounded-lg 
//                             text-base 
//                             font-semibold 
//                             shadow-md 
//                             hover:bg-indigo-900 
//                             transition 
//                             mt-1 
//                             mb-3
//                           "
//                         >
//                           Give Feedback
//                         </button>
//                       </div>

//                       <h4 className="font-semibold mb-3">Partner feedback</h4>

//                       {feedbacksLoading ? (
//                         <div className="text-sm text-gray-500">Loading…</div>
//                       ) : partnerFeedbacks.length === 0 ? (
//                         <div className="text-sm text-gray-500">No feedback from your partner yet.</div>
//                       ) : (
//                         <div className="space-y-3">
//                           {partnerFeedbacks.map((f) => (
//                             <div key={f._id} className="border rounded p-3 bg-gray-50">
//                               <div className="flex items-start justify-between gap-4">
//                                 <div className="flex items-center gap-3">
//                                   <InitialsAvatar name={f.SenderId?.Username || "User"} size={40} />
//                                   <div>
//                                     <div className="text-sm font-medium text-gray-800">
//                                       {f.SenderId?.Username || "User"}
//                                       <span className="text-xs text-gray-500 ml-2">— {new Date(f.Date || f.createdAt || Date.now()).toLocaleDateString()}</span>
//                                     </div>
//                                     <div className="mt-1"><StarsInline value={Number(f.Rating) || 0} /></div>
//                                   </div>
//                                 </div>

//                                 <div className="text-sm text-gray-600">{f.Rating ? `${f.Rating}/5` : ""}</div>
//                               </div>

//                               {f.Comments && <p className="mt-3 text-gray-700">{f.Comments}</p>}

//                               {f.Replies && f.Replies.length > 0 && (
//                                 <div className="mt-3 pl-3 border-l">
//                                   {f.Replies.map((r, idx) => (
//                                     <div key={idx} className="text-sm mb-2">
//                                       <span className="font-medium">{r.SenderId?.Username || r.SenderId}:</span>{" "}
//                                       <span className="text-gray-700">{r.Comment}</span>
//                                       <div className="text-xs text-gray-400">{new Date(r.Date || r.createdAt || Date.now()).toLocaleString()}</div>
//                                     </div>
//                                   ))}
//                                 </div>
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default ActivityHistory;

// pages/ActivityHistory.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaUpload, FaStar, FaFlag, FaVideo, FaHistory, FaCheckCircle, FaExchangeAlt, FaGraduationCap, FaChalkboardTeacher, FaUsers, FaCalendarAlt } from "react-icons/fa";
import Materials from "../pages/Materials.jsx";
import Feedback from "../pages/Feedback.jsx";
import Report from "../pages/Report.jsx";
import VideoDetail from "../pages/VideoDetail.jsx";

const API_BASE = "http://localhost:4000";

const InitialsAvatar = ({ name, size = 36 }) => {
  const initials = (name || "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-[#B87C4C] to-[#8E5C32] text-white font-semibold shadow-md"
    >
      {initials || "U"}
    </div>
  );
};

const StarsInline = ({ value }) => {
  if (!value || Number(value) <= 0) {
    return (
      <div className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 inline-flex items-center gap-1">
        <FaStar className="text-gray-400" />
        No rating yet
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-[#FFD700]/10 to-[#FFD700]/5 px-3 py-1 rounded-full">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          className={`text-sm ${i < value ? "text-[#E2B714]" : "text-gray-300"}`}
        />
      ))}
      <span className="text-xs font-medium text-gray-700 ml-1">{value.toFixed(1)}</span>
    </div>
  );
};

const ActivityHistory = () => {
  const [swaps, setSwaps] = useState([]);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showMaterials, setShowMaterials] = useState(false);
  const [materialsReload, setMaterialsReload] = useState(0);

  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [feedbackSavedSignal, setFeedbackSavedSignal] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [videoReload, setVideoReload] = useState(0);

  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myId = user?._id || user?.UserId;

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/swaps/user/${user._id}/history`
      );
      if (res.data.success) setSwaps(res.data.swaps || []);
    } catch (err) {
      console.error("fetchSwaps error:", err);
      alert("Failed to load completed swaps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, [user?._id, feedbackSavedSignal]);

  const fetchFeedbacksForSwap = async (swapId) => {
    try {
      setFeedbacksLoading(true);
      const res = await axios.get(`${API_BASE}/api/feedbacks/swap/${swapId}`);
      if (res.data.success) setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error("fetchFeedbacks error:", err);
      setFeedbacks([]);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  const handleShowFeedback = async () => {
    if (!showFeedbackPanel) {
      await fetchFeedbacksForSwap(selectedSwap._id);
    }
    setShowFeedbackPanel(!showFeedbackPanel);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#8E5C32]/20 border-t-[#8E5C32] rounded-full animate-spin"></div>
          <FaHistory className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#8E5C32] text-xl" />
        </div>
        <p className="mt-4 text-[#8E5C32] font-medium">Loading your swap history...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full min-h-screen  bg-gradient-to-br from-[#F8F5F0] via-[#E8F0E3] to-[#F8F5F0]
      rounded-2xl border border-[#A8BBA3]/60 shadow-inner">
      {/* MAIN LIST */}
      {!selectedSwap ? (
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#3A2A1A] flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#B87C4C] to-[#8E5C32] shadow-lg">
                  <FaHistory className="text-white text-2xl" />
                </div>
                Completed Swap History
              </h1>
              <p className="text-gray-600 mt-2">Review your past skill exchanges and feedback</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <FaCheckCircle className="text-green-500" />
              <span className="text-sm font-medium text-gray-700">{swaps.length} Completed Swaps</span>
            </div>
          </div>

          {swaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 md:mt-24 p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-[#CBBFAE]/30 max-w-2xl mx-auto">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F7F4EA] to-[#A8BBA3] flex items-center justify-center">
                  <FaExchangeAlt className="text-4xl text-[#8E5C32]" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-full shadow-lg">
                  <FaHistory className="text-[#B87C4C]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#3A2A1A] mb-3">No Completed Swaps Yet</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                Once you finish a skill swap, it will appear here with all materials, videos, and feedback for review.
              </p>
              <button 
                onClick={fetchSwaps}
                className="px-6 py-3 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Refresh
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
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <InitialsAvatar name={swap.Sender?.Username} />
                        <div className="absolute -right-1 -bottom-1 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-white p-1 rounded-full">
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
                            {swap.CompletedAt
                              ? new Date(swap.CompletedAt).toLocaleDateString()
                              : new Date(swap.CreatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
                      <FaCheckCircle className="text-green-500 text-sm" />
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50">
                      <FaGraduationCap className="text-[#3B82F6]" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Learning</p>
                        <p className="font-semibold text-gray-800">{swap.SkillToLearn?.Name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50">
                      <FaChalkboardTeacher className="text-[#B87C4C]" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Teaching</p>
                        <p className="font-semibold text-gray-800">{swap.SkillToTeach?.Name}</p>
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={() => setSelectedSwap(swap)}
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
          {/* Back Button - Using your design */}
          <div className="max-w-7xl mx-auto mb-6">
            <button
              onClick={() => {
                setSelectedSwap(null);
                setShowMaterials(false);
                setShowFeedbackPanel(false);
                setShowVideoPanel(false);
                setShowReportModal(false);
              }}
              className="bg-transparent mb-4 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <img 
                src="/backimg.png" 
                alt="Back to history"
                className="h-10 w-auto"
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
                    <InitialsAvatar name={selectedSwap.Sender?.Username} size={48} />
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-white p-1.5 rounded-full">
                      <FaUsers className="text-xs" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#3A2A1A]">
                      Swap Details
                    </h1>
                    <p className="text-gray-600 flex items-center gap-2">
                      <FaExchangeAlt className="text-[#B87C4C]" />
                      <span className="font-medium text-[#8E5C32]">
                        {selectedSwap.Sender?.Username} ↔ {selectedSwap.Receiver?.Username}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
                  <FaCheckCircle className="text-green-500" />
                  <span className="font-medium text-green-700">Completed Swap</span>
                </div>
              </div>

              {/* Skills Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-2 rounded-lg bg-blue-100">
        <FaGraduationCap className="text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 text-sm">Skill Learned</h3>
        <p className="text-xs text-gray-500">From your partner</p>
      </div>
    </div>
    <div className="text-lg font-bold text-gray-800">
      {selectedSwap.SkillToLearn?.Name || "N/A"}
    </div>
  </div>

  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-2 rounded-lg bg-amber-100">
        <FaChalkboardTeacher className="text-amber-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 text-sm">Skill Taught</h3>
        <p className="text-xs text-gray-500">To your partner</p>
      </div>
    </div>
    <div className="text-lg font-bold text-gray-800">
      {selectedSwap.SkillToTeach?.Name || "N/A"}
    </div>
  </div>
</div>

              {/* Action Buttons Grid - Fixed toggle functionality */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {/* Materials Button - Fixed toggle */}
                <button
                  onClick={() => setShowMaterials(!showMaterials)}
                  className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 
                  p-4 rounded-2xl shadow-lg hover:shadow-xl border border-[#CBBFAE]/50 
                  hover:border-[#B87C4C] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${showMaterials ? 'bg-[#8E5C32]' : 'bg-gradient-to-r from-[#B87C4C] to-[#8E5C32]'}`}>
                      <FaUpload className="text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">Materials</h4>
                      <p className="text-xs text-gray-500">Shared files & documents</p>
                    </div>
                  </div>
                  <div className={`mt-3 text-sm font-medium ${showMaterials ? 'text-[#8E5C32]' : 'text-gray-600'}`}>
                    {showMaterials ? "▼ Hide" : "▲ Show"}
                  </div>
                </button>

                {/* Feedback Button - Fixed toggle */}
                <button
                  onClick={handleShowFeedback}
                  className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 
                  p-4 rounded-2xl shadow-lg hover:shadow-xl border border-[#CBBFAE]/50 
                  hover:border-[#E2B714] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${showFeedbackPanel ? 'bg-[#E2B714]' : 'bg-gradient-to-r from-[#FFD700] to-[#E2B714]'}`}>
                      <FaStar className="text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">Feedback</h4>
                      <p className="text-xs text-gray-500">Ratings & comments</p>
                    </div>
                  </div>
                  <div className={`mt-3 text-sm font-medium ${showFeedbackPanel ? 'text-[#E2B714]' : 'text-gray-600'}`}>
                    {showFeedbackPanel ? "▼ Hide" : "▲ Show"}
                  </div>
                </button>

                {/* Videos Button - Fixed toggle */}
                <button
                  onClick={() => setShowVideoPanel(!showVideoPanel)}
                  className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 
                  p-4 rounded-2xl shadow-lg hover:shadow-xl border border-[#CBBFAE]/50 
                  hover:border-[#B72F2F] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${showVideoPanel ? 'bg-[#B72F2F]' : 'bg-gradient-to-r from-[#D47C4C] to-[#B72F2F]'}`}>
                      <FaVideo className="text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">Videos</h4>
                      <p className="text-xs text-gray-500">Session recordings</p>
                    </div>
                  </div>
                  <div className={`mt-3 text-sm font-medium ${showVideoPanel ? 'text-[#B72F2F]' : 'text-gray-600'}`}>
                    {showVideoPanel ? "▼ Hide" : "▲ Show"}
                  </div>
                </button>

                {/* Report Button */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 
                  p-4 rounded-2xl shadow-lg hover:shadow-xl border border-[#CBBFAE]/50 
                  hover:border-[#B91C1C] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-[#F97373] to-[#B91C1C]">
                      <FaFlag className="text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">Report</h4>
                      <p className="text-xs text-gray-500">Report an issue</p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-medium text-gray-600">
                    Report Issue
                  </div>
                </button>
              </div>

              {/* PANELS SECTION */}
              <div className="space-y-8">
                {showMaterials && (
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-lg border border-[#CBBFAE]">
                    <h3 className="text-xl font-bold text-[#3A2A1A] mb-6 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#B87C4C] to-[#8E5C32]">
                        <FaUpload className="text-white" />
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

                {showFeedbackPanel && (
                  <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-3xl p-6 shadow-lg border border-amber-200">
                    <h3 className="text-xl font-bold text-[#3A2A1A] mb-6 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#E2B714]">
                        <FaStar className="text-white" />
                      </div>
                      Swap Feedback
                    </h3>
                    <Feedback
                      swap={selectedSwap}
                      user={user}
                      onClose={() => setShowFeedbackPanel(false)}
                      onSaved={() => setFeedbackSavedSignal((v) => v + 1)}
                    />
                  </div>
                )}

                {showVideoPanel && (
                  <div className="bg-gradient-to-br from-white to-red-50/30 rounded-3xl p-6 shadow-lg border border-red-200">
                    <h3 className="text-xl font-bold text-[#3A2A1A] mb-6 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#D47C4C] to-[#B72F2F]">
                        <FaVideo className="text-white" />
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

                {showReportModal && (
                  <Report
                    swap={selectedSwap}
                    user={user}
                    onClose={() => setShowReportModal(false)}
                    onSubmitted={() => fetchSwaps()}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityHistory;