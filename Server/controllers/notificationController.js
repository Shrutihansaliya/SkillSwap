// src/pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiBell, FiCheckCircle, FiArrowLeft } from "react-icons/fi";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:4000";

function Notifications({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userId) return;

        const res = await axios.get(
          `${API_BASE}/api/notifications/${userId}`,
          { withCredentials: true }
        );

        // backend: { success, notifications: [...] }
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

  const deleteNotification = async (id, e) => {
    e.stopPropagation(); // ⛔ prevent redirect on click
    try {
      await axios.delete(`${API_BASE}/api/notifications/${id}`, {
        withCredentials: true,
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 flex items-center gap-2">
            <FiBell className="text-indigo-600 text-2xl" />
            Notifications
          </h1>
          <button
            onClick={() => navigate("/dashboard?tab=overview")}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-all"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </button>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <FiCheckCircle className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">
              No new notifications right now.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => openLink(n.link)}
                className={`p-5 rounded-xl shadow-sm cursor-pointer border transition-all duration-200
                  ${
                    n.type === "swap_limit_reached"
                      ? "bg-red-100 text-red-700 border-red-300 hover:shadow-md"
                      : "bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-md"
                  }
                `}
              >
                <div className="flex justify-between items-center">
                  <p className="text-gray-800 font-medium">{n.message}</p>

                  {/* ✅ delete notification */}
                  <FiCheckCircle
                    className="text-green-500 text-lg cursor-pointer hover:text-green-700"
                    onClick={(e) => deleteNotification(n._id, e)}
                  />
                </div>

                <span className="text-sm text-gray-500 block mt-2">
                  {n.createdAt
                    ? new Date(n.createdAt).toLocaleString()
                    : ""}
                </span>
              </div>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Notifications;
