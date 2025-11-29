// src/pages/Admin/Members.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FiX, FiFileText, FiBookOpen, FiSearch, FiFilter, FiRefreshCw, FiAward, FiDownload, FiEye } from "react-icons/fi";
import { FaCheckCircle, FaCertificate, FaGraduationCap } from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext.jsx";

const API_BASE = "http://localhost:4000";

export default function Members() {
  const { setMessage } = useAdmin();

  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [members, setMembers] = useState([]);
  const [popup, setPopup] = useState(null);

  /* ============================
      Debounce Search Input  
  ============================ */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* ============================
      Load Categories
  ============================ */
  useEffect(() => {
    axios
      .get("/api/admin/categories")
      .then((res) => res.data?.success && setCategories(res.data.data))
      .catch(() => setMessage("Failed to load categories"));
  }, []);

  /* ============================
      Load Skills on Category
  ============================ */
  useEffect(() => {
    if (!selectedCategory) {
      setSkills([]);
      setSelectedSkill("");
      return;
    }

    axios
      .get(`/api/admin/skills/${selectedCategory}`)
      .then((res) => res.data?.success && setSkills(res.data.data))
      .catch(() => setMessage("Failed to load skills"));
  }, [selectedCategory]);

  /* ============================
      Load Members With Filters
  ============================ */
  const loadMembers = () => {
    const query = new URLSearchParams();

    if (selectedCategory) query.append("categoryId", selectedCategory);
    if (selectedSkill) query.append("skillId", selectedSkill);
    if (debounced) query.append("search", debounced);

    axios
      .get(`/api/admin/members?${query.toString()}`)
      .then((res) => res.data?.success && setMembers(res.data.data))
      .catch(() => setMessage("Failed to fetch members"));
  };

  useEffect(() => {
    if (selectedCategory || selectedSkill || debounced) {
      loadMembers();
    } else {
      setMembers([]); // do not load all by default
    }
  }, [selectedCategory, selectedSkill, debounced]);

  const isPdf = (url) =>
    typeof url === "string" && url.toLowerCase().endsWith(".pdf");

  return (
    <>
      {/* Header Section */}
      <div className="
          relative rounded-3xl overflow-hidden 
          bg-gradient-to-r from-pink-100 via-blue-100 to-teal-100
          shadow-[0_8px_30px_rgba(0,0,0,0.07)]
          border border-white/40 backdrop-blur-xl
          p-6 mb-6
        ">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Members Management</h1>
            <p className="text-gray-600">Manage and search all member profiles</p>
          </div>
          <div className="bg-white/60 px-4 py-2 rounded-lg mt-2 md:mt-0 backdrop-blur-sm border border-white/40">
            <p className="text-gray-700 text-sm">
              Total Results: <span className="font-semibold">{members.length}</span>
            </p>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-white/40">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiFilter className="w-3 h-3" />
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSkill("");
                }}
                className="w-full border border-gray-300 bg-white p-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.CategoryId} value={c.CategoryId}>
                    {c.CategoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1">
                Filter by Skill
              </label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full border border-gray-300 bg-white p-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedCategory}
              >
                <option value="">Select Skill</option>
                {skills.map((s) => (
                  <option key={s.SkillId} value={s.SkillId}>
                    {s.Name}
                  </option>
                ))}
              </select>
            </div>

            {/* Free Search */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiSearch className="w-3 h-3" />
                Search Members
              </label>
              <input
                type="text"
                placeholder="Search by username, email, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 bg-white p-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedSkill("");
                setSearch("");
                setMembers([]);
              }}
              className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded transition-all duration-200 flex items-center gap-2 backdrop-blur-sm border border-white/40"
            >
              <FiRefreshCw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {/* Default Text */}
        {members.length === 0 && !selectedCategory && !search && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Search Criteria</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Select a category or use the search bar above to find members.
            </p>
          </div>
        )}

        {/* No Results */}
        {members.length === 0 && (selectedCategory || search) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Members Found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}

        {/* Member Cards Grid */}
        {members.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Found {members.length} Member{members.length !== 1 ? 's' : ''}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((m) => (
                <div
                  key={m._id}
                  onClick={() => setPopup(m)}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200"
                >
                  <div className="h-7 bg-gradient-to-r from-[#0b1220] to-[#1c2943]"></div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            m.ProfileImageURL
                              ? `${API_BASE}${m.ProfileImageURL}`
                              : "/default-user.png"
                          }
                          className="w-10 h-10 rounded-full object-cover border border-gray-300"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {m.Username}
                          </h4>
                          {m.IsVerified && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <FaCheckCircle className="w-3 h-3" />
                              Verified
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 truncate">{m.Email}</p>
                      <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        📍 {m.City?.cityName || m.City?.CityName || 'No location'}
                      </p>
                    </div>

                    {/* Skills Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {m.Skills.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100"
                        >
                          {s.Name}
                        </span>
                      ))}
                      {m.Skills.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">
                          +{m.Skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================
          POPUP MODAL
      ============================ */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setPopup(null)}
          />

          <div className="relative z-10 w-full max-w-6xl max-h-full overflow-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/20 rounded-full p-2 border-2 border-white/30">
                      <img
                        src={
                          popup.ProfileImageURL
                            ? `${API_BASE}${popup.ProfileImageURL}`
                            : "/default-user.png"
                        }
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-2xl flex items-center gap-2">
                        {popup.Username}
                        {popup.IsVerified && (
                          <FaCheckCircle className="text-green-300" />
                        )}
                      </h3>
                      <p className="text-blue-100 text-lg mt-1">
                        {popup.Email || "No email provided"}
                      </p>
                      <p className="text-blue-200 text-sm flex items-center gap-1 mt-1">
                        📍 {popup.City?.cityName || popup.City?.CityName || 'No location'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPopup(null)}
                    className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-105"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 bg-gray-50 max-h-[70vh] overflow-y-auto">
                {/* Info Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Contact Info */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <FaGraduationCap className="text-blue-500" />
                      Contact Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <span className="font-semibold text-blue-700 min-w-[80px]">Email:</span>
                        <span className="text-gray-700">{popup.Email || "-"}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <span className="font-semibold text-green-700 min-w-[80px]">Contact:</span>
                        <span className="text-gray-700">{popup.ContactNo || "-"}</span>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <span className="font-semibold text-purple-700 block mb-1">Bio:</span>
                        <span className="text-gray-700">{popup.Bio || "No bio available"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      📍 Address Details
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                      <p className="text-gray-700 text-sm font-medium">
                        {popup.StreetNo || popup.Area || popup.City?.cityName || popup.City?.CityName 
                          ? `${popup.StreetNo || ''} ${popup.Area || ''} ${popup.City?.cityName || popup.City?.CityName || ''}`
                          : "No address information available"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <FaCertificate className="text-yellow-500" />
                      Skills & Certifications
                    </h2>
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                      {popup.Skills?.length || 0} Skills
                    </div>
                  </div>

                  {(!popup.Skills || popup.Skills.length === 0) && (
                    <div className="text-center py-12">
                      <FiAward className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-500 mb-2">No Skills Registered</h3>
                      <p className="text-gray-400">This member hasn't added any skills yet.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {popup.Skills?.map((s, i) => (
                      <div
                        key={i}
                        className={`relative rounded-2xl p-5 transition-all duration-300 ${
                          s.SkillAvailability === "Unavailable"
                            ? "bg-gray-100 border-gray-200 opacity-70"
                            : "bg-gradient-to-br from-white to-blue-50 border border-blue-100 hover:shadow-lg hover:border-blue-200"
                        }`}
                      >
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            s.CertificateStatus === "Verified" 
                              ? "bg-green-100 text-green-800 border border-green-200" 
                              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }`}>
                            <FiAward className="w-3 h-3" />
                            {s.CertificateStatus || "Pending"}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            s.SkillAvailability === "Available"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}>
                            {s.SkillAvailability === "Available" ? "🟢 Available" : "🔴 Unavailable"}
                          </span>
                        </div>

                        {/* Skill Name */}
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <FiBookOpen className="text-purple-500" />
                          {s.Name || "Unnamed Skill"}
                        </h3>

                        {/* Documents Grid */}
                        <div className="space-y-4">
                          {/* Certificate */}
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <FiFileText className="text-green-500" />
                              Certificate
                            </h4>
                            {s.CertificateURL ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
                                    <FiFileText className="w-6 h-6 text-green-600" />
                                  </div>
                                  <span className="text-sm text-gray-600 font-medium">Certificate File</span>
                                </div>
                                <a
                                  href={`${API_BASE}${s.CertificateURL}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View
                                </a>
                              </div>
                            ) : (
                              <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-400 text-sm">No certificate uploaded</p>
                              </div>
                            )}
                          </div>

                          {/* Topics PDF */}
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <FiBookOpen className="text-blue-500" />
                              Topics PDF
                            </h4>
                            {s.ContentFileURL && isPdf(s.ContentFileURL) ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                                    <FiBookOpen className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <span className="text-sm text-gray-600 font-medium">Topics Document</span>
                                </div>
                                <a
                                  href={`${API_BASE}${s.ContentFileURL}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                  <FiDownload className="w-4 h-4" />
                                  Download
                                </a>
                              </div>
                            ) : (
                              <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-400 text-sm">No Topics PDF available</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Source */}
                        {s.Source && (
                          <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                            <h4 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                              📚 Learning Source
                            </h4>
                            <p className="text-sm text-gray-700 break-words">{s.Source}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}