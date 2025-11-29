// import React, { useEffect, useState } from "react";
// import axios from "axios";

// import {
//   FiLayers,
//   FiClock,
//   FiRepeat,
//   FiCheckCircle,
// } from "react-icons/fi";

// function Overview({ userId }) {
//   const [stats, setStats] = useState({
//     swapsRemaining: 0,
//     pendingRequests: 0,
//     activeSwaps: 0,
//     completedSwaps: 0,
//   });

//   useEffect(() => {
//     const loadStats = async () => {
//       try {
//         const res = await axios.get(`http://localhost:4000/api/overview/${userId}`);
//         setStats(res.data.stats);
//       } catch (error) {
//         console.log("Overview load error:", error);
//       }
//     };

//     if (userId) loadStats();
//   }, [userId]);

//   const cards = [
//     {
//       title: "Swaps Remaining",
//       value: stats.swapsRemaining,
//       icon: (
//         <FiLayers
//           size={36}
//           className={`${
//             stats.swapsRemaining === 0 ? "text-red-500" : "text-blue-600"
//           } drop-shadow-lg`}
//         />
//       ),
//       gradient:
//         stats.swapsRemaining === 0
//           ? "from-red-50 via-red-100 to-white"
//           : "from-blue-50 via-indigo-50 to-white",
//       textColor: stats.swapsRemaining === 0 ? "text-red-700" : "text-indigo-700",
//       subText: stats.swapsRemaining === 0 ? "Purchase plan to continue swapping" : "",
//       link: "/dashboard?tab=purchase",
//     },

//     {
//       title: "Pending Requests",
//       value: stats.pendingRequests,
//       icon: <FiClock size={36} className="text-purple-600 drop-shadow-lg" />,
//       gradient: "from-purple-50 via-violet-50 to-white",
//       textColor: "text-indigo-700",
//       link: "/dashboard?tab=requestinfo",
//     },

//     {
//       title: "Active Swaps",
//       value: stats.activeSwaps,
//       icon: <FiRepeat size={36} className="text-pink-600 drop-shadow-lg" />,
//       gradient: "from-pink-50 via-rose-50 to-white",
//       textColor: "text-indigo-700",
//       link: "/dashboard?tab=swapactivity",
//     },

//     {
//       title: "Completed Swaps",
//       value: stats.completedSwaps,
//       icon: <FiCheckCircle size={36} className="text-green-600 drop-shadow-lg" />,
//       gradient: "from-green-50 via-emerald-50 to-white",
//       textColor: "text-indigo-700",
//       link: "/dashboard?tab=activityhistory",
//     },
//   ];

//   return (
//     <div className="p-6">

//       <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
//         {cards.map((card, index) => (
//           <div
//             key={index}
//             onClick={() => (window.location.href = card.link)}
//             className={`
//               w-[180px] h-[180px]         /* 🔥 Perfect Square Card */
//               p-5 rounded-2xl border border-white/40
//               bg-gradient-to-br ${card.gradient}
//               shadow-[0_4px_18px_rgb(0,0,0,0.08)]
//               hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)]
//               backdrop-blur-xl
//               hover:-translate-y-1 hover:scale-[1.03]
//               transition-all cursor-pointer
//               relative overflow-hidden group
//               flex flex-col justify-center items-center text-center
//             `}
//           >
//             {/* Glow effect */}
//             <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-all duration-500 bg-white rounded-2xl blur-xl"></div>

//             {/* Card Content */}
//             <div className="relative z-10 flex flex-col items-center">
//               <div className="scale-90 opacity-90 mb-2">{card.icon}</div>

//               <h2 className="text-gray-700 text-base font-semibold tracking-tight">
//                 {card.title}
//               </h2>

//               <p className={`text-4xl font-bold mt-2 ${card.textColor} drop-shadow-sm`}>
//                 {card.value}
//               </p>

//               {card.subText && (
//                 <p className="text-red-600 mt-1 font-medium text-xs">
//                   {card.subText}
//                 </p>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Overview;
import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  FiLayers,
  FiClock,
  FiRepeat,
  FiCheckCircle,
} from "react-icons/fi";

function Overview({ userId }) {
  const [stats, setStats] = useState({
    swapsRemaining: 0,
    pendingRequests: 0,
    activeSwaps: 0,
    completedSwaps: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/overview/${userId}`);
        setStats(res.data.stats);
      } catch (error) {
        console.log("Overview load error:", error);
      }
    };

    if (userId) loadStats();
  }, [userId]);

  const cards = [
    {
      title: "Swaps Remaining",
      value: stats.swapsRemaining,
      icon: (
        <FiLayers
          size={36}
          className={`${
            stats.swapsRemaining === 0 ? "text-red-500" : "text-blue-500"
          } drop-shadow-sm`}
        />
      ),

      // ⭐ NO gradient if swaps = 0
      gradient:
        stats.swapsRemaining === 0
          ? ""                               // remove gradient
          : "from-blue-50 via-indigo-50 to-white",

      // ⭐ Solid light red background when 0 swaps
      solidBg:
        stats.swapsRemaining === 0 ? "bg-red-100" : "",

      textColor: stats.swapsRemaining === 0 ? "text-red-600" : "text-indigo-600",
      subText: stats.swapsRemaining === 0 ? "Purchase plan to continue swapping" : "",
      link: "/dashboard?tab=purchase",
    },

    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: <FiClock size={36} className="text-purple-500 drop-shadow-sm" />,
      gradient: "from-purple-50 via-violet-50 to-white",
      solidBg: "",
      textColor: "text-purple-600",
      link: "/dashboard?tab=requestinfo",
    },

    {
      title: "Active Swaps",
      value: stats.activeSwaps,
      icon: <FiRepeat size={36} className="text-pink-500 drop-shadow-sm" />,
      gradient: "from-pink-50 via-rose-50 to-white",
      solidBg: "",
      textColor: "text-pink-600",
      link: "/dashboard?tab=swapactivity",
    },

    {
      title: "Completed Swaps",
      value: stats.completedSwaps,
      icon: <FiCheckCircle size={36} className="text-green-500 drop-shadow-sm" />,
      gradient: "from-green-50 via-emerald-50 to-white",
      solidBg: "",
      textColor: "text-green-600",
      link: "/dashboard?tab=activityhistory",
    },
  ];

  return (
    <div className="p-6">

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => (window.location.href = card.link)}
            className={`
              w-[180px] h-[180px]
              p-5 rounded-2xl border border-white/40
              shadow-[0_3px_14px_rgb(0,0,0,0.06)]
              hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]
              backdrop-blur-xl
              hover:-translate-y-[2px] hover:scale-[1.02]
              transition-all cursor-pointer
              relative overflow-hidden group
              flex flex-col justify-center items-center text-center

              ${
                card.solidBg
                  ? card.solidBg                                   // solid red card
                  : `bg-gradient-to-br ${card.gradient}`          // pastel gradient card
              }
            `}
          >
            {/* Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-all duration-500 bg-white rounded-2xl blur-xl"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="scale-90 opacity-95 mb-2">{card.icon}</div>

              <h2 className="text-gray-700 text-base font-semibold tracking-tight">
                {card.title}
              </h2>

              <p className={`text-4xl font-bold mt-2 ${card.textColor}`}>
                {card.value}
              </p>

              {card.subText && (
                <p className="text-red-600 mt-1 font-medium text-xs">
                  {card.subText}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Overview;
