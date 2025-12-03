// src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { FaUserCircle, FaRupeeSign, FaUsers, FaRegNewspaper } from "react-icons/fa";
import axios from "axios";
import { AdminProvider, useAdmin } from "../../context/AdminContext.jsx";

import CategoryList from "../../components/CategoryList.jsx";
import SkillList from "../../components/SkillList.jsx";
import UpdateProfile from "./UpdateProfile.jsx";
import Members from "./Members.jsx";
import ChangePassword from "./ChangePassword.jsx";
import SubscriptionPlans from "./SubscriptionPlans.jsx";
import SkillRequestsFromUser from "./SkillRequestsFromUser.jsx";

import AddCity from "./AddCity.jsx";
import AdminReports from "./AdminReports.jsx";
import AdminPaymentView from "./AdminPaymentView.jsx";
import AdminSwapManagement from "./AdminSwapManagement.jsx";

import {
  PaymentChart,
  SkillSwapChart,
  SubscriptionsChart,
  UsersChart,
  ActiveSwapChart,
} from "./Charts.jsx";

/* ------------------------------------------------------------------
   AdminDashboard wrapper (context provider)
   ------------------------------------------------------------------ */
const AdminDashboard = () => (
  <AdminProvider>
    <DashboardContent />
  </AdminProvider>
);

export default AdminDashboard;

/* ------------------------------------------------------------------
   DashboardContent (logic unchanged)
   ------------------------------------------------------------------ */
function DashboardContent() {
  const { activePage, setActivePage, user, loading, handleLogout } = useAdmin();

  useEffect(() => {
    if (user) setActivePage("dashboard");
  }, [user, setActivePage]);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRevenueBox, setShowRevenueBox] = useState(false);

  const [paymentsCount, setPaymentsCount] = useState(0);
  const [paymentsChartData, setPaymentsChartData] = useState([]);
  const [subscriptionsSummary, setSubscriptionsSummary] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    totalRevenue: 0,
    breakdownPerPlan: [],
  });

  const [swapsPerMonth, setSwapsPerMonth] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const [adminStats, setAdminStats] = useState({
    activeSwaps: 0,
    completedSwaps: 0,
    pendingRequests: 0,
    cancelledSwaps: 0,
  });

  const BASE = "/api/admin/stats";
  const REVENUE_URL = "http://localhost:4000/api/payment/total-revenue";

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await axios.get(REVENUE_URL);
        let total = 0;
        if (res?.data) {
          if (typeof res.data.total === "number") total = res.data.total;
          else if (res.data?.data && typeof res.data.data.totalSum === "number") total = res.data.data.totalSum;
          else if (res.data?.data && typeof res.data.data.total === "number") total = res.data.data.total;
          else if (res.data?.data && typeof res.data.data.totalSum === "string")
            total = Number(res.data.data.totalSum) || 0;
        }
        setTotalRevenue(Number.isFinite(total) ? total : 0);
      } catch (err) {
        console.error("Revenue API error:", err);
        setTotalRevenue(0);
      }
    };

    fetchRevenue();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setStatsLoading(true);
      try {
        const reqs = [
          axios.get(`${BASE}/adminStats`).catch((e) => ({ __error: e, data: {} })),
          axios.get(`${BASE}/subscriptions`).catch((e) => ({ __error: e, data: {} })),
          axios.get(`${BASE}/swaps-per-month-detailed`).catch((e) => ({ __error: e, data: [] })),
          axios.get(REVENUE_URL).catch((e) => ({ __error: e, data: {} })),
        ];

        const [adminStatsRes, subsRes, swapsRes, revenueRes] = await Promise.all(reqs);
        if (cancelled) return;

        const raw = adminStatsRes.data?.data ?? adminStatsRes.data ?? {};
        const newStats = {
          activeSwaps: Number(raw.activeSwaps ?? raw.active ?? 0),
          completedSwaps: Number(raw.completedSwaps ?? raw.completed ?? 0),
          pendingRequests: Number(raw.pendingRequests ?? raw.pending ?? 0),
          cancelledSwaps: Number(raw.cancelledSwaps ?? raw.cancelled ?? 0),
        };
        setAdminStats(newStats);

        try {
          const tu = await axios.get(`${BASE}/total-users`);
          setTotalUsers(Number(tu.data?.totalUsers || 0));
        } catch {
          setTotalUsers(Number(raw.totalUsers || 0));
        }

        const monthly = swapsRes.data?.data ?? swapsRes.data ?? raw.swapsPerMonth ?? [];
        setSwapsPerMonth(
          (Array.isArray(monthly) ? monthly : []).map((s) => ({
            name: s.month ?? s.name ?? s.label ?? "",
            value: Number(s.count ?? s.value ?? 0),
          }))
        );

        const subsData = subsRes.data?.data ?? subsRes.data ?? {};
        setSubscriptionsSummary({
          totalSubscriptions: subsData.totalSubscriptions ?? 0,
          activeSubscriptions: subsData.activeSubscriptions ?? 0,
          cancelledSubscriptions: subsData.cancelledSubscriptions ?? 0,
          totalRevenue: subsData.totalRevenue ?? 0,
          breakdownPerPlan: subsData.breakdownPerPlan ?? [],
        });

        const revenuePayload = raw.revenue ?? revenueRes.data?.data ?? revenueRes.data ?? {};
        const countPaid = Number(revenuePayload.countPaid ?? revenuePayload.count ?? 0);
        const totalSum = Number(revenuePayload.totalSum ?? revenuePayload.total ?? 0);

        setPaymentsCount(countPaid);
        if (!Number.isFinite(totalRevenue) || totalRevenue === 0) {
          if (totalSum > 0) setTotalRevenue(totalSum);
        }
        setPaymentsChartData([
          { name: "Paid txns", value: countPaid },
          { name: "Revenue (₹)", value: totalSum },
        ]);
      } catch (err) {
        console.error("fetchAll stats error:", err);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div>Loading...</div>;

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

  /* ------------------- UI ------------------- */
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16 relative">
          <div className="flex items-center h-16 gap-4">
            <div className="p-[3px] rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-md">
              <img src="/sslogo.png" alt="Logo" className="h-12 w-12 rounded-lg object-cover bg-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 tracking-wide">Admin Panel</div>
              <div className="text-xs text-gray-500">{getTitle()}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Revenue button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRevenueBox((prev) => !prev);
                  setShowProfileMenu(false);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-200 to-amber-300 text-yellow-700 shadow-md"
                title="Total revenue"
              >
                <FaRupeeSign className="text-lg" />
              </button>

              {showRevenueBox && (
                <div className="absolute right-0 top-12 w-72 rounded-2xl bg-white shadow-2xl border border-amber-200/60 p-5 z-50">
                  <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent flex items-center gap-1">
                    💰 Total Revenue
                  </h3>

                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-extrabold text-amber-600 leading-none">₹</span>
                    <span className="text-3xl font-extrabold text-gray-900 leading-none">
                      {Number.isFinite(totalRevenue) ? totalRevenue.toLocaleString("en-IN") : "0"}
                    </span>
                  </div>

                  <div className="h-[1px] w-full bg-amber-200/50 my-3"></div>

                  <p className="text-xs text-gray-600">Total earnings generated from payments/subscriptions.</p>
                  <p className="text-[10px] text-gray-400 mt-1 italic">Updated from payment API.</p>
                </div>
              )}
            </div>

            {/* Profile menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowRevenueBox(false);
                }}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                title="Profile"
              >
                <FaUserCircle className="text-3xl" />
                <span className="hidden sm:inline text-sm">{user?.Username}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  <div className="px-4 pb-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-800">{user?.Username}</p>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>

                  <button
                    onClick={() => {
                      setActivePage("profile");
                      setShowProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition rounded-md"
                  >
                    📝 Update Profile
                  </button>

                  <button
                    onClick={() => {
                      setActivePage("changePassword");
                      setShowProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition rounded-md"
                  >
                    🔐 Change Password
                  </button>

                  <div className="h-[1px] bg-gray-100 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition rounded-md"
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
            <NavTab page="reports" label="Complaints" />
            <NavTab page="adminSwaps" label="Swap Management" />
            <NavTab page="skillRequests" label="Skill Requests" />

          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white shadow-2xl rounded-2xl p-6 border border-gray-200">
          {activePage === "dashboard" && (
            <DashboardView
              user={user}
              statsLoading={statsLoading}
              totalUsers={totalUsers}
              totalRevenue={totalRevenue}
              subscriptionsSummary={subscriptionsSummary}
              paymentsCount={paymentsCount}
              paymentsChartData={paymentsChartData}
              swapsPerMonth={swapsPerMonth}
              adminStats={adminStats}
            />
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
          {activePage === "adminSwaps" && <AdminSwapManagement />}
          {activePage === "skillRequests" && <SkillRequestsFromUser />}

        </div>
      </main>
    </div>
  );
}

/* ===================================================================
   UI Components - Cards, ChartBox, DashboardView
   (visual updates only — logic untouched)
   =================================================================== */
/* Icon with soft halo - smaller & neater */
/* Icon Circle - smaller, smooth */
const IconCircle = ({ children }) => (
  <div className="w-12 h-12 rounded-xl bg-white/70 backdrop-blur flex items-center justify-center shadow-sm">
    <div className="text-xl text-gray-700">{children}</div>
  </div>
);
const CompactCard = ({ label, value, icon, color = "indigo" }) => {
  const colors = {
    indigo: "from-indigo-100 to-indigo-50 text-indigo-800",
    amber:  "from-amber-100 to-amber-50 text-amber-800",
    teal:   "from-teal-100 to-emerald-50 text-teal-800",
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${colors[color]} 
        rounded-2xl border border-gray-200
        shadow-md 
        p-5 
        flex flex-col items-start 
        gap-3 
        h-40 w-full
        hover:shadow-lg hover:-translate-y-1 
        transition-all
      `}
    >
      {icon}

      <div>
        <div className="text-xs font-semibold opacity-90 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-3xl font-extrabold leading-tight">{value}</div>
      </div>
    </div>
  );
};



/* Chart box: compact and card-like for dashboards */
const ChartBox = ({ title, subtitle, children }) => (
  <div className="bg-white/80 border border-gray-100 rounded-2xl p-3 shadow-sm flex flex-col">
    <div className="flex items-center justify-between mb-2 gap-3">
      <div>
        <div className="text-sm font-semibold text-gray-700">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
      <div className="text-xs text-indigo-500 self-start cursor-pointer">Overview</div>
    </div>

    <div className="flex-1 min-h-[160px] w-full flex items-center justify-center">
      <div className="w-full h-full flex items-center justify-center">{children}</div>
    </div>
  </div>
);
/* Dashboard view (use these layout classes for compact attractive cards) */
const DashboardView = ({
  user,
  statsLoading,
  totalUsers,
  totalRevenue,
  subscriptionsSummary,
  adminStats,
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
    <div>
  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
    Welcome, <span className="text-indigo-900">{user?.Username}</span>
  </h2>

  <div className="text-sm text-gray-600 mt-1">
    Here's what's happening with your platform today
  </div>
</div>


      <div className="hidden md:flex items-center gap-3">
        <div className="text-xs text-gray-500">Last update</div>
        <div className="text-sm font-medium text-gray-700">Live</div>
      </div>
    </div>

    {/* Compact cards row: smaller visuals, centered content */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

  <CompactCard
    label="Total Users"
    value={statsLoading ? "—" : totalUsers}
    icon={<IconCircle><FaUsers /></IconCircle>}
    color="indigo"   // Light Indigo Card
  />

  <CompactCard
    label="Total Revenue"
    value={
      statsLoading
        ? "—"
        : `₹ ${Number.isFinite(totalRevenue)
            ? totalRevenue.toLocaleString("en-IN")
            : totalRevenue}`
    }
    icon={<IconCircle><FaRupeeSign /></IconCircle>}
    color="amber"    // Light Amber Card
  />

  <CompactCard
    label="Subscriptions"
    value={statsLoading ? "—" : subscriptionsSummary.totalSubscriptions}
    icon={<IconCircle><FaRegNewspaper /></IconCircle>}
    color="teal"     // Light Teal Card
  />

</div>


    {/* Charts area: compact cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartBox title="Swap Status" subtitle="Overview">
        <ActiveSwapChart stats={adminStats} />
      </ChartBox>

      <ChartBox title="Members (Total)">
        <UsersChart data={[{ name: "Members", value: totalUsers }]} />
      </ChartBox>
    </div>
  </div>
);

/* Nav tab button */
function NavTab({ page, label }) {
  const { activePage, setActivePage } = useAdmin();
  const isActive = activePage === page;
  return (
    <button
      onClick={() => setActivePage(page)}
      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-150
        ${isActive ? "bg-white text-gray-900 shadow-md scale-[1.03]" : "text-gray-200 hover:bg-white/10 hover:text-white"}`}
    >
      {label}
    </button>
  );
}
