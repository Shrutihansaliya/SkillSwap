import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FiUser,
  FiBookOpen,
  FiMessageSquare,
  FiBell,
  FiClock,
  FiVideo,
  FiUpload,
  FiKey,
  FiRepeat,
  FiInfo,
  FiCreditCard,
  FiLogOut,
} from "react-icons/fi";

import { toast } from "react-toastify";   // ✅ ADDED

import Profile from "./profile.jsx";
import SkillSwapRequest from "./SkillSwapRequest";
import RequestsPage from "./RequestsPage.jsx";
import PurchaseSubscription from "./PurchaseSubscription.jsx";
import SwapActivity from "./SwapActivity.jsx";
import ActivityHistory from "./ActivityHistory.jsx";
import Notifications from "./Notifications.jsx";
import Overview from "./Overview.jsx";
import MySkill from "./MySkill.jsx";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    setUser(loggedInUser);
  }, [navigate]);

  const userId = user?._id || user?.UserId;

  const loadUnread = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(
        `http://localhost:4000/api/notifications/${userId}`
      );
      const list = res.data.notifications || [];
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.log("Notification load error:", err);
    }
  };

  useEffect(() => {
    if (userId) loadUnread();
  }, [userId]);

  useEffect(() => {
    if (activeTab === "notifications") loadUnread();
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    toast.success("Logged out successfully!");   // ✅ CHANGED alert

    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPw || !newPw || !confirmPw) {
      toast.error("Please fill all fields.");   // ✅ alert → toast
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match.");   // ✅
      return;
    }
    if (newPw === currentPw) {
      toast.error("New password must differ."); // ✅
      return;
    }

    try {
      const res = await axios.put(
        "http://localhost:4000/api/users/change-password",
        { userId, currentPassword: currentPw, newPassword: newPw }
      );
      if (res.data.success) {
        toast.success(res.data.message);        // ✅
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        toast.error(res.data.message);          // ✅
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating password");  // ✅
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div
      className="
        min-h-screen w-full 
        flex 
        font-sans 
       
      "
    >
      {/* Sidebar */}
      <aside
        className="
          flex flex-col 
          w-64 
          bg-[#F7F4EA] 
          backdrop-blur-xl 
          shadow-2xl 
          border-r border-[#A8BBA3]/50 
          px-4 py-5
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-tr from-[#B87C4C] via-[#A8BBA3] to-[#B87C4C] rounded-2xl shadow-md overflow-hidden">
            <img
              src="/sslogo.png"
              alt="SkillSwap Logo"
              className="w-12 h-12 object-contain"
            />
          </div>

          <div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-[#B87C4C] via-[#8E5C32] to-[#B87C4C] bg-clip-text text-transparent">
              SkillSwap
            </h1>
            <p className="text-[11px] text-gray-600 -mt-0.5 tracking-wide">
              Learn • Share • Grow
            </p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 flex flex-col gap-2">
          {[
            { key: "overview", label: "Dashboard", icon: <FiUser /> },
            { key: "skills", label: "My Skills", icon: <FiBookOpen /> },
            {
              key: "swaprequest",
              label: "Skill Swap Request",
              icon: <FiRepeat />,
            },
            { key: "requestinfo", label: "Request Info", icon: <FiInfo /> },
            {
              key: "activityhistory",
              label: "Activity History",
              icon: <FiClock />,
            },
            { key: "purchase", label: "Upgrade Plan", icon: <FiCreditCard /> },
            { key: "swapactivity", label: "Swap Activity", icon: <FiRepeat /> },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                navigate(`/dashboard?tab=${item.key}`);
              }}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                activeTab === item.key
                  ? "bg-[#B87C4C] text-white font-semibold shadow-lg scale-[1.02]"
                  : "text-gray-700 hover:bg-[#A8BBA3]/30 hover:scale-[1.02]"
              }`}
            >
              {React.cloneElement(item.icon, { size: 18 })}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Small footer / status */}
        <div className="mt-4 text-[11px] text-gray-600">
          <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 border border-[#A8BBA3]/50">
            <FiMessageSquare size={14} className="text-[#B87C4C]" />
            <span>Need help? Contact support</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header
          className="
            flex items-center justify-between 
            px-4 sm:px-8 
            h-16 sm:h-20 
            bg-[#F7F4EA]/90 
            backdrop-blur-xl 
            shadow-md 
            border-b border-[#A8BBA3]/50
          "
        >
          <div>
            <p className="text-xs text-gray-500">Welcome back,</p>
            <h2 className="text-xl sm:text-2xl font-bold capitalize bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent tracking-wide">
              {user?.Username || "User"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* 🔔 Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setActiveTab("notifications");
                  navigate("/dashboard?tab=notifications");
                }}
                className="relative p-2 rounded-full hover:bg-[#A8BBA3]/40 transition-all"
              >
                <FiBell size={22} className="text-[#B87C4C]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

          {/* Profile dropdown (compact) */}
<div className="relative" ref={menuRef}>
  <button
    onClick={() => setShowMenu((prev) => !prev)}
    className="flex items-center gap-1.5 bg-[#F7F4EA] hover:bg-[#A8BBA3]/40 text-[#B87C4C] px-2 py-1.5 rounded-full shadow-sm border border-[#A8BBA3]/60 transition-all"
    aria-haspopup="true"
    aria-expanded={showMenu}
  >
    <div
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-white font-semibold text-sm shadow-md border-2 border-[#F7F4EA] select-none"
      style={{
        background: "linear-gradient(135deg, #B87C4C, #8E5C32)",
      }}
    >
      {user?.Username?.charAt(0)?.toUpperCase() || "U"}
    </div>
  </button>

  {showMenu && (
    <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-[#F7F4EA]/95 backdrop-blur-xl shadow-lg rounded-xl border border-[#A8BBA3]/60 z-[50]">
      <div className="p-3 border-b border-[#A8BBA3]/40 text-center">
        <p className="font-semibold text-gray-800 text-sm">
          {user?.Username || "User"}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user?.Email}
        </p>
      </div>

      <ul className="py-1">
        <li>
          <button
            onClick={() => {
              setActiveTab("profile");
              navigate("/dashboard?tab=profile");
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#A8BBA3]/30 text-gray-700 transition-all text-sm"
          >
            <FiUser size={16} />
            <span className="truncate">Profile</span>
          </button>
        </li>

        <li>
          <button
            onClick={() => {
              setActiveTab("changepw");
              navigate("/dashboard?tab=changepw");
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#A8BBA3]/30 text-gray-700 transition-all text-sm"
          >
            <FiKey size={16} />
            <span className="truncate">Change Password</span>
          </button>
        </li>

        <li>
          <button
            onClick={() => {
              setShowMenu(false);
              handleLogout();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-600 transition-all text-sm"
          >
            <FiLogOut size={16} />
            <span className="truncate">Logout</span>
          </button>
        </li>
      </ul>
    </div>
  )}
</div>

          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {activeTab === "overview" && <Overview userId={userId} />}
            {activeTab === "profile" && <Profile />}
            {activeTab === "swaprequest" && <SkillSwapRequest />}
            {activeTab === "requestinfo" && <RequestsPage />}
            {activeTab === "activityhistory" && <ActivityHistory />}
            {activeTab === "notifications" && <Notifications userId={userId} />}
            {activeTab === "purchase" && userId && (
              <PurchaseSubscription userId={userId} />
            )}
            {activeTab === "swapactivity" && <SwapActivity />}
            {activeTab === "skills" && userId && <MySkill userId={userId} />}

            {activeTab === "changepw" && (
              <div className="bg-[#F7F4EA] rounded-2xl p-6 shadow-lg max-w-md mx-auto mt-8 border border-[#A8BBA3]/60">
                <h3 className="text-xl font-bold text-[#B87C4C] mb-4 text-center">
                  Change Password
                </h3>

                {errorMsg && (
                  <div className="mb-3 text-red-600 text-sm text-center">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="mb-3 text-green-700 text-sm text-center">
                    {successMsg}
                  </div>
                )}

                <form
                  onSubmit={handleChangePassword}
                  className="flex flex-col gap-4"
                >
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="border p-3 rounded-xl focus:ring-2 focus:ring-[#B87C4C]/40 focus:border-[#B87C4C] outline-none bg-white/80"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="border p-3 rounded-xl focus:ring-2 focus:ring-[#B87C4C]/40 focus:border-[#B87C4C] outline-none bg-white/80"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="border p-3 rounded-xl focus:ring-2 focus:ring-[#B87C4C]/40 focus:border-[#B87C4C] outline-none bg-white/80"
                  />
                  <button
                    type="submit"
                    className="bg-[#B87C4C] hover:bg-[#8E5C32] text-white py-2 rounded-xl font-semibold transition-all"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
