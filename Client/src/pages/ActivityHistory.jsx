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
import { FaUpload, FaStar, FaFlag, FaVideo } from "react-icons/fa";
import Materials from "../pages/Materials.jsx";
import Feedback from "../pages/Feedback.jsx";
import Report from "../pages/Report.jsx";
import VideoDetail from "../pages/VideoDetail.jsx"; // ✅ VIDEO PANEL

const API_BASE = "http://localhost:4000";

// Avatar (currently unused, future use mate rakhelu)
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
      className="flex items-center justify-center rounded-full bg-[#CBBFAE] text-[#4A3420] font-semibold"
    >
      {initials || "U"}
    </div>
  );
};

// Stars (currently unused, but theme-friendly)
const StarsInline = ({ value }) => {
  if (!value || Number(value) <= 0) {
    return (
      <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 inline-block">
        No rating yet
      </div>
    );
  }
  return (
    <div className="text-[#E2B714] inline-block select-none">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-sm ${i < value ? "" : "opacity-40"}`}>
          {i < value ? "★" : "☆"}
        </span>
      ))}
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
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSavedSignal, setFeedbackSavedSignal] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);

  // ✅ NEW VIDEO PANEL STATES
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [videoReload, setVideoReload] = useState(0);

  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myId = user?._id || user?.UserId;

  // Fetch completed swaps
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

  // Fetch feedbacks for swap
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

  if (loading)
    return (
      <p className="text-center mt-6 text-[#8E5C32] font-medium">
        Loading completed swaps...
      </p>
    );

  // Compute avg rating (future use mate)
  const computeAvgRating = (items) => {
    if (!items || items.length === 0) return { avg: 0, count: 0 };
    const sum = items.reduce((s, f) => s + (Number(f.Rating) || 0), 0);
    const avg = Math.round((sum / items.length) * 10) / 10;
    return { avg, count: items.length };
  };

  const partnerFeedbacks = feedbacks.filter(
    (f) => String(f.SenderId?._id || f.SenderId) !== String(myId)
  );

  return (
    <div
      className="p-6 w-full min-h-screen mx-auto 
      bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA] 
      rounded-3xl shadow-inner flex flex-col border border-[#A8BBA3]/60"
    >
      {/* MAIN LIST */}
      {!selectedSwap ? (
        <>
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent drop-shadow-sm">
            Completed Swap History
          </h2>

          {swaps.length === 0 ? (
            <div className="flex flex-col items-center mt-20">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-[#3A2A1A]">
                No Completed Swaps Yet
              </h3>
              <p className="text-gray-600 mt-2 text-sm">
                Once you finish a swap, you’ll see it here with all materials,
                videos and feedback.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {swaps.map((swap) => (
                <div
                  key={swap._id}
                  className="bg-[#FDFCF8]/95 backdrop-blur-md rounded-3xl shadow-lg p-6 
                  border border-[#CBBFAE] hover:border-[#B87C4C] 
                  hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#3A2A1A]">
                      {swap.Sender?.Username} ↔ {swap.Receiver?.Username}
                    </h3>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E4D5C4] text-[#4A3420]">
                      Completed
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm">
                    <strong>Learning:</strong> {swap.SkillToLearn?.Name}
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Teaching:</strong> {swap.SkillToTeach?.Name}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Completed on{" "}
                    {swap.CompletedAt
                      ? new Date(swap.CompletedAt).toLocaleDateString()
                      : new Date(swap.CreatedAt).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => setSelectedSwap(swap)}
                    className="mt-4 w-full bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] 
                    text-white rounded-full py-2 shadow-md 
                    hover:shadow-lg hover:scale-[1.02] transition-all text-sm font-semibold"
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
              setShowMaterials(false);
              setShowFeedbackPanel(false);
              setShowVideoPanel(false);
              setShowReportModal(false);
            }}
            className="text-[#8E5C32] hover:underline mb-4 font-medium text-sm"
          >
            ← Back to history
          </button>

          {/* DETAIL CARD */}
          <div className="bg-[#FDFCF8]/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-[#CBBFAE]">
            {/* Header */}
            <h3 className="text-2xl font-bold text-[#3A2A1A] mb-2">
              {selectedSwap.Sender?.Username} ↔{" "}
              {selectedSwap.Receiver?.Username}
            </h3>

            <p className="text-gray-700 text-sm">
              <strong>Learning:</strong>{" "}
              {selectedSwap.SkillToLearn?.Name || "N/A"}
            </p>
            <p className="text-gray-700 text-sm mb-2">
              <strong>Teaching:</strong>{" "}
              {selectedSwap.SkillToTeach?.Name || "N/A"}
            </p>

            {/* Buttons Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-8">
              {/* Materials */}
              <button
                onClick={() => setShowMaterials((p) => !p)}
                className="bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] 
                text-white px-4 py-3 rounded-xl shadow 
                hover:shadow-lg hover:scale-[1.02] text-sm font-medium"
              >
                <FaUpload className="inline-block mr-2" />
                {showMaterials ? "Hide Materials" : "Show Materials"}
              </button>

              {/* Feedback */}
              <button
                onClick={async () => {
                  await fetchFeedbacksForSwap(selectedSwap._id);
                  setShowFeedbackPanel(true);
                  setShowFeedbackForm(false);
                }}
                className="bg-[#E2B714] text-[#3A2A1A] px-4 py-3 rounded-xl shadow 
                hover:bg-[#D1A710] hover:shadow-lg hover:scale-[1.02] text-sm font-medium"
              >
                <FaStar className="inline-block mr-2" />
                Feedback
              </button>

              {/* 🎥 Show/Hide Videos */}
              <button
                onClick={() => setShowVideoPanel((p) => !p)}
                className="bg-gradient-to-r from-[#D47C4C] to-[#B72F2F] 
                text-white px-4 py-3 rounded-xl shadow 
                hover:shadow-lg hover:scale-[1.02] text-sm font-medium"
              >
                <FaVideo className="inline-block mr-2" />
                {showVideoPanel ? "Hide Videos" : "Show Videos"}
              </button>

              {/* Report */}
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-gradient-to-r from-[#F97373] to-[#B91C1C] 
                text-white px-4 py-3 rounded-xl shadow 
                hover:shadow-lg hover:scale-[1.02] text-sm font-medium"
              >
                <FaFlag className="inline-block mr-2" />
                Report
              </button>
            </div>

            {/* PANELS */}
            <div className="space-y-8">
              {showMaterials && (
                <Materials
                  selectedSwap={selectedSwap}
                  user={user}
                  reloadSignal={materialsReload}
                />
              )}

              {showFeedbackPanel && (
                <Feedback
                  swap={selectedSwap}
                  user={user}
                  onClose={() => setShowFeedbackPanel(false)}
                  onSaved={() => setFeedbackSavedSignal((v) => v + 1)}
                />
              )}

              {/* 🎥 VIDEO PANEL */}
              {showVideoPanel && (
                <div className="bg-white rounded-3xl p-4 shadow-lg border border-[#CBBFAE]">
                  <VideoDetail
                    swapId={selectedSwap._id}
                    user={user}
                    reload={videoReload}
                  />
                </div>
              )}

              {/* Report Modal */}
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
        </>
      )}
    </div>
  );
};

export default ActivityHistory;
