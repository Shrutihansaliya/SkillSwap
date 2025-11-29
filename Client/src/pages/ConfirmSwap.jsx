// import React, { useState } from "react";
// import axios from "axios";

// /**
//  * ConfirmSwap.jsx
//  * - Handles confirmation of swap completion
//  * - Takes swap + user props
//  * - Calls backend API on confirm
//  */

// const ConfirmSwap = ({ swap, user, onConfirmed }) => {
//   const [loading, setLoading] = useState(false);

//   const handleConfirm = async () => {
//     if (!swap || !user) return alert("Missing data.");

//     const confirm = window.confirm(
//       "Have you completed this swap? Click OK to confirm."
//     );
//     if (!confirm) return;

//     try {
//       setLoading(true);
//       const res = await axios.put(
//         `http://localhost:4000/api/swaps/${swap._id}/confirm`,
//         { userId: user._id }
//       );

//       if (res.data.success) {
//         alert("✅ Swap confirmed successfully!");
//         onConfirmed && onConfirmed(res.data.swap); // update parent
//       } else {
//         alert(res.data.message || "Failed to confirm swap");
//       }
//     } catch (err) {
//       console.error("❌ Confirm Error:", err);
//       alert(err.response?.data?.message || "Failed to confirm completion");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const alreadyConfirmed =
//     swap.Status === "Completed" ||
//     swap.Confirmations?.[
//       swap.Sender?._id === user._id
//         ? "SenderConfirmed"
//         : "ReceiverConfirmed"
//     ];

//   return (
//     <button
//       onClick={handleConfirm}
//       disabled={alreadyConfirmed || loading}
//       className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium shadow-md transition-all ${
//         alreadyConfirmed
//           ? "bg-gray-300 text-gray-600 cursor-not-allowed"
//           : "bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white"
//       }`}
//     >
//       {loading ? "⏳ Confirming..." : "✅ Confirm Swap"}
//     </button>
//   );
// };

// export default ConfirmSwap;
import { useState } from "react";
import axios from "axios";

/**
 * ConfirmSwap.jsx
 * - Handles confirmation of swap completion
 * - Takes props: swap, user, and onConfirmed callback
 */
const API_BASE = "http://localhost:4000";

const ConfirmSwap = ({ swap, user, onConfirmed }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!swap || !user) return alert("Missing data.");
    if (swap.Status === "Completed") return alert("This swap is already completed.");

    const senderId =
      swap.Sender?._id ||
      swap.Sender ||
      swap.RequestId?.SenderId ||
      "";

    const currentUserId = user._id || user.UserId;
    const myKey = senderId === currentUserId ? "SenderConfirmed" : "ReceiverConfirmed";
    const alreadyConfirmed = Boolean(swap?.Confirmations?.[myKey]);

    if (alreadyConfirmed) return alert("You have already confirmed this swap.");

    if (!window.confirm("Have you completed this swap? Confirm to mark as done.")) return;

    try {
      setLoading(true);
      const res = await axios.put(`${API_BASE}/api/swaps/${swap._id}/confirm`, {
        userId: user._id,
      });

      if (res.data.success) {
        alert("✅ Swap confirmed!");
        if (onConfirmed) onConfirmed();
      } else {
        alert(res.data.message || "Failed to confirm swap");
      }
    } catch (err) {
      console.error("Confirm swap error:", err);
      alert(err.response?.data?.message || "Error confirming swap");
    } finally {
      setLoading(false);
    }
  };

  const senderId =
    swap?.Sender?._id || swap?.Sender || swap?.RequestId?.SenderId || "";
  const currentUserId = user?._id || user?.UserId;
  const myKey = senderId === currentUserId ? "SenderConfirmed" : "ReceiverConfirmed";
  const confirmDisabled = swap?.Status === "Completed" || swap?.Confirmations?.[myKey];

  return (
    <button
      onClick={handleConfirm}
      disabled={loading || confirmDisabled}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium shadow-md transition-all ${
        loading || confirmDisabled
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-gradient-to-r from-green-400 to-green-500 text-white hover:from-green-500 hover:to-green-600"
      }`}
    >
      {loading ? "Confirming..." : "✅ Confirm"}
    </button>
  );
};

export default ConfirmSwap;
