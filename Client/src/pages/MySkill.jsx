// MySkill.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiBookOpen,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiX,
} from "react-icons/fi";

/* ======================
  Material-style MySkill component (Row layout, Light Icons)
  - Keeps all original comments and handlers and endpoints
  - Row layout (left: meta, center: files/source, right: actions)
  - Light icon set (small, subtle) per your choice 2
  - Unavailable rows dimmed and only Reactivate button shown
  - Modal has clear ✕ close button
====================== */

const API_BASE = "http://localhost:4000";
const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

export default function MySkill({ userId }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);

  const [categories, setCategories] = useState([]);
  const [skillsByCategory, setSkillsByCategory] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    CategoryId: "",
    SkillId: "",
    Source: "",
    Certificate: null,
    ContentFile: null,
  });

  const [error, setError] = useState("");

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  /* -------------------- fetch user skills -------------------- */
  const fetchSkills = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/myskills/${userId}`);
      setSkills(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching user skills:", err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [userId]);

  /* -------------------- fetch categories -------------------- */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users/categories`);
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data || [];
        setCategories(data);
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  /* -------------------- when category changes -> load skills -------------------- */
  const handleCategoryChange = async (categoryId) => {
    setFormData((p) => ({ ...p, CategoryId: categoryId, SkillId: "" }));
    setSkillsByCategory([]);
    if (!categoryId) return;

    try {
      const res = await axios.get(
        `${API_BASE}/api/users/skills/category/${categoryId}`
      );
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data || [];
      setSkillsByCategory(data);
    } catch (err) {
      console.error("Error loading skills for category:", err);
      setSkillsByCategory([]);
    }
  };

  /* -------------------- open add/edit modal -------------------- */
  const openAddModal = () => {
    setEditingSkill(null);
    setFormData({
      CategoryId: "",
      SkillId: "",
      Source: "",
      Certificate: null,
      ContentFile: null,
    });
    setSkillsByCategory([]);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    // item is the skill object returned from API
    setEditingSkill(item);
    setFormData({
      CategoryId: "",
      SkillId: item.SkillId || "",
      Source: item.Source || "",
      Certificate: null,
      ContentFile: null,
    });
    setSkillsByCategory([]);
    setError("");
    setShowModal(true);
  };

  /* -------------------- file validation -------------------- */
  const validatePdfFile = (file) => {
    if (!file) return { ok: true };
    if (file.type !== "application/pdf") {
      return { ok: false, msg: "Only PDF files are allowed." };
    }
    if (file.size > MAX_PDF_BYTES) {
      return {
        ok: false,
        msg: `PDF must be ${MAX_PDF_BYTES / (1024 * 1024)} MB or smaller.`,
      };
    }
    return { ok: true };
  };

  /* -------------------- submit add/update -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Skill selection required for add
    if (!editingSkill && !formData.SkillId) {
      setError("Please select a skill.");
      return;
    }

    // ContentFile required on Add (per your request)
    if (!editingSkill && !formData.ContentFile) {
      setError("Please upload Topics PDF (required).");
      return;
    }

    // validate files
    const certValidation = validatePdfFile(formData.Certificate);
    if (!certValidation.ok) {
      setError(certValidation.msg);
      return;
    }
    const contentValidation = validatePdfFile(formData.ContentFile);
    if (!contentValidation.ok) {
      setError(contentValidation.msg);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("UserId", userId);
      if (formData.SkillId) fd.append("SkillId", formData.SkillId);
      if (formData.Source) fd.append("Source", formData.Source);
      if (formData.Certificate) fd.append("Certificate", formData.Certificate);
      if (formData.ContentFile) fd.append("ContentFile", formData.ContentFile);

      if (editingSkill) {
        // Update: editingSkill._id expected by backend route
        await axios.put(`${API_BASE}/api/myskills/${editingSkill._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("Skill updated successfully! ✨");
      } else {
        // Add
        await axios.post(`${API_BASE}/api/myskills`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("Skill added successfully! 🎉");
      }

      await fetchSkills();
      setShowModal(false);
      setEditingSkill(null);
    } catch (err) {
      console.error("Error saving skill:", err);
      const msg =
        err.response?.data?.message || "Server error while saving skill.";
      setError(msg);
    }
  };

  /* -------------------- disable (set Unavailable) -------------------- */
  const handleDisable = async (id) => {
    if (!window.confirm("Are you sure you want to disable this skill?")) return;

    try {
      const res = await axios.put(`${API_BASE}/api/myskills/disable/${id}`);
      // backend should return success:false with message if active swap exists
      if (!res.data?.success) {
        alert(res.data.message || "Cannot disable skill at this time.");
        return;
      }
      showSuccess("Skill disabled (set to Unavailable).");
      await fetchSkills();
    } catch (err) {
      console.error("Error disabling skill:", err);
      alert("Error disabling skill");
    }
  };

  /* -------------------- reactivate -------------------- */
  const handleReactivate = async (id) => {
    try {
      const res = await axios.put(`${API_BASE}/api/myskills/reactivate/${id}`);
      if (!res.data?.success) {
        alert(res.data?.message || "Could not reactivate skill");
        return;
      }
      showSuccess("Skill reactivated!");
      await fetchSkills();
    } catch (err) {
      console.error("Error reactivating skill:", err);
      alert("Error reactivating skill");
    }
  };

  /* -------------------- small helpers -------------------- */
  const onCertificateChange = (file) => {
    setFormData((p) => ({ ...p, Certificate: file }));
  };
  const onContentFileChange = (file) => {
    setFormData((p) => ({ ...p, ContentFile: file }));
  };

  /* -------------------- helpers for availability (support both status keys) -------------------- */
  const isUnavailable = (s) =>
    s?.Status === "Unavailable" || s?.SkillAvailability === "Unavailable";

  /* -------------------- UI (Row layout, 2-column-ish feel using CSS grid) -------------------- */
  return (
    <div className="p-6 sm:p-8 bg-[#F7F4EA] rounded-2xl shadow-md min-h-[80vh] border border-[#A8BBA3]/60">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#B87C4C]">
            My Skills
          </h2>
          <p className="text-sm text-gray-600">
            Manage your skills, certificates and topics PDFs
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-[#B87C4C] text-white px-4 py-2 rounded-md shadow hover:bg-[#8E5C32] transition"
        >
          <FiPlus /> Add Skill
        </button>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 px-4 py-2 rounded-md bg-[#A8BBA3]/20 text-[#31513A] border border-[#A8BBA3]/60 text-sm">
          {successMsg}
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : skills.length === 0 ? (
        <div className="flex flex-col items-center mt-10 opacity-80">
          <img
            alt="empty"
            src="https://cdn-icons-png.flaticon.com/512/4072/4072183.png"
            className="w-24 mb-4"
          />
          <p className="text-lg text-gray-600 italic">No skills added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((s) => (
            <div
              key={s._id}
              className={`grid grid-cols-12 gap-6 items-center p-5 rounded-xl border shadow-sm transition
        ${
          isUnavailable(s)
            ? "bg-[#E5DED3] border-[#C0A890]"
            : "bg-[#A8BBA3]/35 border-[#A8BBA3]"
        }
      `}
            >
              {/* ICON */}
              <div className="col-span-1 flex items-center justify-center">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                    isUnavailable(s)
                      ? "bg-gray-300 text-gray-700"
                      : "bg-[#B87C4C]/15 text-[#B87C4C]"
                  }`}
                >
                  📘
                </div>
              </div>

              {/* MIDDLE SECTION */}
              <div className="col-span-7 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {s.SkillName}
                      </h3>
                      {s.CategoryName && (
                        <span className="text-[11px] font-semibold text-[#B87C4C] bg-[#F7F4EA] px-2 py-0.5 rounded-full">
                          {s.CategoryName}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Source:</span>{" "}
                      {s.Source || "N/A"}
                    </p>
                  </div>

                  {/* Availability */}
                  <div
                    className={`text-sm font-semibold mt-1 px-3 py-1 rounded-full ${
                      isUnavailable(s)
                        ? "bg-gray-400 text-white"
                        : "bg-[#B87C4C]/90 text-white"
                    }`}
                  >
                    {isUnavailable(s) ? "Unavailable" : "Available"}
                  </div>
                </div>

                {/* FILES */}
                <div className="space-y-3">
                  {/* Certificate */}
                  <div className="flex items-center gap-4">
                    <span className="w-32 text-sm font-medium text-gray-700">
                      Certificate:
                    </span>
                    {s.CertificateURL ? (
                      <a
                        href={`${API_BASE}${s.CertificateURL}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[#B87C4C] hover:text-[#8E5C32] transition text-sm"
                      >
                        <FiDownload /> View Certificate
                      </a>
                    ) : (
                      <span className="text-sm text-red-600 flex items-center gap-2">
                        <FiFileText /> Not uploaded
                      </span>
                    )}
                  </div>

                  {/* Topics PDF */}
                  <div className="flex items-center gap-4">
                    <span className="w-32 text-sm font-medium text-gray-700">
                      Topics PDF:
                    </span>
                    {s.ContentFileURL ? (
                      <a
                        href={`${API_BASE}${s.ContentFileURL}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[#B87C4C] hover:text-[#8E5C32] transition text-sm"
                      >
                        <FiBookOpen /> View Topics PDF
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <FiBookOpen /> Not uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="col-span-4 flex justify-end gap-3">
                {isUnavailable(s) ? (
                  <button
                    onClick={() => handleReactivate(s._id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#A8BBA3]/25 text-[#31513A] border border-[#A8BBA3] rounded-md hover:bg-[#A8BBA3]/45 transition text-sm"
                  >
                    <FiRefreshCw /> Reactivate
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => openEditModal(s)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#CBBFAE] rounded-md shadow hover:bg-[#F7F4EA] hover:border-[#B87C4C] transition text-sm"
                    >
                      <FiEdit /> Edit
                    </button>

                    <button
                      onClick={() => handleDisable(s._id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 transition text-sm"
                    >
                      <FiTrash2 /> Disable
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl bg-[#F7F4EA] rounded-2xl shadow-2xl p-8 relative border border-[#A8BBA3]/60">
            {/* Close button */}
            <button
              className="absolute top-5 right-5 text-[#B87C4C] hover:text-[#8E5C32] transition"
              onClick={() => {
                setShowModal(false);
                setEditingSkill(null);
              }}
            >
              <FiX size={22} />
            </button>

            <h3 className="text-2xl font-bold text-[#B87C4C] mb-6 text-center">
              {editingSkill ? "Edit Skill" : "Add New Skill"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!editingSkill && (
                <>
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.CategoryId}
                      onChange={(e) =>
                        handleCategoryChange(e.target.value)
                      }
                      className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 focus:outline-none bg-white/80"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option
                          key={c.CategoryId || c._id}
                          value={c.CategoryId || c._id}
                        >
                          {c.CategoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Skill */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Skill
                    </label>
                    <select
                      value={formData.SkillId}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          SkillId: e.target.value,
                        }))
                      }
                      className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
                      required
                    >
                      <option value="">Select Skill</option>
                      {skillsByCategory.map((sk) => (
                        <option
                          key={sk.SkillId || sk._id}
                          value={sk.SkillId || sk._id}
                        >
                          {sk.Name || sk.SkillName}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Certificate Source */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Certificate Source
                </label>
                <input
                  type="text"
                  placeholder="Enter certificate source (optional)"
                  value={formData.Source}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, Source: e.target.value }))
                  }
                  className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
                />
              </div>

              {/* Certificate upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Certificate (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    onCertificateChange(e.target.files[0] || null)
                  }
                  className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
                />
                {editingSkill && editingSkill.CertificateURL && (
                  <p className="text-sm mt-1">
                    Current:{" "}
                    <a
                      href={`${API_BASE}${editingSkill.CertificateURL}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#B87C4C] hover:underline"
                    >
                      View
                    </a>
                  </p>
                )}
              </div>

              {/* Topics PDF upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {editingSkill
                    ? "New Topics PDF (optional)"
                    : "Topics PDF (required)"}
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    onContentFileChange(e.target.files[0] || null)
                  }
                  className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
                  {...(!editingSkill ? { required: true } : {})}
                />
                {editingSkill && editingSkill.ContentFileURL && (
                  <p className="text-sm mt-1">
                    Current Topics PDF:{" "}
                    <a
                      href={`${API_BASE}${editingSkill.ContentFileURL}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#B87C4C] hover:underline"
                    >
                      View
                    </a>
                  </p>
                )}
              </div>

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 text-lg font-semibold rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32] transition"
              >
                {editingSkill ? "Update Skill" : "Add Skill"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
