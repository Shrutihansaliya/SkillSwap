
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";   // ✅ Added

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
           userId: userId,
  planId: planId,
        }
      );

      if (!res.data.success) {
        toast.error(res.data.message || "Order creation failed");  // ✅ alert replaced
        setLoadingId(null);
        return;
      }

      // const { key, orderId, amount } = res.data;
      const { key, orderId, amount, contact, email } = res.data;

      const rzp = new window.Razorpay({
        key,
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        name: "SkillSwap Subscription",
        order_id: orderId,
         prefill: {
    contact: contact,     // 👈 AUTO-FILL MOBILE
    email: email,         // 👈 optional
    name: userId          // (optional)
  },
        handler: async (response) => {
          try {
            await axios.post(
              "http://localhost:4000/api/payment/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
               userId: userId,
  planId: planId,
              }
            );

            toast.success("Payment verified!");   // ✅ alert replaced
          } catch {
            toast.error("Payment failed to verify"); // ✅
          }
          setLoadingId(null);
        },
        modal: { ondismiss: () => setLoadingId(null) },
      });

      rzp.open();
    } catch {
      toast.error("Payment failed");   // ✅ alert replaced
      setLoadingId(null);
    }
  };

  return (
    <div
      className="p-6 sm:p-10 min-h-[75vh] rounded-3xl border border-[#A8BBA3]/70
      "
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
