// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { FiUpload, FiSend, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
// import { useNavigate } from "react-router-dom";

// export default function SkillRequest() {
//   const navigate = useNavigate();
//   const [user, setUser] = useState(null);

//   const [skillName, setSkillName] = useState("");
//   const [message, setMessage] = useState("");
//   const [file, setFile] = useState(null);

//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(false);

//   useEffect(() => {
//     const loggedInUser = JSON.parse(localStorage.getItem("user"));
//     if (!loggedInUser) {
//       navigate("/login");
//       return;
//     }
//     setUser(loggedInUser);
//   }, [navigate]);

//   const userId = user?._id || user?.UserId;

//   const fetchRequests = async () => {
//     if (!userId) return;
//     setFetching(true);
//     try {
//       const res = await axios.get(`http://localhost:4000/api/skill-requests/user/${userId}`);
//       setRequests(res.data.requests || []);
//     } catch (err) {
//       console.error("Fetch skill requests error:", err);
//       toast.error("Unable to load your requests");
//     } finally {
//       setFetching(false);
//     }
//   };

//   useEffect(() => {
//     if (userId) fetchRequests();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId]);

//   const onFileChange = (e) => {
//     setFile(e.target.files?.[0] || null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!skillName.trim()) {
//       toast.error("Please enter a skill name.");
//       return;
//     }
//     if (!userId) {
//       toast.error("User not found. Please login again.");
//       navigate("/login");
//       return;
//     }

//     setLoading(true);
//     try {
//       // If backend accepts multipart/form-data for file upload:
//       const formData = new FormData();
//       formData.append("userId", userId);
//       formData.append("username", user?.Username || user?.name || "");
//       formData.append("skillName", skillName.trim());
//       formData.append("message", message.trim());
//       if (file) formData.append("attachment", file);

//       const res = await axios.post(
//         "http://localhost:4000/api/skill-requests",
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );

//       if (res.data.success) {
//         toast.success(res.data.message || "Request sent to admin");
//         setSkillName("");
//         setMessage("");
//         setFile(null);
//         fetchRequests(); // refresh list
//       } else {
//         toast.error(res.data.message || "Failed to send request");
//       }
//     } catch (err) {
//       console.error("Submit skill request error:", err);
//       toast.error("Error sending request");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderStatus = (status) => {
//     const s = (status || "").toLowerCase();
//     if (s === "approved" || s === "accepted") {
//       return (
//         <span className="flex items-center gap-1 text-green-700 font-semibold">
//           <FiCheckCircle /> Approved
//         </span>
//       );
//     }
//     if (s === "rejected") {
//       return (
//         <span className="flex items-center gap-1 text-red-600 font-semibold">
//           <FiXCircle /> Rejected
//         </span>
//       );
//     }
//     return (
//       <span className="flex items-center gap-1 text-yellow-700 font-semibold">
//         <FiClock /> Pending
//       </span>
//     );
//   };

//   return (
//     <div className="bg-[#F7F4EA] rounded-2xl p-6 shadow-lg border border-[#A8BBA3]/60">
//       <h3 className="text-2xl font-bold text-[#B87C4C] mb-4">Request a Skill</h3>

//       <p className="text-sm text-gray-600 mb-6">
//         If a skill isn't available, send a quick request to admin to add it. Add a short message or attach an example file (optional).
//       </p>

//       <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 max-w-2xl">
//         <div>
//           <label className="text-sm font-medium text-gray-700 mb-1 block">Skill Name</label>
//           <input
//             value={skillName}
//             onChange={(e) => setSkillName(e.target.value)}
//             placeholder="e.g. React + TypeScript"
//             className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#B87C4C]/40 bg-white/80 outline-none"
//           />
//         </div>

//         <div>
//           <label className="text-sm font-medium text-gray-700 mb-1 block">Message (optional)</label>
//           <textarea
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             placeholder="Why do you want this skill or any details for admin..."
//             className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#B87C4C]/40 bg-white/80 outline-none min-h-[100px]"
//           />
//         </div>

//         <div>
//           <label className="text-sm font-medium text-gray-700 mb-1 block">Attachment (optional)</label>
//           <div className="flex gap-2 items-center">
//             <label
//               htmlFor="attachment"
//               className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-[#A8BBA3]/10 cursor-pointer text-sm"
//             >
//               <FiUpload />
//               <span>{file ? file.name : "Choose file"}</span>
//             </label>
//             <input id="attachment" type="file" className="hidden" onChange={onFileChange} />
//             {file && (
//               <button
//                 type="button"
//                 onClick={() => setFile(null)}
//                 className="text-sm text-gray-600 underline"
//               >
//                 Remove
//               </button>
//             )}
//           </div>
//         </div>

//         <div className="flex items-center gap-3">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`flex items-center gap-2 bg-[#B87C4C] text-white px-4 py-2 rounded-xl font-semibold transition-all ${
//               loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#8E5C32]"
//             }`}
//           >
//             <FiSend />
//             <span>{loading ? "Sending..." : "Send Request"}</span>
//           </button>

//           <button
//             type="button"
//             onClick={() => {
//               setSkillName("");
//               setMessage("");
//               setFile(null);
//             }}
//             className="px-3 py-2 rounded-xl border text-sm"
//           >
//             Clear
//           </button>
//         </div>
//       </form>

//       {/* Previous requests */}
//       <div className="mt-8">
//         <h4 className="text-lg font-semibold text-gray-800 mb-3">Your Requests</h4>

//         {fetching ? (
//           <p className="text-gray-500">Loading your requests...</p>
//         ) : requests.length === 0 ? (
//           <p className="text-gray-500">No requests yet. Send your first request above.</p>
//         ) : (
//           <div className="space-y-3">
//             {requests.map((r) => (
//               <div
//                 key={r._id || r.id || `${r.skillName}-${r.createdAt}`}
//                 className="p-3 bg-white rounded-xl border border-[#E6E4DE] flex justify-between items-start"
//               >
//                 <div>
//                   <div className="flex items-center gap-3">
//                     <h5 className="font-semibold text-gray-800">{r.skillName}</h5>
//                     <span className="text-xs text-gray-500"> • {new Date(r.createdAt || r.createdAtAt || Date.now()).toLocaleString()}</span>
//                   </div>
//                   {r.message && <p className="text-sm text-gray-600 mt-1">{r.message}</p>}
//                   {r.attachmentUrl && (
//                     <a
//                       href={r.attachmentUrl}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="text-xs text-blue-600 underline mt-2 inline-block"
//                     >
//                       View attachment
//                     </a>
//                   )}
//                 </div>

//                 <div className="text-right">
//                   {renderStatus(r.status)}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
// SkillRequest.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiSend, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function SkillRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [skillName, setSkillName] = useState("");
  const [message, setMessage] = useState("");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Load user from localStorage (same pattern you used before)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) {
        navigate("/login");
        return;
      }
      const parsed = JSON.parse(stored);
      setUser(parsed);
    } catch (err) {
      console.error("Failed to parse user from storage:", err);
      navigate("/login");
    }
  }, [navigate]);

  const userId = user?._id || user?.UserId || user?.id;

  // Fetch requests for this user
  const fetchRequests = async () => {
    if (!userId) return;
    setFetching(true);
    try {
      const res = await axios.get(`/api/skill-requests/user/${userId}`);
      if (res.data && res.data.requests) {
        setRequests(res.data.requests);
      } else if (res.data && res.data.success && res.data.requests) {
        setRequests(res.data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      toast.error("Unable to load your requests");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (userId) fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const resetForm = () => {
    setSkillName("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) {
      toast.error("Please enter a skill name.");
      return;
    }
    if (!userId) {
      toast.error("User not found. Please login again.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId,
        username: user?.Username || user?.name || user?.Username || user?.username || "",
        skillName: skillName.trim(),
        message: message.trim() || null,
      };

      const res = await axios.post("/api/skill-requests", payload);

      if (res.data && res.data.success) {
        toast.success(res.data.message || "Request sent to admin");
        resetForm();
        // add new request to top of list (if returned)
        if (res.data.request) {
          setRequests((prev) => [res.data.request, ...prev]);
        } else {
          fetchRequests();
        }
      } else {
        toast.error((res.data && res.data.message) || "Failed to send request");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Error sending request");
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "accepted") {
      return (
        <span className="flex items-center gap-1 text-green-700 font-semibold">
          <FiCheckCircle /> Approved
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span className="flex items-center gap-1 text-red-600 font-semibold">
          <FiXCircle /> Rejected
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-yellow-700 font-semibold">
        <FiClock /> Pending
      </span>
    );
  };

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  return (
    <div className="bg-[#F7F4EA] rounded-2xl p-6 shadow-lg border border-[#A8BBA3]/60">
      <h3 className="text-2xl font-bold text-[#B87C4C] mb-4">Request a Skill</h3>

      <p className="text-sm text-gray-600 mb-6">
        If a skill isn't available, send a quick request to admin to add it. Just add a short message (optional).
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 max-w-2xl">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Skill Name</label>
          <input
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            placeholder="e.g. React + TypeScript"
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#B87C4C]/40 bg-white/80 outline-none"
            maxLength={200}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Why do you want this skill or any details for admin..."
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#B87C4C]/40 bg-white/80 outline-none min-h-[100px]"
            maxLength={1000}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 bg-[#B87C4C] text-white px-4 py-2 rounded-xl font-semibold transition-all ${
              loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#8E5C32]"
            }`}
          >
            <FiSend />
            <span>{loading ? "Sending..." : "Send Request"}</span>
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="px-3 py-2 rounded-xl border text-sm"
          >
            Clear
          </button>

        </div>
      </form>

      {/* Previous requests */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-800">Your Requests</h4>
          <span className="text-sm text-gray-500">{requests.length} total</span>
        </div>

        {fetching ? (
          <p className="text-gray-500">Loading your requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500">No requests yet. Send your first request above.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r._id || r.id || `${r.SkillName}-${r.CreatedAt}`}
                className="p-3 bg-white rounded-xl border border-[#E6E4DE] flex justify-between items-start"
              >
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-3">
                    <h5 className="font-semibold text-gray-800">{r.SkillName || r.skillName}</h5>
                    <span className="text-xs text-gray-500"> • {formatDate(r.CreatedAt || r.createdAt || r.createdAtAt)}</span>
                  </div>
                  { (r.Message || r.message) && <p className="text-sm text-gray-600 mt-1">{r.Message || r.message}</p> }

                  {/* Admin reply (if any) */}
                  { (r.AdminReply || r.adminReply) && (
                    <div className="mt-3 p-2 bg-[#f8fafc] rounded-lg border border-[#eef2ff]">
                      <div className="text-xs text-gray-600 font-medium">Admin reply:</div>
                      <div className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{r.AdminReply || r.adminReply}</div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  {renderStatus(r.Status || r.status)}
                  {/* optional: show updated at */}
                  <div className="text-xs text-gray-400 mt-2">{r.UpdatedAt ? formatDate(r.UpdatedAt) : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
