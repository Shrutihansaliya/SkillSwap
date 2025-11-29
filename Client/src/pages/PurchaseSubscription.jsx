// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { FiCheck } from "react-icons/fi";

// /**
//  * PurchaseSubscription.jsx
//  * - Paste this entire file replacing your current component
//  * - Keeps your existing logic + fetches, but card UI updated to match the screenshot
//  */

// function PurchaseSubscription({ userId }) {
//   const [plans, setPlans] = useState([]);
//   const [filteredPlans, setFilteredPlans] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [message, setMessage] = useState("");
//   const [isError, setIsError] = useState(false);
//   const [loadingId, setLoadingId] = useState(null);

//   // small helper: choose gradient set per index
//   const colorSets = [
//     { header: "from-pink-500 to-pink-400", button: "from-pink-500 to-indigo-500", accent: "pink" },
//     { header: "from-blue-500 to-blue-400", button: "from-blue-500 to-indigo-600", accent: "blue" },
//     { header: "from-purple-600 to-indigo-600", button: "from-purple-600 to-indigo-500", accent: "violet" },
//     // add more if you have more plans
//   ];

//   useEffect(() => {
//     const fetchPlans = async () => {
//       try {
//         const res = await axios.get("http://localhost:4000/api/subscription-plans");
//         if (res.data?.success && Array.isArray(res.data.data)) {
//           const formatted = res.data.data.map((plan) => ({
//             ...plan,
//             Price:
//               plan.Price && plan.Price.$numberDecimal
//                 ? parseFloat(plan.Price.$numberDecimal)
//                 : parseFloat(plan.Price || 0),
//           }));
//           setPlans(formatted);
//           setFilteredPlans(formatted);
//         } else {
//           setPlans([]);
//           setFilteredPlans([]);
//         }
//       } catch (err) {
//         console.error("Error fetching plans:", err);
//         setPlans([]);
//         setFilteredPlans([]);
//       }
//     };
//     fetchPlans();
//   }, []);

//   useEffect(() => {
//     if (!searchTerm.trim()) {
//       setFilteredPlans(plans);
//       return;
//     }

//     const term = searchTerm.trim().toLowerCase();
//     const numberTerm = parseFloat(term);

//     const filtered = plans.filter((plan) => {
//       const matchesName = plan.Name?.toLowerCase().includes(term);
//       const matchesSwaps = String(plan.SwapLimit).includes(term);
//       const matchesPrice =
//         !isNaN(numberTerm) &&
//         ((plan.Price >= numberTerm - 500 && plan.Price <= numberTerm + 500) ||
//           String(plan.Price).includes(term));

//       return matchesName || matchesSwaps || matchesPrice;
//     });

//     setFilteredPlans(filtered);
//   }, [searchTerm, plans]);

//   const handlePurchase = async (planId) => {
//     setLoadingId(planId);
//     try {
//       const res = await axios.post("http://localhost:4000/api/payment/create-order", {
//         userId,
//         planId,
//       });

//       if (!res.data.success) {
//         alert(res.data.message || "Order creation failed");
//         setLoadingId(null);
//         return;
//       }

//       const { key, orderId, amount } = res.data;

//       // ensure amount used for display is rupees; razorpay needs paise but when using orderId popup shows amount
//       const amountRupees = amount ?? 0;
//       const amountPaise = Math.round(Number(amountRupees) * 100);

//       const options = {
//         key,
//         amount: amountPaise,
//         currency: "INR",
//         name: "SkillSwap Subscription",
//         order_id: orderId,
//         handler: async function (response) {
//           try {
//             const verify = await axios.post("http://localhost:4000/api/payment/verify-payment", {
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_signature: response.razorpay_signature,
//               userId,
//               planId,
//             });
//             alert(verify.data.message || "Payment verified");
//           } catch (err) {
//             console.error("Verify error:", err);
//             alert("Payment verification failed");
//           } finally {
//             setLoadingId(null);
//           }
//         },
//         modal: { ondismiss: () => setLoadingId(null) },
//       };

//       const rzp = new window.Razorpay(options);
//       rzp.open();
//     } catch (err) {
//       console.error(err);
//       alert("Payment failed. Try again.");
//       setLoadingId(null);
//     }
//   };

//   const formatCurrency = (v) => {
//     const n = Number(v || 0);
//     return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
//   };

//   return (
//     <div className="p-6 sm:p-10 bg-gradient-to-br from-indigo-50 via-white to-pink-50 min-h-[75vh] rounded-3xl shadow-inner border border-indigo-100">
//       {/* Header */}
//       <div className="max-w-6xl mx-auto">
//         <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
//           <div>
//             <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Choose your plan</h1>
//             <p className="text-gray-600 mt-2">Pick a plan and unlock skill swaps. Secure payments powered by Razorpay.</p>
//           </div>

//           <div className="w-full md:w-72">
//             <input
//               type="text"
//               placeholder="Search plans..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-4 pr-4 py-2 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
//             />
//           </div>
//         </div>

//         {/* Cards grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredPlans.length > 0 ? (
//             filteredPlans.map((plan, idx) => {
//               const colors = colorSets[idx % colorSets.length];
//               return (
//                 <div key={plan._id} className="relative">
//                   {/* Card container */}
//                   <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
//                     {/* Colored header with wave SVG */}
//                     <div className={`relative overflow-hidden ${" "}`}>
//                       <div className={`h-20 w-full bg-gradient-to-r ${colors.header} flex items-center justify-center`}>
//                         <div className="text-white font-semibold text-lg">{plan.Name}</div>
//                       </div>
//                       {/* Wave SVG to create curved bottom */}
//                       <svg
//                         viewBox="0 0 500 80"
//                         preserveAspectRatio="none"
//                         className="-mt-1 w-full h-8"
//                         xmlns="http://www.w3.org/2000/svg"
//                       >
//                         <path
//                           d="M0,30 C120,70 220,0 500,40 L500,00 L0,0 Z"
//                           fill="white"
//                           opacity="1"
//                         />
//                       </svg>
//                     </div>

//                     {/* Card body */}
//                     <div className="p-6">
//                       {/* Price center */}
//                       <div className="flex items-center justify-center">
//                         <div className="text-center">
//                           <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">₹ {formatCurrency(plan.Price)}</div>
//                           <div className="text-sm text-gray-500 mt-1">/ month</div>
//                         </div>
//                       </div>

//                       {/* Features */}
//                       <ul className="mt-6 space-y-3 text-sm text-gray-600">
//                         <li className="flex items-start gap-3">
//                           <span className="mt-1 text-green-500">
//                             <FiCheck />
//                           </span>
//                           <span>Access to community swaps</span>
//                         </li>
//                         <li className="flex items-start gap-3">
//                           <span className="mt-1 text-green-500">
//                             <FiCheck />
//                           </span>
//                           <span>{plan.SwapLimit} swaps included</span>
//                         </li>
//                         <li className="flex items-start gap-3">
//                           <span className="mt-1 text-green-500">
//                             <FiCheck />
//                           </span>
//                           <span>Priority support & events</span>
//                         </li>
//                       </ul>

//                       {/* Coin badge + buy button */}
//                       <div className="mt-6 flex items-center justify-between gap-4">
//                         {/* coin badge */}
//                         <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-full">
//                           <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold">⚡</div>
//                           <div className="text-sm text-gray-700"> {Math.max(10, plan.SwapLimit * 1)} </div>
//                         </div>

//                         {/* CTA */}
//                         <button
//                           onClick={() => handlePurchase(plan._id)}
//                           disabled={loadingId === plan._id}
//                           className={`flex-1 ml-2 py-3 rounded-full font-semibold text-white shadow-lg transition ${
//                             colors.button ? `bg-gradient-to-r ${colors.button}` : "bg-indigo-600"
//                           } disabled:opacity-60`}
//                         >
//                           {loadingId === plan._id ? "Processing..." : "Buy now"}
//                         </button>
//                       </div>
//                     </div> {/* end body */}
//                   </div> {/* end card */}
//                 </div>
//               );
//             })
//           ) : (
//             <div className="col-span-full text-center text-gray-500">No subscription plans found.</div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default PurchaseSubscription;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiCheck } from "react-icons/fi";

function PurchaseSubscription({ userId }) {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  // 🌿 Same themed colors
  const commonColors = {
    header: "from-[#B87C4C] to-[#8E5C32]",
    button: "from-[#B87C4C] to-[#8E5C32]",
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/subscription-plans"
        );
        if (res.data?.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((plan) => ({
            ...plan,
            Price:
              plan.Price && plan.Price.$numberDecimal
                ? parseFloat(plan.Price.$numberDecimal)
                : parseFloat(plan.Price || 0),
          }));
          setPlans(formatted);
          setFilteredPlans(formatted);
        }
      } catch (err) {
        setPlans([]);
        setFilteredPlans([]);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPlans(plans);
      return;
    }

    const term = searchTerm.toLowerCase();
    setFilteredPlans(
      plans.filter(
        (p) =>
          p.Name.toLowerCase().includes(term) ||
          String(p.SwapLimit).includes(term) ||
          String(p.Price).includes(term)
      )
    );
  }, [searchTerm, plans]);

  const formatCurrency = (v) =>
    Number(v || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handlePurchase = async (planId) => {
    setLoadingId(planId);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/payment/create-order",
        {
          userId,
          planId,
        }
      );

      if (!res.data.success) {
        alert(res.data.message || "Order creation failed");
        setLoadingId(null);
        return;
      }

      const { key, orderId, amount } = res.data;
      const rzp = new window.Razorpay({
        key,
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        name: "SkillSwap Subscription",
        order_id: orderId,
        handler: async (response) => {
          try {
            await axios.post(
              "http://localhost:4000/api/payment/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId,
                planId,
              }
            );
            alert("Payment verified!");
          } catch {
            alert("Payment failed to verify");
          }
          setLoadingId(null);
        },
        modal: { ondismiss: () => setLoadingId(null) },
      });

      rzp.open();
    } catch {
      alert("Payment failed");
      setLoadingId(null);
    }
  };

  return (
    <div
      className="p-6 sm:p-10 min-h-[75vh] rounded-3xl border border-[#A8BBA3]/70
      bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA]"
    >
      {/* 🌿 Header row with search box */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent">
            Select Your Subscription
          </h1>
          <p className="text-gray-700 mt-2 text-sm sm:text-base">
            Unlock powerful features and enjoy seamless skill swapping.
          </p>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-full border border-[#CBBFAE] shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-[#B87C4C]/40 bg-[#F7F4EA]/80 text-sm"
          />
        </div>
      </div>

      {/* 🌿 Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.length ? (
          filteredPlans.map((plan) => (
            <div
              key={plan._id}
              className="bg-[#FDFCF8] border border-[#CBBFAE] shadow-md rounded-2xl overflow-hidden max-w-sm mx-auto flex flex-col"
            >
              {/* Header */}
              <div
                className={`h-16 bg-gradient-to-r ${commonColors.header} flex items-center justify-center`}
              >
                <h2 className="text-white text-lg font-semibold tracking-wide">
                  {plan.Name}
                </h2>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                {/* Price */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-extrabold text-[#3A2A1A]">
                    ₹ {formatCurrency(plan.Price)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">per month</div>
                </div>

                {/* Features */}
                <ul className="space-y-3 text-gray-700 text-sm flex-1">
                  <li className="flex gap-3">
                    <span className="text-[#31513A] mt-1">
                      <FiCheck />
                    </span>
                    Access to community swaps
                  </li>

                  <li className="flex gap-3">
                    <span className="text-[#31513A] mt-1">
                      <FiCheck />
                    </span>
                    {plan.SwapLimit} swaps included
                  </li>

                  <li className="flex gap-3">
                    <span className="text-[#31513A] mt-1">
                      <FiCheck />
                    </span>
                    Faster match-making & skill recommendations
                  </li>
                </ul>

                {/* Bottom Section */}
                <div className="mt-6 flex items-center justify-between gap-2">
                  {/* Swap Coin */}
                  <div className="px-3 py-2 bg-[#F7F4EA] border border-[#CBBFAE] rounded-full flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#FACC15] rounded-full font-bold flex items-center justify-center text-sm">
                      ⚡
                    </div>
                    <span className="text-sm text-[#3A2A1A] font-medium">
                      {plan.SwapLimit} swaps
                    </span>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => handlePurchase(plan._id)}
                    disabled={loadingId === plan._id}
                    className={`
                      px-6 sm:px-8 py-2.5 rounded-full text-white font-semibold text-sm sm:text-base
                      bg-gradient-to-r ${commonColors.button} shadow-md 
                      hover:scale-[1.03] hover:shadow-lg transition-all 
                      disabled:opacity-60 disabled:cursor-not-allowed
                    `}
                  >
                    {loadingId === plan._id ? "Processing..." : "Buy now"}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full bg-[#F7F4EA]/90 border border-dashed border-[#CBBFAE] rounded-2xl py-6 text-sm sm:text-base">
            No subscription plans found.
          </p>
        )}
      </div>
    </div>
  );
}

export default PurchaseSubscription;
