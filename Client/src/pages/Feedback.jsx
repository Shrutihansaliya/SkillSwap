// // pages/Feedback.jsx
// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const API_BASE = "http://localhost:4000";

// /** ✅ Simple star — filled or empty */
// const Star = ({ filled, onMouseEnter, onClick }) => (
//   <span
//     onMouseEnter={onMouseEnter}
//     onClick={onClick}
//     className={`text-3xl cursor-pointer transition ${
//       filled ? "text-yellow-400" : "text-gray-300"
//     }`}
//   >
//     ★
//   </span>
// );

// const Feedback = ({ swap, user, onClose = () => {}, onSaved = () => {} }) => {
//   const [rating, setRating] = useState(0);
//   const [hover, setHover] = useState(0);
//   const [comments, setComments] = useState("");
//   const [submitting, setSubmitting] = useState(false);
  
//   const MAX_CHARS = 500;

//   useEffect(() => {
//     setRating(0);
//     setHover(0);
//     setComments("");
//   }, [swap]);

//   const handleSubmit = async () => {
//     if (!rating) return alert("Please give a rating");

//     const senderId = user?._id || user?.UserId;
//     const otherId = (() => {
//       const s = swap?.Sender?._id || swap?.SenderId;
//       const r = swap?.Receiver?._id || swap?.ReceiverId;
//       return String(s) === String(senderId) ? r : s;
//     })();

//     if (!otherId) return alert("Could not determine recipient for feedback");

//     try {
//       setSubmitting(true);
//       const res = await axios.post(`${API_BASE}/api/feedbacks`, {
//         SwapId: swap._id,
//         SenderId: senderId,
//         ReceiverId: otherId,
//         Rating: rating,
//         Comments: comments,
//       });

//       if (res.data?.success) {
//         onSaved(res.data.feedback);
//         onClose();
//       } else {
//         alert(res.data?.message || "Failed to save feedback");
//       }
//     } catch (err) {
//       console.error("Feedback submit error", err);
//       alert("Error submitting feedback");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div
//       role="dialog"
//       aria-modal="true"
//       className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-md border border-yellow-500"
//       style={{ zIndex: 60 }}
//     >
//       {/* Header */}
//       <div className="flex items-start justify-between mb-4">
//         <div>
//           <h4 className="text-xl font-semibold text-gray-800">Give Feedback</h4>
//           <p className="text-sm text-gray-500">Rate your learning experience</p>
//         </div>
//         <button
//           onClick={onClose}
//           aria-label="Close feedback"
//           className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded transition"
//         >
//           ✕
//         </button>
//       </div>

//       {/* Rating */}
//       <div className="mb-5">
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Your Rating
//         </label>

//         <div className="flex items-center gap-3">
//           <div
//             className="flex items-center"
//             role="radiogroup"
//             onMouseLeave={() => setHover(0)}
//           >
//             {[1, 2, 3, 4, 5].map((i) => (
//               <Star
//                 key={i}
//                 filled={i <= (hover || rating)}
//                 onMouseEnter={() => setHover(i)}
//                 onClick={() => setRating(i)}
//               />
//             ))}
//           </div>
//           <div className="text-lg font-semibold text-gray-800">
//             {rating ? `${rating}/5` : ""}
//           </div>
//         </div>

//         <p className="text-xs text-gray-400 mt-2">
//           Hover to preview — click to select.
//         </p>
//       </div>

//       {/* Comments */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Comments (optional)
//         </label>
//         <textarea
//           rows="4"
//           value={comments}
//           onChange={(e) =>
//             e.target.value.length <= MAX_CHARS && setComments(e.target.value)
//           }
//           placeholder="Share your experience..."
//           className="w-full border border-yellow-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition"
//         />
//         <div className="text-xs text-gray-400 mt-1 text-right">
//           {comments.length}/{MAX_CHARS}
//         </div>
//       </div>

//       {/* Buttons */}
//       <div className="flex justify-end gap-3 mt-5">
//         <button
//           onClick={onClose}
//           className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
//           type="button"
//         >
//           Cancel
//         </button>

//         <button
//           onClick={handleSubmit}
//           disabled={submitting}
//           className="px-5 py-2 rounded-lg text-sm font-semibold bg-yellow-600 text-white shadow hover:bg-yellow-500 disabled:opacity-60 transition"
//           type="button"
//         >
//           {submitting ? "Saving…" : "Submit Feedback"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Feedback;
// pages/Feedback.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000";

/** ⭐ Single Star */
const Star = ({ filled, onMouseEnter, onClick }) => (
  <span
    onMouseEnter={onMouseEnter}
    onClick={onClick}
    className={`text-3xl cursor-pointer transition ${
      filled ? "text-yellow-400" : "text-gray-300"
    }`}
  >
    ★
  </span>
);

const Feedback = ({ swap, user, onClose = () => {}, onSaved = () => {} }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const MAX_CHARS = 500;

  /** ⭐ NEW STATES */
  const [partnerFeedback, setPartnerFeedback] = useState(null);
  const [myFeedback, setMyFeedback] = useState(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  /** RESET when modal opens */
  useEffect(() => {
    setRating(0);
    setHover(0);
    setComments("");

    if (!swap?._id || !user) return;

    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/feedbacks/swap/${swap._id}`);

        if (res.data?.success) {
          const all = res.data.feedbacks;
          const senderId = user?._id || user?.UserId;

          const mine = all.find((f) => String(f.SenderId?._id) === String(senderId));
          const partner = all.find((f) => String(f.SenderId?._id) !== String(senderId));

          setMyFeedback(mine || null);
          setPartnerFeedback(partner || null);

          /** ⭐ AUTO-BIND MY feedback */
          if (mine) {
            setRating(mine.Rating);
            setComments(mine.Comments || "");
          }
        }
      } catch (err) {
        console.error("Load feedback error:", err);
      } finally {
        setLoadingPartner(false);
      }
    };

    fetchFeedbacks();
  }, [swap, user]);

  /** ⭐ SUBMIT FEEDBACK (CREATE OR UPDATE) */
  const handleSubmit = async () => {
    if (!rating) return alert("Please give a rating");

    const senderId = user?._id || user?.UserId;
    const otherId = (() => {
      const s = swap?.Sender?._id || swap?.SenderId;
      const r = swap?.Receiver?._id || swap?.ReceiverId;
      return String(s) === String(senderId) ? r : s;
    })();

    const data = {
      SwapId: swap._id,
      SenderId: senderId,
      ReceiverId: otherId,
      Rating: rating,
      Comments: comments
    };

    const url = myFeedback
      ? `${API_BASE}/api/feedbacks/${myFeedback._id}`
      : `${API_BASE}/api/feedbacks`;

    const method = myFeedback ? "put" : "post";

    try {
      setSubmitting(true);
      const res = await axios[method](url, data);

      if (res.data?.success) {
        onSaved(res.data.feedback);
        onClose();
      } else {
        alert(res.data?.message || "Failed to save feedback");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Error submitting feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-md border border-yellow-500"
      style={{ zIndex: 60 }}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-xl font-semibold text-gray-800">Give Feedback</h4>
          <p className="text-sm text-gray-500">Rate your learning experience</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded transition"
        >
          ✕
        </button>
      </div>

      {/* ⭐ INFO IF USER ALREADY GAVE FEEDBACK */}
      {myFeedback && (
        <p className="text-green-600 font-medium text-sm mb-2">
          ✔ You already submitted feedback — You may update it.
        </p>
      )}

      {/* ⭐ RATING */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </label>

        <div className="flex items-center gap-3">
          <div
            onMouseLeave={() => setHover(0)}
            className="flex items-center"
            role="radiogroup"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                filled={i <= (hover || rating)}
                onMouseEnter={() => setHover(i)}
                onClick={() => setRating(i)}
              />
            ))}
          </div>

          <div className="text-lg font-semibold text-gray-800">
            {rating ? `${rating}/5` : ""}
          </div>
        </div>
      </div>

      {/* ⭐ COMMENTS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comments (optional)
        </label>
        <textarea
          rows="4"
          value={comments}
          onChange={(e) =>
            e.target.value.length <= MAX_CHARS && setComments(e.target.value)
          }
          placeholder="Share your experience..."
          className="w-full border border-yellow-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-300"
        />
        <p className="text-xs text-gray-400 text-right">
          {comments.length}/{MAX_CHARS}
        </p>
      </div>

      {/* ⭐ PARTNER FEEDBACK */}
      <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <h3 className="font-semibold text-gray-800 text-lg mb-3">
          Partner's Feedback
        </h3>

        {loadingPartner ? (
          <p className="text-gray-500 text-sm italic">Loading…</p>
        ) : partnerFeedback ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl ${
                    i < partnerFeedback.Rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
              <span className="ml-2 text-gray-700 font-semibold">
                {partnerFeedback.Rating}/5
              </span>
            </div>

            <p className="text-gray-700 bg-white p-3 rounded-lg border shadow-sm text-sm">
              {partnerFeedback.Comments || "No comment provided"}
            </p>

            <p className="text-[11px] text-gray-500">— {partnerFeedback.SenderId?.Username}</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Your partner has not submitted feedback yet.
          </p>
        )}
      </div>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-yellow-600 text-white hover:bg-yellow-500 disabled:opacity-60"
        >
          {submitting ? "Saving…" : myFeedback ? "Update Feedback" : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
};

export default Feedback;
