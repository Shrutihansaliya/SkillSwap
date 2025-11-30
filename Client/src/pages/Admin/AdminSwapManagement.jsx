import { useEffect, useState } from "react";
import axios from "axios";
import { FiFilter, FiRefreshCw, FiUsers, FiEye, FiArrowRight } from "react-icons/fi";

export default function AdminSwapManagement() {
  const [stats, setStats] = useState({});
  const [swaps, setSwaps] = useState([]);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [singleSkillFilter, setSingleSkillFilter] = useState("");
  const [skillA, setSkillA] = useState("");
  const [skillB, setSkillB] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal
  const [selectedSwap, setSelectedSwap] = useState(null);

  // ----------------------- Load dropdown -----------------------
  useEffect(() => {
    axios.get("http://localhost:4000/api/admin/swaps/dropdown")
      .then(res => {
        if (res.data.success) {
          setUsers(res.data.users);
          setSkills(res.data.skills);
        }
      })
      .catch(err => console.error("Dropdown error:", err));
  }, []);

  // ----------------------- Load stats -----------------------
  useEffect(() => {
    axios.get("http://localhost:4000/api/admin/swaps/stats")
      .then(res => {
        if (res.data.success) setStats(res.data.stats);
      })
      .catch(err => console.error("Stats error:", err));
  }, []);

  // ----------------------- Load swaps (with pagination) -----------------------
  const fetchSwaps = () => {
    axios.get("http://localhost:4000/api/admin/swaps/list", {
      params: {
        status: statusFilter,
        singleSkill: singleSkillFilter,
        skillA,
        skillB,
        page,
        pageSize
      }
    })
    .then(res => {
      if (res.data.success) {
        setSwaps(res.data.swaps);
        setTotal(res.data.total);
      }
    })
    .catch(err => console.error("Swap list error:", err));
  };

  useEffect(fetchSwaps, [statusFilter, singleSkillFilter, skillA, skillB, page]);

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("");
    setSingleSkillFilter("");
    setSkillA("");
    setSkillB("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter || singleSkillFilter || skillA || skillB;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>
        <p className="text-gray-600">Manage and search all member profiles</p>
      </div>

      {/* Stats Cards with Light Colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card 
          title="Total Swaps" 
          value={stats.totalSwaps || 0} 
          color="from-blue-50 to-blue-100 border-blue-200"
        />
        <Card 
          title="Active Swaps" 
          value={stats.activeSwaps || 0} 
          color="from-green-50 to-green-100 border-green-200"
        />
        <Card 
          title="Completed Swaps" 
          value={stats.completedSwaps || 0} 
          color="from-purple-50 to-purple-100 border-purple-200"
        />
        <Card 
          title="Pending Requests" 
          value={stats.pendingRequests || 0} 
          color="from-orange-50 to-orange-100 border-orange-200"
        />
      </div>

      {/* Filter Section */}
            {/* Filter Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <FiFilter className="text-gray-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Filter by Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Filter by Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Filter by One Skill */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Filter by One Skill
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={singleSkillFilter}
              onChange={(e) => {
                setSingleSkillFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Select Skill</option>
              {skills.map(s => (
                <option key={s.SkillId} value={s.SkillId}>{s.Name}</option>
              ))}
            </select>
          </div>

          {/* Filter by Two Skills */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Filter by Two Skills
            </label>
            <div className="space-y-2">
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={skillA}
                onChange={(e) => {
                  setSkillA(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Select First Skill</option>
                {skills.map(s => (
                  <option key={s.SkillId} value={s.SkillId}>{s.Name}</option>
                ))}
              </select>
              
              <div className="flex items-center justify-center text-gray-400">
                <FiArrowRight size={16} />
              </div>

              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={skillB}
                onChange={(e) => {
                  setSkillB(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Select Second Skill</option>
                {skills.map(s => (
                  <option key={s.SkillId} value={s.SkillId}>{s.Name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results and Reset */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Total Results: <span className="font-semibold text-gray-800">{total}</span>
          </div>
          
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            onClick={resetFilters}
          >
            <FiRefreshCw size={16} />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {swaps.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? "No Results Found" : "No Search Criteria"}
            </h3>
            <p className="text-gray-500">
              {hasActiveFilters 
                ? "Try adjusting your filters to find more results." 
                : "Select a filter above to find members."
              }
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill Learn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill Teach</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {swaps.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{s.SenderName}</div>
                        <div className="text-sm text-gray-500">{s.SenderEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{s.ReceiverName}</div>
                        <div className="text-sm text-gray-500">{s.ReceiverEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {s.LearnSkillName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {s.TeachSkillName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.Status === 'Active' ? 'bg-green-100 text-green-800' :
                          s.Status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {s.Status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                          onClick={() => setSelectedSwap(s)}
                        >
                          <FiEye size={16} />
                          <span className="text-sm font-medium">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > pageSize && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {page} of {Math.ceil(total / pageSize)}
                  </span>
                  <button
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    disabled={page === Math.ceil(total / pageSize)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {selectedSwap && (
        <SwapModal swap={selectedSwap} close={() => setSelectedSwap(null)} />
      )}
    </div>
  );
}

const Card = ({ title, value, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl border p-4 text-center shadow-sm hover:shadow-md transition-shadow`}>
    <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const SwapModal = ({ swap, close }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform animate-fade-in-up">

      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Swap Details</h2>
            <p className="text-gray-600 text-sm">Complete information about this exchange</p>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors text-gray-500 hover:text-gray-700"
          >
            ✖
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">

        {/* Sender + Receiver */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Sender Information</h3>
            <InfoRow label="Name" value={swap.SenderName} />
            <InfoRow label="Email" value={swap.SenderEmail} />
            <InfoRow label="City" value={swap.SenderCity} />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Receiver Information</h3>
            <InfoRow label="Name" value={swap.ReceiverName} />
            <InfoRow label="Email" value={swap.ReceiverEmail} />
            <InfoRow label="City" value={swap.ReceiverCity} />
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Skills Exchange</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Skill to Learn</h4>
              <div className="text-lg font-bold text-gray-800">{swap.LearnSkillName}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Skill to Teach</h4>
              <div className="text-lg font-bold text-gray-800">{swap.TeachSkillName}</div>
            </div>
          </div>
        </div>

        {/* Additional */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Additional Information</h3>
          <InfoRow label="Status" value={swap.Status} />
          <InfoRow label="Created" value={new Date(swap.CreatedAt).toLocaleString()} />
        </div>

        {/* ⭐ FEEDBACK SECTION — ONLY FOR COMPLETED SWAPS */}
        {swap.Status === "Completed" && (
          <div className="mt-6 space-y-6">

            {/* Sender → Receiver Feedback */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Sender's Feedback</h3>
              {swap.SenderFeedback ? (
                <>
                  <InfoRow label="Rating" value={`${swap.SenderFeedback.Rating} ⭐`} />
                  <InfoRow label="Comments" value={swap.SenderFeedback.Comments || "No comment"} />
                  <InfoRow label="Date" value={new Date(swap.SenderFeedback.Date).toLocaleString()} />
                </>
              ) : (
                <p className="text-sm text-gray-600">No feedback submitted.</p>
              )}
            </div>

            {/* Receiver → Sender Feedback */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-3">Receiver's Feedback</h3>
              {swap.ReceiverFeedback ? (
                <>
                  <InfoRow label="Rating" value={`${swap.ReceiverFeedback.Rating} ⭐`} />
                  <InfoRow label="Comments" value={swap.ReceiverFeedback.Comments || "No comment"} />
                  <InfoRow label="Date" value={new Date(swap.ReceiverFeedback.Date).toLocaleString()} />
                </>
              ) : (
                <p className="text-sm text-gray-600">No feedback submitted.</p>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200 flex justify-end">
        <button
          onClick={close}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-sm hover:shadow-md"
        >
          Close Details
        </button>
      </div>

    </div>
  </div>
);


const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm font-medium text-gray-600">{label}:</span>
    <span className="text-sm text-gray-900 font-medium">{value}</span>
  </div>
);

// Add CSS animation
const styles = `
@keyframes fade-in-up {
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
  animation: fade-in-up 0.3s ease-out;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}