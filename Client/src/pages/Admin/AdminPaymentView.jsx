// src/pages/Admin/AdminPaymentView.jsx

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiSearch, FiArrowUpRight } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

const AdminPaymentView = () => {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/payment/admin/payments"
        );

        if (res.data && res.data.success) {
          const paidOnly = (res.data.payments || []).filter(
            (p) => p.status && p.status.toLowerCase() === "paid"
          );

          setPayments(paidOnly);
          setFiltered(paidOnly);
        } else {
          setPayments([]);
          setFiltered([]);
        }
      } catch (err) {
        console.error("Admin payments API error:", err);
        setError("Failed to load payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // STATS
  const stats = useMemo(() => {
    const count = payments.length;
    const amounts = payments
      .map((p) => Number(p.amount || 0))
      .filter((x) => !Number.isNaN(x));

    const total = amounts.reduce((sum, val) => sum + val, 0);
    const avg = count ? total / count : 0;

    return { count, total, avg };
  }, [payments]);

  // Search filter
  useEffect(() => {
    let data = [...payments];

    if (search.trim()) {
      const q = search.trim();
      const qNum = Number(q);

      data = data.filter((p) => {
        const amt = Number(p.amount || 0);
        return (
          (!Number.isNaN(qNum) && amt === qNum) ||
          amt.toString().includes(q)
        );
      });
    }

    data.sort((a, b) => Number(a.amount) - Number(b.amount));

    setFiltered(data);
  }, [search, payments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading payments...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">

      {/* =======================
          🔥 TOP HEADER (FILL EMPTY SPACE)
      ========================== */}
      <div className="w-full flex items-center justify-between bg-white/70 p-4 rounded-2xl shadow-sm border border-gray-100">

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 
                          flex items-center justify-center text-2xl">
            💳
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Payments Overview
            </h1>
            <p className="text-sm text-slate-500">
              Manage all successful payment records and transaction summaries.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full 
                        bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Live Stats Enabled
        </div>
      </div>

      {/* =======================
          🌈 MAIN PASTEL GRADIENT HEADER
      ========================== */}
      <div
        className="
          relative rounded-3xl overflow-hidden 
          bg-gradient-to-r from-pink-100 via-blue-100 to-teal-100
          shadow-[0_8px_30px_rgba(0,0,0,0.07)]
          border border-white/40 backdrop-blur-xl
        "
      >
        <div className="px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          {/* Left text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-md 
                            border border-white/40 rounded-full text-xs font-medium text-gray-700 shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Live · Paid payments overview
            </div>

            <h2 className="mt-3 text-2xl font-bold text-gray-800 tracking-tight">
              Payment History (Paid)
            </h2>

            <p className="text-sm text-gray-600">
              View all successful transactions sorted by amount (low → high).
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 flex-wrap">
            <div className="rounded-2xl px-5 py-3 bg-white/60 backdrop-blur-xl 
                            border border-white/40 shadow flex flex-col text-gray-700 min-w-[140px]">
              <span className="text-sm font-semibold">TOTAL PAID</span>
              <span className="text-xl font-bold text-gray-800 flex items-center">
                <FaRupeeSign className="mr-1" />
                {stats.total.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="rounded-2xl px-5 py-3 bg-white/60 backdrop-blur-xl 
                            border border-white/40 shadow flex flex-col text-gray-700 min-w-[140px]">
              <span className="text-sm font-semibold flex items-center gap-1">
                TRANSACTIONS <FiArrowUpRight />
              </span>

              <span className="text-xl font-bold text-gray-800">
                {stats.count}
              </span>

              <span className="text-[11px] text-gray-600">
                Avg: ₹{Math.round(stats.avg).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* =======================
          🔍 FILTER / SEARCH
      ========================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-800">
            Filters & Sorting
          </h3>
          <p className="text-xs text-gray-500">
            Showing only <span className="font-medium text-green-600">Paid</span> payments,
            sorted by <span className="font-medium">amount (ascending)</span>.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">

          <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full shadow-sm min-w-[220px]">
            <FiSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search by amount (₹)..."
              className="bg-transparent flex-1 outline-none text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Amount • Low → High
          </div>
        </div>
      </div>

      {/* =======================
          📄 TABLE
      ========================== */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500 text-sm">
                    No paid payments found.
                  </td>
                </tr>
              ) : (
                filtered.map((p, index) => (
                  <tr
                    key={p._id}
                    className={`border-t border-gray-100 transition-colors hover:bg-indigo-50/50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs align-top">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {p?.userId?.Username || "—"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {p?.userId?.Email || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {p?.planId?.Name || "—"}
                        </span>
                        {p?.planId?.SwapLimit != null && (
                          <span className="mt-0.5 inline-flex w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            Swaps: {p.planId.SwapLimit}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                        <FaRupeeSign className="mr-1 text-[11px]" />
                        {p.amount
                          ? Number(p.amount).toLocaleString("en-IN")
                          : "0"}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <span className="px-3 py-1 text-xs rounded-full inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {p.status || "Paid"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px] truncate">
                      {p.razorpay_order_id || "—"}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px] truncate">
                      {p.razorpay_payment_id || "—"}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentView;