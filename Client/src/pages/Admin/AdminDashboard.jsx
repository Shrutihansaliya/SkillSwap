// src/pages/Admin/AdminDashboard.jsx

import { useState, useEffect } from "react";
import { FaUserCircle, FaRupeeSign } from "react-icons/fa";
import axios from "axios";
import { AdminProvider, useAdmin } from "../../context/AdminContext.jsx";

import CategoryList from "../../components/CategoryList.jsx";
import SkillList from "../../components/SkillList.jsx";
import UpdateProfile from "./UpdateProfile.jsx";
import Members from "./Members.jsx";
import ChangePassword from "./ChangePassword.jsx";
import SubscriptionPlans from "./SubscriptionPlans.jsx";
import AddCity from "./AddCity.jsx";
import AdminReports from "./AdminReports.jsx";
import AdminPaymentView from "./AdminPaymentView.jsx";

const DashboardContent = () => {
  const { activePage, setActivePage, user, loading, handleLogout } = useAdmin();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRevenueBox, setShowRevenueBox] = useState(false);

  // Fetch Revenue
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const url = "http://localhost:4000/api/payment/total-revenue";
        const res = await axios.get(url);

        if (res.data && res.data.success) {
          const total =
            typeof res.data.total === "number" && !Number.isNaN(res.data.total)
              ? res.data.total
              : 0;
          setTotalRevenue(total);
        } else {
          setTotalRevenue(0);
        }
      } catch (err) {
        console.error("Revenue API error:", err);
        setTotalRevenue(0);
      }
    };

    fetchRevenue();
  }, []);

  if (loading) return <div>Loading...</div>;

  // Page Title
  const getTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard";
      case "category":
        return "Skill Categories";
      case "skill":
        return "Skills";
      case "addCity":
        return "Add City";
      case "members":
        return "Members";
      case "subscriptionPlans":
        return "Subscription Plans";
      case "adminpaymentview":
        return "Payments";
      case "reports":
        return "Reports";
      case "changePassword":
        return "Change Password";
      case "profile":
        return "Update Profile";
      default:
        return "Admin";
    }
  };

  // Tabs
  const NavTab = ({ page, label }) => {
    const isActive = activePage === page;
    return (
      <button
        onClick={() => setActivePage(page)}
        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-150
          ${
            isActive
              ? "bg-white text-gray-900 shadow-md scale-[1.03]"
              : "text-gray-200 hover:bg-white/10 hover:text-white"
          }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200">
      {/* Navbar */}
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        {/* Top Row */}
        <div className="flex items-center justify-between px-6 h-16 relative">
          {/* Left Logo + Title */}
          <div className="flex items-center h-16 gap-4">
            {/* Colorful Logo Wrapper */}
            <div className="p-[3px] rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-md">
              <img
                src="/sslogo.png"
                alt="Logo"
                className="h-12 w-12 rounded-lg object-cover bg-white"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900 tracking-wide">
                Admin Panel
              </div>
              <div className="text-xs text-gray-500">{getTitle()}</div>
            </div>
          </div>

          {/* Right: Revenue + Profile */}
          <div className="flex items-center gap-4">
            {/* Revenue */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRevenueBox((prev) => !prev);
                  setShowProfileMenu(false); // close profile when revenue opens
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center
                bg-gradient-to-br from-yellow-200 to-amber-300 text-yellow-700 shadow-md"
              >
                <FaRupeeSign className="text-lg" />
              </button>

              {showRevenueBox && (
                <div
                  className="absolute right-0 top-12 w-72 rounded-2xl 
                  bg-white shadow-2xl border border-amber-200/60 
                  p-5 z-50"
                >
                  {/* Title */}
                  <h3
                    className="text-lg font-bold mb-2 
                   bg-gradient-to-r from-amber-600 to-yellow-500 
                   bg-clip-text text-transparent flex items-center gap-1"
                  >
                    💰 Total Revenue
                  </h3>

                  {/* Value */}
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-extrabold text-amber-600 leading-none">
                      ₹
                    </span>
                    <span className="text-3xl font-extrabold text-gray-900 leading-none">
                      {Number.isFinite(totalRevenue)
                        ? totalRevenue.toLocaleString("en-IN")
                        : "0"}
                    </span>
                  </div>

                  {/* Clean divider */}
                  <div className="h-[1px] w-full bg-amber-200/50 my-3"></div>

                  {/* Extra subtle text for attractiveness */}
                  <p className="text-xs text-gray-600">
                    Total earnings generated from all subscription plans.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    Updated in real-time based on latest payments.
                  </p>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowRevenueBox(false); // close revenue when profile opens
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <FaUserCircle className="text-3xl" />
                <span className="hidden sm:inline text-sm">
                  {user?.Username}
                </span>
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 top-12 w-56 
                  bg-white rounded-xl shadow-2xl border border-gray-100 
                  py-2 z-50"
                >
                  {/* Header */}
                  <div className="px-4 pb-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {user?.Username}
                    </p>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>

                  {/* Update Profile */}
                  <button
                    onClick={() => {
                      setActivePage("profile");
                      setShowProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm 
                     text-gray-700 hover:bg-gray-50 transition rounded-md"
                  >
                    📝 Update Profile
                  </button>

                  {/* Change Password */}
                  <button
                    onClick={() => {
                      setActivePage("changePassword");
                      setShowProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm 
                     text-gray-700 hover:bg-gray-50 transition rounded-md"
                  >
                    🔐 Change Password
                  </button>

                  <div className="h-[1px] bg-gray-100 my-2"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm 
                     text-red-600 hover:bg-red-50 transition rounded-md"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          <div className="px-6 py-3 flex flex-wrap gap-2">
            <NavTab page="dashboard" label="Dashboard" />
            <NavTab page="category" label="Skill Category" />
            <NavTab page="skill" label="Skills" />
            <NavTab page="addCity" label="Add City" />
            <NavTab page="members" label="Members" />
            <NavTab page="subscriptionPlans" label="Subscription Plans" />
            <NavTab page="adminpaymentview" label="Payments" />
            <NavTab page="reports" label="Reports" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white shadow-2xl rounded-2xl p-6 border border-gray-200">
          {activePage === "dashboard" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Welcome, {user?.Username} 👋
              </h2>
            </div>
          )}

          {activePage === "category" && <CategoryList />}
          {activePage === "skill" && <SkillList />}
          {activePage === "profile" && <UpdateProfile />}
          {activePage === "members" && <Members />}
          {activePage === "subscriptionPlans" && <SubscriptionPlans />}
          {activePage === "reports" && <AdminReports />}
          {activePage === "changePassword" && <ChangePassword />}
          {activePage === "addCity" && <AddCity />}
          {activePage === "adminpaymentview" && <AdminPaymentView />}
        </div>
      </main>
    </div>
  );
};

const AdminDashboard = () => (
  <AdminProvider>
    <DashboardContent />
  </AdminProvider>
);

export default AdminDashboard;