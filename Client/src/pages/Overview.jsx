// Overview.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FiLayers,
  FiClock,
  FiRepeat,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiUser,
  FiCode,
  FiCalendar,
  FiCheck,
  FiArrowRight
} from "react-icons/fi";


function Overview({ userId }) {
  const [stats, setStats] = useState({
    swapsRemaining: 0,
    pendingRequests: 0,
    activeSwaps: 0,
    completedSwaps: 0,
  });
 // ⭐ Subscription State
const [activeSub, setActiveSub] = useState([]);
const [upcomingSub, setUpcomingSub] = useState([]);

const firstActive = activeSub.length > 0 ? activeSub[0] : null;

  const [swapHistory, setSwapHistory] = useState([]);
  const [loadingSwaps, setLoadingSwaps] = useState(false);
  const [errorSwaps, setErrorSwaps] = useState(null);
  const [openSwap, setOpenSwap] = useState(null);

  const [page, setPage] = useState(1);
  const pageSizeOptions = [4, 6, 9];
  const [pageSize, setPageSize] = useState(6);

  const [loaded, setLoaded] = useState(false);
// ⭐ Fetch Subscription
 // ⭐ Fetch Subscription (FIXED URL)
const loadSubscription = async () => {
  if (!userId) return;

  try {
    const res = await axios.get(
  `http://localhost:4000/api/purchase-subscription/${userId}`
);


    console.log("📌 API Subscription Response =", res.data);

    // setActiveSub(res.data.activePlan || null);
    // setUpcomingSub(res.data.upcomingPlan || null);
    setActiveSub(res.data.activePlans || []);
setUpcomingSub(res.data.upcomingPlans || []);


  } catch (err) {
    console.log("❌ Subscription load error:", err);
  }
};



useEffect(() => {
  console.log("🔥 useEffect LOAD SUBS CALLED FOR userId =", userId);
  loadSubscription();
}, [userId]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/overview/${userId}`);
        if (res.data?.stats) setStats(res.data.stats);
      } catch (err) {}
    };
    if (userId) loadStats();
  }, [userId]);

  useEffect(() => {
    const loadSwapHistory = async () => {
      setLoadingSwaps(true);
      setErrorSwaps(null);
      try {
        const res = await axios.get(`http://localhost:4000/api/overview/swaps/${userId}`);

        if (res.data?.success) {
          const swaps = (res.data.swaps || []).map((s) => ({
            ...s,
            CreatedAt: s.CreatedAt ? new Date(s.CreatedAt) : new Date(),
            CompletedAt: s.CompletedAt ? new Date(s.CompletedAt) : null,
          }));

          swaps.sort((a, b) => {
            if (a.Status !== b.Status) return a.Status === "Active" ? -1 : 1;
            return new Date(b.CreatedAt) - new Date(a.CreatedAt);
          });

          setSwapHistory(swaps);
          setPage(1);
          setLoaded(true);
          setTimeout(() => setLoaded(false), 600);
        } else setSwapHistory([]);
      } catch (err) {
        setErrorSwaps("Failed to load swaps");
      } finally {
        setLoadingSwaps(false);
      }
    };

    if (userId) loadSwapHistory();
  }, [userId]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(swapHistory.length / pageSize));
  }, [swapHistory.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const currentSwaps = useMemo(() => {
    const start = (page - 1) * pageSize;
    return swapHistory.slice(start, start + pageSize);
  }, [swapHistory, page, pageSize]);

  const cards = [
    {
      title: "Swaps Remaining",
      value: stats.swapsRemaining,
      icon: (
        <FiLayers
          size={36}
          className={`${stats.swapsRemaining === 0 ? "text-red-500" : "text-blue-500"} drop-shadow-sm`}
        />
      ),
      gradient: stats.swapsRemaining === 0 ? "" : "from-blue-50 via-indigo-50 to-white",
      solidBg: stats.swapsRemaining === 0 ? "bg-red-100" : "",
      textColor: stats.swapsRemaining === 0 ? "text-red-600" : "text-indigo-600",
      subText: stats.swapsRemaining === 0 ? "Purchase plan to continue swapping" : "",
      link: "/dashboard?tab=purchase",
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: <FiClock size={36} className="text-purple-500 drop-shadow-sm" />,
      gradient: "from-purple-50 via-violet-50 to-white",
      textColor: "text-purple-600",
      link: "/dashboard?tab=requestinfo",
    },
    {
      title: "Active Swaps",
      value: stats.activeSwaps,
      icon: <FiRepeat size={36} className="text-pink-500 drop-shadow-sm" />,
      gradient: "from-pink-50 via-rose-50 to-white",
      textColor: "text-pink-600",
      link: "/dashboard?tab=swapactivity",
    },
    {
      title: "Completed Swaps",
      value: stats.completedSwaps,
      icon: <FiCheckCircle size={36} className="text-green-500 drop-shadow-sm" />,
      gradient: "from-green-50 via-emerald-50 to-white",
      textColor: "text-green-600",
      link: "/dashboard?tab=activityhistory",
    },
  ];

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUserInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };
const [cardIndex, setCardIndex] = useState(0);
const totalCards = 1 + Math.max(upcomingSub.length, 1); // Active + upcoming (or "no upcoming" card)
  return (
    <div className="p-6">
          {/* ⭐ SUBSCRIPTION SECTION */}
              {/* ⭐ SUBSCRIPTION SECTION */}
      <div className="rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] rounded-md flex items-center justify-center">
              <FiCheckCircle className="text-white w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Subscription</h3>
              <p className="text-xs text-gray-500">Plan details</p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard?tab=purchase")}
            className="px-2.5 py-1 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
          >
            {activeSub ? "Manage" : "Get"}
          </button>
        </div>

        {/* Plan Cards Carousel */}
        <div className="relative">
          {/* Left Navigation Arrow */}
          <button
            onClick={() => setCardIndex(prev => Math.max(0, prev - 1))}
            disabled={cardIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Cards Container */}
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${cardIndex * 100}%)` }}>
              {/* Active Plan Card */}
              <div className="w-full flex-shrink-0">
                <div className="bg-gradient-to-br from-[#F7F4EA]/80 to-white p-3 rounded-lg border border-[#A8BBA3]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-[#B87C4C] rounded-full flex items-center justify-center">
                      <FiCheckCircle className="text-white w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">
                        {firstActive ? firstActive.PlanId?.Name?.split(" ")[0] : "No Plan"}
                      </h4>
                      <p className="text-[10px] text-gray-500">Current</p>
                    </div>
                  </div>

                  {firstActive && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Limit</span>
                        <span className="text-xs font-bold text-[#B87C4C]">
                          {firstActive.PlanId?.SwapLimit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Left</span>
                        <span className="text-xs font-bold text-[#8E5C32]">
                          {firstActive.SwapsRemaining}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Plan Cards */}
              {upcomingSub.map((up, i) => (
                <div key={up._id || i} className="w-full flex-shrink-0">
                  <div className="p-3 rounded-lg border border-[#A8BBA3]/30 bg-gradient-to-br from-white to-[#F7F4EA]/80">
                    <div className="mb-2 p-3 rounded-lg border border-[#B87C4C]/20 bg-gradient-to-br from-[#F7F4EA]/60 to-white">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-[#8E5C32] rounded-full flex items-center justify-center">
                          <FiCalendar className="text-white w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800">
                            Upcoming #{i + 1}
                          </h4>
                          <p className="text-[10px] text-gray-500">Scheduled</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">Plan</span>
                          <span className="text-xs font-medium text-[#8E5C32] truncate ml-1">
                            {up?.PlanId?.Name || "—"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">Swap Limit</span>
                          <span className="text-xs font-medium text-[#8E5C32]">{up?.PlanId?.SwapLimit}</span>
                        </div>

                        <span className="text-[10px] bg-[#B87C4C]/10 text-[#8E5C32] px-1.5 py-0.5 rounded-full">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* No Upcoming Plans Card */}
              {upcomingSub.length === 0 && (
                <div className="w-full flex-shrink-0">
                  <div className="p-3 rounded-lg border border-[#A8BBA3]/30 bg-gradient-to-br from-white to-[#F7F4EA]/80">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <FiCalendar className="text-white w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">None</h4>
                        <p className="text-[10px] text-gray-500">Upcoming</p>
                      </div>
                    </div>

                    <button
                      onClick={() => (window.location.href = "/dashboard?tab=purchase")}
                      className="text-[10px] text-[#B87C4C] hover:text-[#8E5C32] font-medium w-full text-center pt-1"
                    >
                      Browse →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Navigation Arrow */}
          <button
            onClick={() => setCardIndex(prev => Math.min(totalCards - 1, prev + 1))}
            disabled={cardIndex >= totalCards - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots Indicator */}
        {totalCards > 1 && (
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: totalCards }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCardIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === cardIndex ? 'bg-[#B87C4C]' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CARDS */}
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">


        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => (window.location.href = card.link)}
            className={`w-[180px] h-[180px] p-5 rounded-2xl border border-white/40 shadow hover:shadow-lg backdrop-blur-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
              card.solidBg ? card.solidBg : `bg-gradient-to-br ${card.gradient}`
            }`}
          >
            {card.icon}
            <h2 className="text-gray-700 text-base font-semibold">{card.title}</h2>
            <p className={`text-4xl font-bold mt-2 ${card.textColor}`}>{card.value}</p>
            {card.subText && <p className="text-xs text-red-600">{card.subText}</p>}
          </div>
        ))}
      </div>

      {/* SWAPS - BEAUTIFUL CARD LAYOUT */}
      <div className="mt-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            Your Swaps <span className="text-sm text-gray-500">({swapHistory.length})</span>
          </h2>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Showing <strong>{currentSwaps.length}</strong> of {swapHistory.length}
            </span>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="text-sm rounded-lg px-3 py-1 border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingSwaps ? (
          <div className="p-8 bg-white rounded-xl shadow text-center text-gray-500">
            Loading swaps…
          </div>
        ) : errorSwaps ? (
          <div className="p-6 bg-red-50 rounded-xl shadow text-center text-red-600 border border-red-200">
            {errorSwaps}
          </div>
        ) : swapHistory.length === 0 ? (
          <div className="p-8 bg-white rounded-xl shadow text-center text-gray-500">
            You have no swaps yet.
          </div>
        ) : (
          <div className="relative">
            {/* Beautiful Card Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentSwaps.map((swap, idx) => {
                const isActive = swap.Status === "Active";
                const isCompleted = swap.Status === "Completed";

                return (
                  <div 
                    key={idx} 
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
                  >
                    {/* Card Header with Status */}
                    <div className={`px-4 py-3 border-b ${isActive ? 'bg-blue-100 border-blue-100' : isCompleted ? 'bg-green-100 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(swap.Status)}`}>
                          {swap.Status}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(swap.CreatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      {/* Users */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getUserInitials(swap.RequestId?.SenderId?.Username)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {swap.RequestId?.SenderId?.Username || "Unknown"}
                          </span>
                        </div>
                        
                        <FiArrowRight className="text-gray-400 mx-1" size={16} />
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {swap.RequestId?.ReceiverId?.Username || "Unknown"}
                          </span>
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getUserInitials(swap.RequestId?.ReceiverId?.Username)}
                          </div>
                        </div>
                      </div>

                      {/* Skill */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-gray-600 text-xs mb-2">
                          <FiCode size={12} />
                          <span>Skill</span>
                        </div>
                        <div className="text-lg font-bold text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border">
                          {swap.SkillName}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 text-gray-600">
                            <FiCalendar size={12} />
                            <span>Created</span>
                          </div>
                          <span className="font-medium text-gray-800">
                            {new Date(swap.CreatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {swap.CompletedAt && (
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1 text-gray-600">
                              <FiCheckCircle size={12} />
                              <span>Completed</span>
                            </div>
                            <span className="font-medium text-gray-800">
                              {new Date(swap.CompletedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Confirmations & Action */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="flex gap-3">
                          <div className={`flex items-center gap-1 text-xs ${swap.Confirmations?.SenderConfirmed ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${swap.Confirmations?.SenderConfirmed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            Sender
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${swap.Confirmations?.ReceiverConfirmed ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${swap.Confirmations?.ReceiverConfirmed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            Receiver
                          </div>
                        </div>

                        <button
                          onClick={() => setOpenSwap(swap)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                        >
                          View
                          <FiArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  <FiChevronLeft />
                </button>

                <span className="text-sm text-gray-700">
                  Page {page} / {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  <FiChevronRight />
                </button>
              </div>

              <span className="text-sm text-gray-600">
                Showing {currentSwaps.length} of {swapHistory.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
           {/* MODAL */}
      {openSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenSwap(null)} />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-10 transform animate-fade-in-up">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <FiCode className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{openSwap.SkillName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(openSwap.Status)}`}>
                        {openSwap.Status}
                      </span>
                      <span className="text-gray-500 text-sm">• Swap Details</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpenSwap(null)}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Exchange Flow */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Exchange Flow</h4>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                      {getUserInitials(openSwap.RequestId?.SenderId?.Username)}
                    </div>
                    <div className="text-sm font-medium text-gray-800">{openSwap.RequestId?.SenderId?.Username || "Unknown"}</div>
                    <div className="text-xs text-gray-500">Sender</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <FiArrowRight className="text-blue-500 mb-1" size={20} />
                    <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">Swaps</span>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                      {getUserInitials(openSwap.RequestId?.ReceiverId?.Username)}
                    </div>
                    <div className="text-sm font-medium text-gray-800">{openSwap.RequestId?.ReceiverId?.Username || "Unknown"}</div>
                    <div className="text-xs text-gray-500">Receiver</div>
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCode className="text-blue-600" size={16} />
                    <h4 className="text-sm font-semibold text-blue-800">Skill to Learn</h4>
                  </div>
                  <div className="text-lg font-bold text-gray-800">{openSwap.SkillName}</div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCheckCircle className="text-green-600" size={16} />
                    <h4 className="text-sm font-semibold text-green-800">Skill to Teach</h4>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {openSwap.RequestId?.SkillToTeachId?.SkillId?.Name || "Not specified"}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiCalendar className="text-blue-600" size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">Created</div>
                        <div className="text-xs text-gray-500">{fmtDate(openSwap.CreatedAt)}</div>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  
                  {openSwap.CompletedAt && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FiCheckCircle className="text-green-600" size={14} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">Completed</div>
                          <div className="text-xs text-gray-500">{fmtDate(openSwap.CompletedAt)}</div>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmations */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Confirmations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-4 rounded-xl border-2 ${openSwap.Confirmations?.SenderConfirmed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">Sender</span>
                      {openSwap.Confirmations?.SenderConfirmed ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <FiCheck size={16} />
                          <span className="text-xs font-medium">Confirmed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500">
                          <FiClock size={14} />
                          <span className="text-xs font-medium">Pending</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {openSwap.RequestId?.SenderId?.Username || "Unknown"}
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border-2 ${openSwap.Confirmations?.ReceiverConfirmed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">Receiver</span>
                      {openSwap.Confirmations?.ReceiverConfirmed ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <FiCheck size={16} />
                          <span className="text-xs font-medium">Confirmed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500">
                          <FiClock size={14} />
                          <span className="text-xs font-medium">Pending</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {openSwap.RequestId?.ReceiverId?.Username || "Unknown"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Additional Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 font-medium">Swap ID:</span>
                    <div className="text-gray-800 font-mono text-xs mt-1 bg-white px-2 py-1 rounded border">
                      {openSwap._id}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Request ID:</span>
                    <div className="text-gray-800 font-mono text-xs mt-1 bg-white px-2 py-1 rounded border">
                      {openSwap.RequestId?._id || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setOpenSwap(null)}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fadeIn-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Overview;