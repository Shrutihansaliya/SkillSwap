// src/pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiBell, FiCheckCircle, FiArrowLeft } from "react-icons/fi";

function Notifications({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // 🔄 Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userId) return;

        const res = await axios.get(
          `http://localhost:4000/api/notifications/${userId}`
        );

        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [userId]);

  // 🔗 Handle click → Redirect to correct tab/page
  const openLink = (link) => {
    if (!link) return;
    navigate(link); // automatic redirect to correct tab
  };

  // ✅ Delete notification
  const deleteNotification = async (id, e) => {
    e.stopPropagation(); // ⛔ prevent redirect on click
    try {
      await axios.delete(`http://localhost:4000/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 
      bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA]"
    >
      <div className="max-w-3xl mx-auto bg-[#F7F4EA]/95 rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#A8BBA3]/70">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#B87C4C]/12 border border-[#B87C4C]/30">
              <FiBell className="text-[#B87C4C] text-xl" />
            </span>
            <span className="bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent">
              Notifications
            </span>
          </h1>

          <button
            onClick={() => navigate("/dashboard?tab=overview")}
            className="flex items-center text-xs sm:text-sm text-[#8E5C32] hover:text-[#5E3D21] gap-1 px-3 py-1.5 rounded-full border border-[#CBBFAE] bg-white/70 hover:bg-[#F0E2D2] transition-all"
          >
            <FiArrowLeft className="text-sm" />
            Back to Dashboard
          </button>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white/70 rounded-2xl border border-dashed border-[#CBBFAE]">
            <FiCheckCircle className="text-4xl text-[#A8BBA3] mx-auto mb-3" />
            <p className="text-gray-600 text-base sm:text-lg font-medium">
              No new notifications right now.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              We&apos;ll let you know when something important happens.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {notifications.map((n) => {
              const isWarningType =
                n.type === "swap_limit_reached" ||
                n.type === "swap_cancelled_partner_suspended" ||
                n.type === "partner_suspended";

              return (
                <li
                  key={n._id}
                  onClick={() => openLink(n.link)}
                  className={`p-4 sm:p-5 rounded-2xl cursor-pointer border transition-all duration-200 shadow-sm hover:shadow-md
                    ${
                      isWarningType
                        ? "bg-red-50 border-red-200"
                        : "bg-white/90 border-[#CBBFAE]"
                    }
                  `}
                >
                  <div className="flex justify-between items-start gap-3">
                    <p
                      className={`text-sm sm:text-base font-medium ${
                        isWarningType ? "text-red-800" : "text-gray-800"
                      }`}
                    >
                      {n.message}
                    </p>

                    {/* ✅ delete notification */}
                    <button
                      onClick={(e) => deleteNotification(n._id, e)}
                      className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs
                        border-[#A8BBA3] text-[#31513A] bg-[#A8BBA3]/10 hover:bg-[#A8BBA3]/30 hover:border-[#31513A] transition-all"
                      title="Mark as read / remove"
                    >
                      <FiCheckCircle className="text-sm" />
                    </button>
                  </div>

                  <span className="text-[11px] sm:text-xs text-gray-500 block mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Notifications;
