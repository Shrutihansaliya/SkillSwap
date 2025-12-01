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
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function ConfirmSwap({ requestId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [swapInfo, setSwapInfo] = useState(null);

  useEffect(() => {
    fetchSwapInfo();
  }, []);

  const fetchSwapInfo = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/subscriptions/user/${localStorage.getItem("userId")}`
      );

      const subs = res.data.subscriptions || [];
      const active = subs.find((s) => s.Status === "Active");

      setSwapInfo({
        activeSwaps: active?.SwapsRemaining ?? 0,
        hasSwaps: active && active.SwapsRemaining > 0,
      });
    } catch (err) {
      console.error("Error fetching swap info", err);
    }
  };

  const handleConfirm = async () => {
    if (!swapInfo?.hasSwaps) {
      toast.error("You do not have enough swaps.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:4000/api/swaps/confirm/${requestId}`
      );

      if (res.data.success) {
        toast.success("Swap confirmed successfully");
        onClose();
      } else {
        toast.error(res.data.message || "Failed to confirm swap");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">Confirm Swap</h2>

      {swapInfo && (
        <p className="text-gray-700 mb-4">
          Available Swaps: <strong>{swapInfo.activeSwaps}</strong>
        </p>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading || !swapInfo?.hasSwaps}
        className={`px-5 py-2 rounded text-white ${
          swapInfo?.hasSwaps
            ? "bg-indigo-600 hover:bg-indigo-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? "Processing..." : "Confirm Swap"}
      </button>
    </div>
  );
}

export default ConfirmSwap;
