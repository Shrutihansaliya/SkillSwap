// // src/pages/MySkill.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   FiPlus,
//   FiEdit,
//   FiTrash2,
//   FiBookOpen,
//   FiDownload,
//   FiRefreshCw,
//   FiFileText,
// } from "react-icons/fi";
// import AddSkill from "./AddSkill";

// const API_BASE = "http://localhost:4000";
// const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

// export default function MySkill({ userId }) {
//   const [skills, setSkills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [showModal, setShowModal] = useState(false);
//   const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
//   const [editingSkill, setEditingSkill] = useState(null);

//   const [categories, setCategories] = useState([]);
//   const [skillsByCategory, setSkillsByCategory] = useState([]); // normalized: { id, name, raw }
//   const [successMsg, setSuccessMsg] = useState("");
//   const [pdfText, setPdfText] = useState("");
//   const [loadingPdf, setLoadingPdf] = useState(false);

//   const [formData, setFormData] = useState({
//     CategoryId: "",
//     SkillId: "",
//     Source: "",
//     Certificate: null,
//     ContentFile: null,
//   });

//   const [error, setError] = useState("");

//   const showSuccess = (msg) => {
//     setSuccessMsg(msg);
//     setTimeout(() => setSuccessMsg(""), 2500);
//   };

//   /* -------------------- fetch user skills -------------------- */
//   const fetchSkills = async () => {
//     if (!userId) return;
//     setLoading(true);
//     try {
//       // adjust endpoint if your backend mounts differently
//       const res = await axios.get(`${API_BASE}/api/myskills/${userId}`);
//       // fallback shapes: res.data.data or res.data.skills or res.data
//       const data = res.data?.data || res.data?.skills || res.data || [];
//       setSkills(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Error fetching user skills:", err);
//       setSkills([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSkills();
//   }, [userId]);

//   /* -------------------- UX effects -------------------- */
//   useEffect(() => {
//     document.body.style.overflow = showModal ? "hidden" : "auto";
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, [showModal]);

//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === "Escape") {
//         setShowModal(false);
//         setEditingSkill(null);
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, []);

//   /* -------------------- fetch categories -------------------- */
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/api/users/categories`);
//         const data = Array.isArray(res.data)
//           ? res.data
//           : res.data?.data || res.data || [];
//         setCategories(Array.isArray(data) ? data : []);
//       } catch (err) {
//         console.error("Error loading categories:", err);
//         setCategories([]);
//       }
//     };
//     loadCategories();
//   }, []);

//   /* --------------------
//      handleCategoryChange
//      - normalizes returned skills into { id, name, raw } so selects are consistent
//      - accepts optional presetSkillId to auto-select after load
//   -------------------- */
//   const handleCategoryChange = async (categoryId, presetSkillId = "") => {
//     const catIdStr = categoryId ? String(categoryId) : "";
//     // update CategoryId in form using the same shape we use for <option value>
//     setFormData((p) => ({ ...p, CategoryId: catIdStr, SkillId: "" }));
//     setSkillsByCategory([]);
//     if (!catIdStr) return [];

//     try {
//       const res = await axios.get(
//         `${API_BASE}/api/users/skills/category/${catIdStr}`
//       );
//       const raw = Array.isArray(res.data)
//         ? res.data
//         : res.data?.data || res.data || [];
//       const normalized = (raw || []).map((sk) => {
//         // prefer sk._id (mongo id) or fallback to SkillId numeric id
//         const id = sk._id || sk.SkillId || sk.id || sk.SkillId;
//         const name = sk.Name || sk.SkillName || sk.name || "Unnamed Skill";
//         return { id: String(id), name, raw: sk };
//       });
//       setSkillsByCategory(normalized);

//       if (presetSkillId) {
//         // presetSkillId might be an object or id — normalize to string and try to match
//         const rawPreset =
//           presetSkillId?._id || presetSkillId?.SkillId || presetSkillId || "";
//         const presetStr = String(rawPreset);
//         // try to find matching id in normalized list; if not found, still set to presetStr
//         const found = normalized.find((n) => n.id === presetStr);
//         setFormData((p) => ({ ...p, SkillId: found ? found.id : presetStr }));
//       }

//       return normalized;
//     } catch (err) {
//       console.error("Error loading skills for category:", err);
//       setSkillsByCategory([]);
//       return [];
//     }
//   };

//   /* -------------------- open add modal -------------------- */
//   const openAddModal = () => {
//     setModalMode("add");
//     setEditingSkill(null);
//     setFormData({
//       CategoryId: "",
//       SkillId: "",
//       Source: "",
//       Certificate: null,
//       ContentFile: null,
//     });
//     setSkillsByCategory([]);
//     setError("");
//     setShowModal(true);
//   };

//   /* -------------------- open edit modal (fixed binding) -------------------- */
//   const openEditModal = async (item) => {
//     setModalMode("edit");
//     setEditingSkill(item);

//     // Normalize category ID:
//     // item.CategoryId could be: ObjectId, { _id, CategoryId }, numeric CategoryId, or undefined
//     let normalizedCategoryId = "";
//     if (!item) normalizedCategoryId = "";
//     else if (typeof item.CategoryId === "object" && item.CategoryId !== null) {
//       normalizedCategoryId =
//         item.CategoryId._id || item.CategoryId.CategoryId || item.CategoryId;
//     } else if (item.Category || (item.CategoryId && typeof item.CategoryId !== "object")) {
//       // maybe populated under item.Category._id or plain item.CategoryId numeric
//       normalizedCategoryId =
//         (item.Category && (item.Category._id || item.Category.CategoryId)) ||
//         item.CategoryId ||
//         item.categoryId ||
//         "";
//     } else {
//       normalizedCategoryId = item.categoryId || item.CategoryId || "";
//     }
//     normalizedCategoryId = normalizedCategoryId ? String(normalizedCategoryId) : "";

//     // Normalize skill id:
//     // item.SkillId might be populated object or numeric id in various shapes
//     let normalizedSkillId = "";
//     if (typeof item.SkillId === "object" && item.SkillId !== null) {
//       normalizedSkillId = item.SkillId._id || item.SkillId.SkillId || item.SkillId;
//     } else {
//       normalizedSkillId = item.SkillId || item.Skill || item.skillId || item.skill || "";
//     }
//     normalizedSkillId = normalizedSkillId ? String(normalizedSkillId) : "";

//     // pre-set form (SkillId left blank until skillsByCategory loaded)
//     setFormData({
//       CategoryId: normalizedCategoryId || "",
//       SkillId: "",
//       Source: item.Source || "",
//       Certificate: null,
//       ContentFile: null,
//     });
//     setError("");
//     setShowModal(true);

//     // Load existing PDF content for editing preview
//     setLoadingPdf(true);
//     try {
//       const res = await axios.get(`${API_BASE}/api/myskills/content/${item._id}`);
//       setPdfText(res.data.text || "");
//     } catch (e) {
//       setPdfText("Could not read PDF content.");
//     }
//     setLoadingPdf(false);

//     // Load skills for this category and set SkillId from normalizedSkillId
//     if (normalizedCategoryId) {
//       await handleCategoryChange(normalizedCategoryId, normalizedSkillId);
//     } else {
//       setSkillsByCategory([]);
//       setFormData((p) => ({ ...p, SkillId: normalizedSkillId || "" }));
//     }
//   };

//   /* -------------------- file validation -------------------- */
//   const validatePdfFile = (file) => {
//     if (!file) return { ok: true };
//     if (file.type !== "application/pdf") {
//       return { ok: false, msg: "Only PDF files are allowed." };
//     }
//     if (file.size > MAX_PDF_BYTES) {
//       return {
//         ok: false,
//         msg: `PDF must be ${MAX_PDF_BYTES / (1024 * 1024)} MB or smaller.`,
//       };
//     }
//     return { ok: true };
//   };

//   /* -------------------- submit (edit) -------------------- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     // For edit flow editingSkill should be truthy
//     if (!editingSkill && !formData.SkillId) {
//       setError("Please select a skill.");
//       return;
//     }

//     const certValidation = validatePdfFile(formData.Certificate);
//     if (!certValidation.ok) {
//       setError(certValidation.msg);
//       return;
//     }
//     const contentValidation = validatePdfFile(formData.ContentFile);
//     if (!contentValidation.ok) {
//       setError(contentValidation.msg);
//       return;
//     }

//     try {
//       const fd = new FormData();
//       fd.append("UserId", userId);
//       if (formData.SkillId) fd.append("SkillId", formData.SkillId);
//       if (formData.Source) fd.append("Source", formData.Source);
//       if (formData.Certificate) fd.append("Certificate", formData.Certificate);
//       if (formData.ContentFile) fd.append("ContentFile", formData.ContentFile);
//       if (editingSkill) {
//         fd.append("EditedText", pdfText);
//       }

//       if (editingSkill) {
//         await axios.put(`${API_BASE}/api/myskills/${editingSkill._id}`, fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         showSuccess("Skill updated successfully! ✨");
//       } else {
//         await axios.post(`${API_BASE}/api/myskills`, fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         showSuccess("Skill added successfully! 🎉");
//       }

//       await fetchSkills();
//       setShowModal(false);
//       setEditingSkill(null);
//     } catch (err) {
//       console.error("Error saving skill:", err);
//       const msg = err.response?.data?.message || "Server error while saving skill.";
//       setError(msg);
//     }
//   };

//   const handleDisable = async (id) => {
//     if (!window.confirm("Are you sure you want to disable this skill?")) return;
//     try {
//       const res = await axios.put(`${API_BASE}/api/myskills/disable/${id}`);
//       if (!res.data?.success) {
//         alert(res.data.message || "Cannot disable skill at this time.");
//         return;
//       }
//       showSuccess("Skill disabled (set to Unavailable).");
//       await fetchSkills();
//     } catch (err) {
//       console.error("Error disabling skill:", err);
//       alert("Error disabling skill");
//     }
//   };

//   const handleReactivate = async (id) => {
//     try {
//       const res = await axios.put(`${API_BASE}/api/myskills/reactivate/${id}`);
//       if (!res.data?.success) {
//         alert(res.data?.message || "Could not reactivate skill");
//         return;
//       }
//       showSuccess("Skill reactivated!");
//       await fetchSkills();
//     } catch (err) {
//       console.error("Error reactivating skill:", err);
//       alert("Error reactivating skill");
//     }
//   };

//   const onCertificateChange = (file) => {
//     setFormData((p) => ({ ...p, Certificate: file }));
//   };
//   const onContentFileChange = (file) => {
//     setFormData((p) => ({ ...p, ContentFile: file }));
//   };

//   const isUnavailable = (s) =>
//     s?.Status === "Unavailable" || s?.SkillAvailability === "Unavailable";

//   useEffect(() => {
//     const onSkillAdded = async () => {
//       setShowModal(false);
//       setEditingSkill(null);
//       await fetchSkills();
//       showSuccess("Skill added!");
//     };
//     window.addEventListener("skillAdded", onSkillAdded);
//     return () => window.removeEventListener("skillAdded", onSkillAdded);
//   }, []);

//   /* -------------------- Render -------------------- */
//   return (
//     <div className="p-6 sm:p-8 bg-[#F7F4EA] rounded-2xl shadow-md min-h-[80vh] border border-[#A8BBA3]/60">
//       <style>{`
//         .skill-popup { background: #F7EFE5; border-radius: 20px; padding: 22px; border: 1px solid #D8C7B2; box-shadow: 0px 14px 40px rgba(9,30,66,0.08); animation: popupShow 220ms ease-out;}
//         @keyframes popupShow { from { opacity: 0; transform: scale(0.985); } to { opacity: 1; transform: scale(1); } }
//         .skill-popup h2, .skill-popup h3 { color: #8B5E34; font-weight: 700; }
//         .skill-popup .left-box { background: #FFF9F4; border: 1px solid #E6D5C3; border-radius: 12px; padding: 18px; }
//         .skill-popup .preview-box { background: #FBF7F2; border: 1px solid #E6D5C3; border-radius: 12px; padding: 18px; }
//         .skill-popup input, .skill-popup select, .skill-popup textarea { background: #FFFFFF; border: 1px solid #C8B8A6; padding: 10px 12px; border-radius: 8px; width: 100%; outline: none; transition: 0.18s; }
//         .skill-popup input:focus, .skill-popup select:focus, .skill-popup textarea:focus { border-color: #B27744; box-shadow: 0 0 0 4px rgba(178,119,68,0.08); }
//         .btn-brown { background: #B27744 !important; color: white !important; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .btn-brown:hover { background: #8B5E34 !important; }
//         .btn-light-brown { background: #EFE3D8; color: #6C4A2F; padding: 10px 16px; border-radius: 8px; font-weight: 600; }
//         .btn-blue { background: #4A67FF; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .btn-green { background: #2E8B57; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .image-preview-box { border: 1px solid #D8C7B2; background: #FFF; border-radius: 10px; height: 170px; display:flex; align-items:center; justify-content:center; color:#A38D78; font-size:14px; }
//       `}</style>

//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h2 className="text-2xl font-semibold text-[#B87C4C]">My Skills</h2>
//           <p className="text-sm text-gray-600">Manage your skills, certificates and topics PDFs</p>
//         </div>

//         <button
//           onClick={openAddModal}
//           className="inline-flex items-center gap-2 bg-[#B87C4C] text-white px-4 py-2 rounded-md shadow hover:bg-[#8E5C32] transition"
//         >
//           <FiPlus /> Add Skill
//         </button>
//       </div>

//       {successMsg && (
//         <div className="mb-4 px-4 py-2 rounded-md bg-[#A8BBA3]/20 text-[#31513A] border border-[#A8BBA3]/60 text-sm">
//           {successMsg}
//         </div>
//       )}

//       {loading ? (
//         <p className="text-center text-gray-500">Loading...</p>
//       ) : skills.length === 0 ? (
//         <div className="flex flex-col items-center mt-10 opacity-80">
//           <img
//             alt="empty"
//             src="https://cdn-icons-png.flaticon.com/512/4072/4072183.png"
//             className="w-24 mb-4"
//           />
//           <p className="text-lg text-gray-600 italic">No skills added yet.</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {skills.map((s) => (
//             <div
//               key={s._id}
//               className={`grid grid-cols-12 gap-6 items-center p-5 rounded-xl border shadow-sm transition transform hover:scale-[1.002] ${isUnavailable(s)
//                   ? "bg-[#E5DED3] border-[#C0A890]"
//                   : "bg-[#A8BBA3]/35 border-[#A8BBA3]"
//                 }`}>
//               <div className="col-span-1 flex items-center justify-center">
//                 <div
//                   className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${isUnavailable(s)
//                       ? "bg-gray-300 text-gray-700"
//                       : "bg-[#B87C4C]/15 text-[#B87C4C]"
//                     }`}
//                 >
//                   📘
//                 </div>
//               </div>

//               <div className="col-span-7 space-y-4">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <div className="flex items-center gap-3 flex-wrap">
//                       <h3 className="text-lg font-semibold text-gray-900">
//                         {s.SkillName || (s.SkillId && (s.SkillId.Name || s.SkillId.Name))}
//                       </h3>
//                       {s.CategoryName && (
//                         <span className="text-[11px] font-semibold text-[#B87C4C] bg-[#F7F4EA] px-2 py-0.5 rounded-full">
//                           {s.CategoryName}
//                         </span>
//                       )}
//                     </div>

//                     <p className="text-sm text-gray-700 mt-1">
//                       <span className="font-medium">Source:</span> {s.Source || "N/A"}
//                     </p>
//                   </div>

//                   <div
//                     className={`text-sm font-semibold mt-1 px-3 py-1 rounded-full ${isUnavailable(s) ? "bg-gray-400 text-white" : "bg-[#B87C4C]/90 text-white"
//                       }`}
//                   >
//                     {isUnavailable(s) ? "Unavailable" : "Available"}
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="flex items-center gap-4">
//                     <span className="w-32 text-sm font-medium text-gray-700">Certificate:</span>
//                     {s.CertificateURL ? (
//                       <a
//                         href={`${API_BASE}${s.CertificateURL}`}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="flex items-center gap-2 text-[#B87C4C] hover:text-[#8E5C32] transition text-sm"
//                       >
//                         <FiDownload /> View Certificate
//                       </a>
//                     ) : (
//                       <span className="text-sm text-red-600 flex items-center gap-2">
//                         <FiFileText /> Not uploaded
//                       </span>
//                     )}
//                   </div>

//                   <div className="flex items-center gap-4">
//                     <span className="w-32 text-sm font-medium text-gray-700">Topics PDF:</span>
//                     {s.ContentFileURL ? (
//                       <a
//                         href={`${API_BASE}${s.ContentFileURL}`}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="flex items-center gap-2 text-[#B87C4C] hover:text-[#8E5C32] transition text-sm"
//                       >
//                         <FiBookOpen /> View Topics PDF
//                       </a>
//                     ) : (
//                       <span className="text-sm text-gray-500 flex items-center gap-2">
//                         <FiBookOpen /> Not uploaded
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="col-span-4 flex justify-end gap-3">
//                 {isUnavailable(s) ? (
//                   <button
//                     onClick={() => handleReactivate(s._id)}
//                     className="inline-flex items-center gap-2 px-4 py-2 bg-[#A8BBA3]/25 text-[#31513A] border border-[#A8BBA3] rounded-md hover:bg-[#A8BBA3]/45 transition text-sm"
//                   >
//                     <FiRefreshCw /> Reactivate
//                   </button>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => openEditModal(s)}
//                       className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#CBBFAE] rounded-md shadow hover:bg-[#F7F4EA] hover:border-[#B87C4C] transition text-sm"
//                     >
//                       <FiEdit /> Edit
//                     </button>

//                     <button
//                       onClick={() => handleDisable(s._id)}
//                       className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 transition text-sm"
//                     >
//                       <FiTrash2 /> Disable
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {showModal && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center px-4"
//           aria-modal="true"
//           role="dialog"
//           onClick={() => {
//             setShowModal(false);
//             setEditingSkill(null);
//           }}
//         >
//           <div
//             className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//             aria-hidden="true"
//           />

//           <div
//             className="relative w-full max-w-4xl mx-4 transform transition-all duration-300 scale-100"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div
//               className="bg-white rounded-2xl shadow-2xl border p-6 overflow-auto"
//               style={{ maxHeight: "90vh" }}
//             >
//               <div className="
//   rounded-t-2xl
//   px-6 py-5
//   shadow-md
//   border border-[#e8d8c8]
//   bg-gradient-to-r from-[#B17847] to-[#A66A3A]
//   text-white
// ">
//                 <h3 className="text-2xl font-bold">
//                   {modalMode === "edit" ? "Edit Skill" : "Add New Skill"}
//                 </h3>
//                 <p className="text-sm opacity-90 mt-1">
//                   Manage your skill details easily
//                 </p>
//               </div>

//               {modalMode === "add" ? (
//                 <div className="modal-content w-full" onClick={(e) => e.stopPropagation()}>
//                   <style>{`
//       .modal-content header, .modal-content .header, .modal-content .site-header, .modal-content .navbar, .modal-content .topbar, .modal-content footer, .modal-content .site-footer, .modal-content .app-footer { display: none !important; }
//       .modal-content .modal-inner { display: block; width: 100%; box-sizing: border-box; }
//       .modal-content .modal-inner img, .modal-content .modal-inner input, .modal-content .modal-inner select, .modal-content .modal-inner textarea, .modal-content .modal-inner button { box-sizing: border-box; }
//     `}</style>

//                   <div className="modal-inner">
//                     <AddSkill
//                       inline={true}
//                       userId={userId}
//                       onDone={async () => {
//                         setShowModal(false);
//                         await fetchSkills();
//                         setEditingSkill(null);
//                         showSuccess("Skill added!");
//                       }}
//                     />

//                     <div className="mt-4 flex justify-end gap-3">
//                       <button
//                         onClick={() => {
//                           setShowModal(false);
//                           setEditingSkill(null);
//                         }}
//                         className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
//                       >
//                         Close
//                       </button>

//                       <button
//                         onClick={async () => {
//                           setShowModal(false);
//                           setEditingSkill(null);
//                           await fetchSkills();
//                           showSuccess("List refreshed");
//                         }}
//                         className="px-4 py-2 rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32]"
//                       >
//                         Done
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <form onSubmit={handleSubmit} className="space-y-6">
//                   {!editingSkill ? null : (
//                     <>
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Category
//                         </label>
//                         <select
//                           value={String(formData.CategoryId || "")}
//                           onChange={(e) => handleCategoryChange(e.target.value)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 focus:outline-none bg-white/80"
//                         >
//                           <option value="">Select Category</option>
//                           {categories.map((c) => {
//                             // normalize option value to prefer _id then CategoryId
//                             const optVal = String(c._id || c.CategoryId || "");
//                             return (
//                               <option key={optVal} value={optVal}>
//                                 {c.CategoryName || c.name || "Unnamed Category"}
//                               </option>
//                             );
//                           })}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Skill
//                         </label>
//                         <select
//                           value={String(formData.SkillId || "")}
//                           onChange={(e) => setFormData((p) => ({ ...p, SkillId: String(e.target.value) }))}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                           required
//                         >
//                           <option value="">Select Skill</option>
//                           {skillsByCategory.map((sk) => (
//                             <option key={sk.id} value={sk.id}>
//                               {sk.name}
//                             </option>
//                           ))}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Certificate Source
//                         </label>
//                         <input
//                           type="text"
//                           placeholder="Enter certificate source (optional)"
//                           value={formData.Source}
//                           onChange={(e) => setFormData((p) => ({ ...p, Source: e.target.value }))}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Certificate (PDF)
//                         </label>
//                         <input
//                           type="file"
//                           accept="application/pdf"
//                           onChange={(e) => onCertificateChange(e.target.files[0] || null)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                         {editingSkill && editingSkill.CertificateURL && (
//                           <p className="text-sm mt-1">
//                             Current: {" "}
//                             <a
//                               href={`${API_BASE}${editingSkill.CertificateURL}`}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="text-[#B87C4C] hover:underline"
//                             >
//                               View
//                             </a>
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           New Topics PDF (optional)
//                         </label>
//                         <input
//                           type="file"
//                           accept="application/pdf"
//                           onChange={(e) => onContentFileChange(e.target.files[0] || null)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                         {editingSkill && editingSkill.ContentFileURL && (
//                           <p className="text-sm mt-1">
//                             Current Topics PDF: {" "}
//                             <a
//                               href={`${API_BASE}${editingSkill.ContentFileURL}`}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="text-[#B87C4C] hover:underline"
//                             >
//                               View
//                             </a>
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Edit PDF Content
//                         </label>

//                         {loadingPdf ? (
//                           <p className="text-gray-500 text-sm">Loading PDF content...</p>
//                         ) : (
//                           <>
//                             <textarea
//                               className="w-full border border-[#CBBFAE] px-3 py-2 h-48 rounded-md bg-white/80"
//                               value={pdfText}
//                               onChange={(e) => setPdfText(e.target.value)}
//                             />

//                             <div className="mt-4 p-3 border bg-white rounded">
//                               <h4 className="text-md font-semibold text-gray-700">Live Preview</h4>
//                               <div className="text-sm text-gray-800 whitespace-pre-line mt-2">
//                                 {pdfText || "Start typing to generate preview..."}
//                               </div>
//                             </div>
//                           </>
//                         )}
//                       </div>

//                       {error && <p className="text-red-600 text-sm">{error}</p>}

//                       <button
//                         type="submit"
//                         className="w-full py-3 text-lg font-semibold rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32] transition"
//                       >
//                         Update Skill
//                       </button>
//                     </>
//                   )}
//                 </form>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }














// // src/pages/MySkill.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   FiPlus,
//   FiEdit,
//   FiTrash2,
//   FiBookOpen,
//   FiDownload,
//   FiRefreshCw,
//   FiFileText,
// } from "react-icons/fi";
// import AddSkill from "./AddSkill";

// const API_BASE = "http://localhost:4000";
// const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

// export default function MySkill({ userId }) {
//   const [skills, setSkills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [showModal, setShowModal] = useState(false);
//   const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
//   const [editingSkill, setEditingSkill] = useState(null);

//   const [categories, setCategories] = useState([]);
//   const [skillsByCategory, setSkillsByCategory] = useState([]); // normalized: { id, name, raw }
//   const [successMsg, setSuccessMsg] = useState("");
//   const [pdfText, setPdfText] = useState("");
//   const [loadingPdf, setLoadingPdf] = useState(false);

//   const [formData, setFormData] = useState({
//     CategoryId: "",
//     SkillId: "",
//     Source: "",
//     Certificate: null,
//     ContentFile: null,
//   });

//   const [error, setError] = useState("");

//   const showSuccess = (msg) => {
//     setSuccessMsg(msg);
//     setTimeout(() => setSuccessMsg(""), 2500);
//   };

//   /* -------------------- fetch user skills -------------------- */
//   const fetchSkills = async () => {
//     if (!userId) return;
//     setLoading(true);
//     try {
//       const res = await axios.get(`${API_BASE}/api/myskills/${userId}`);
//       const data = res.data?.data || res.data?.skills || res.data || [];
//       setSkills(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Error fetching user skills:", err);
//       setSkills([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSkills();
//   }, [userId]);




//   // ensure pdfText is always in sync with the editingSkill
// useEffect(() => {
//   let cancelled = false;

//   const loadPdf = async () => {
//     if (!editingSkill || !editingSkill._id) {
//       setPdfText("");
//       return;
//     }

//     setLoadingPdf(true);
//     try {
//       const res = await axios.get(`${API_BASE}/api/myskills/content/${editingSkill._id}`);
//       if (cancelled) return;
//       setPdfText(res?.data?.text || "");
//     } catch (err) {
//       if (!cancelled) {
//         console.warn("Could not load pdfText for editingSkill:", err?.message || err);
//         setPdfText("");
//       }
//     } finally {
//       if (!cancelled) setLoadingPdf(false);
//     }
//   };

//   loadPdf();
//   return () => { cancelled = true; };
// }, [editingSkill?._id]);


//   /* -------------------- UX effects -------------------- */
//   useEffect(() => {
//     document.body.style.overflow = showModal ? "hidden" : "auto";
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, [showModal]);

//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === "Escape") {
//         setShowModal(false);
//         setEditingSkill(null);
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, []);

//   /* -------------------- fetch categories -------------------- */
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/api/users/categories`);
//         const data = Array.isArray(res.data)
//           ? res.data
//           : res.data?.data || res.data || [];
//         setCategories(Array.isArray(data) ? data : []);
//       } catch (err) {
//         console.error("Error loading categories:", err);
//         setCategories([]);
//       }
//     };
//     loadCategories();
//   }, []);

//   /* --------------------
//      handleCategoryChange
//      - normalizes returned skills into { id, name, raw } so selects are consistent
//      - accepts optional presetSkillId to auto-select after load
//   -------------------- */
//   const handleCategoryChange = async (categoryId, presetSkillId = "") => {
//     // categoryId might be numeric CategoryId or Mongo _id; server expects numeric CategoryId in your controller.
//     // We still pass whatever the user selects — prefer numeric CategoryId in option values (see options below).
//     const catIdStr = categoryId ? String(categoryId) : "";
//     setFormData((p) => ({ ...p, CategoryId: catIdStr, SkillId: "" }));
//     setSkillsByCategory([]);
//     if (!catIdStr) return [];

//     try {
//       const res = await axios.get(
//         `${API_BASE}/api/users/skills/category/${catIdStr}`
//       );
//       const raw = Array.isArray(res.data)
//         ? res.data
//         : res.data?.data || res.data || [];
//       // PREFERRED: map skill id to numeric SkillId if provided by Skill doc, otherwise fallback to _id
//       const normalized = (raw || []).map((sk) => {
//         const id = sk.SkillId ?? sk._id ?? sk.id ?? "";
//         const name = sk.Name || sk.SkillName || sk.name || "Unnamed Skill";
//         return { id: String(id), name, raw: sk };
//       });
//       setSkillsByCategory(normalized);
// if (presetSkillId) {
//   // Backwards-compatible normalization (no optional chaining / ??)
//   let rawPreset = "";
//   if (typeof presetSkillId === "object" && presetSkillId !== null) {
//     rawPreset = presetSkillId._id || presetSkillId.SkillId || "";
//   } else {
//     rawPreset = presetSkillId || "";
//   }

//   const presetStr = String(rawPreset);
//   const found = normalized.find((n) => n.id === presetStr);
//   setFormData((p) => ({ ...p, SkillId: found ? found.id : presetStr }));
// }

//       return normalized;
//     } catch (err) {
//       console.error("Error loading skills for category:", err);
//       setSkillsByCategory([]);
//       return [];
//     }
//   };

//   /* -------------------- open add modal -------------------- */
//   const openAddModal = () => {
//     setModalMode("add");
//     setEditingSkill(null);
//     setFormData({
//       CategoryId: "",
//       SkillId: "",
//       Source: "",
//       Certificate: null,
//       ContentFile: null,
//     });
//     setSkillsByCategory([]);
//     setError("");
//     setShowModal(true);
//   };

//   /* -------------------- open edit modal (fixed binding) -------------------- */
//   const openEditModal = async (item) => {
//   setModalMode("edit");
//   setEditingSkill(item);

//   // ------------- normalize category id -------------
//   let normalizedCategoryId = "";
//   if (!item) {
//     normalizedCategoryId = "";
//   } else {
//     if (item.CategoryId && typeof item.CategoryId === "object" && item.CategoryId !== null) {
//       normalizedCategoryId =
//         (item.CategoryId.CategoryId !== undefined && item.CategoryId.CategoryId !== null)
//           ? item.CategoryId.CategoryId
//           : (item.CategoryId._id || "");
//     } else if (item.Category && typeof item.Category === "object" && item.Category !== null) {
//       normalizedCategoryId =
//         (item.Category.CategoryId !== undefined && item.Category.CategoryId !== null)
//           ? item.Category.CategoryId
//           : (item.Category._id || "");
//     } else {
//       if (item.CategoryId !== undefined && item.CategoryId !== null) normalizedCategoryId = item.CategoryId;
//       else if (item.Category !== undefined && item.Category !== null) normalizedCategoryId = item.Category;
//       else if (item.categoryId !== undefined && item.categoryId !== null) normalizedCategoryId = item.categoryId;
//       else normalizedCategoryId = "";
//     }
//   }
//   normalizedCategoryId = normalizedCategoryId ? String(normalizedCategoryId) : "";

//   // ------------- normalize skill id -------------
//   let normalizedSkillId = "";
//   if (item && item.SkillId && typeof item.SkillId === "object" && item.SkillId !== null) {
//     normalizedSkillId =
//       (item.SkillId.SkillId !== undefined && item.SkillId.SkillId !== null)
//         ? item.SkillId.SkillId
//         : (item.SkillId._id || "");
//   } else {
//     if (item && item.SkillId !== undefined && item.SkillId !== null) normalizedSkillId = item.SkillId;
//     else if (item && item.Skill !== undefined && item.Skill !== null) normalizedSkillId = item.Skill;
//     else if (item && item.skillId !== undefined && item.skillId !== null) normalizedSkillId = item.skillId;
//     else if (item && item.skill !== undefined && item.skill !== null) normalizedSkillId = item.skill;
//     else normalizedSkillId = "";
//   }
//   normalizedSkillId = normalizedSkillId ? String(normalizedSkillId) : "";

//   // ------------- preset form (SkillId left blank until skills loaded) -------------
//   setFormData({
//     CategoryId: normalizedCategoryId || "",
//     SkillId: "",
//     Source: item && item.Source ? item.Source : "",
//     Certificate: null,
//     ContentFile: null,
//   });
//   setError("");
//   setShowModal(true);

//   // ------------- load PDF content preview (if any) -------------
//     // ------------- load PDF content preview (if any) -------------
//   setLoadingPdf(true);
//   try {
//     const res = await axios.get(`${API_BASE}/api/myskills/content/${item._id}`);
//     setPdfText(res && res.data && res.data.text ? res.data.text : "");
//   } catch (e) {
//     // keep it blank so user can type; don't block the rest
//     setPdfText("");
//     console.warn("Could not read PDF content:", e && e.message ? e.message : e);
//   }
//   setLoadingPdf(false);


//   // ------------- If we already have a CategoryId, load skills for it -------------
//   if (normalizedCategoryId) {
//     await handleCategoryChange(normalizedCategoryId, normalizedSkillId);
//     return;
//   }

//   // ------------- If CategoryId missing but SkillId exists, try to find which category contains the skill -------------
//   if (normalizedSkillId && Array.isArray(categories) && categories.length > 0) {
//     try {
//       // iterate categories and request skills for each category until we find a match
//       let foundCategoryId = "";
//       for (let i = 0; i < categories.length; i++) {
//         const c = categories[i];
//         // prefer numeric CategoryId, fallback to _id
//         const catVal = String((c.CategoryId !== undefined && c.CategoryId !== null) ? c.CategoryId : (c._id || ""));
//         if (!catVal) continue;
//         try {
//           // fetch skills for this category
//           const resp = await axios.get(`${API_BASE}/api/users/skills/category/${catVal}`);
//           const skillsRaw = Array.isArray(resp.data) ? resp.data : (resp.data && resp.data.data ? resp.data.data : resp.data || []);
//           // map to ids same way as handleCategoryChange to compare
//           for (let k = 0; k < skillsRaw.length; k++) {
//             const sk = skillsRaw[k];
//             const skId = (sk.SkillId !== undefined && sk.SkillId !== null) ? String(sk.SkillId) : (sk._id ? String(sk._id) : "");
//             if (skId === normalizedSkillId) {
//               foundCategoryId = catVal;
//               break;
//             }
//           }
//           if (foundCategoryId) break;
//         } catch (innerErr) {
//           // ignore a failed category fetch and continue to next
//           console.warn(`Failed to load skills for category ${catVal}:`, innerErr && innerErr.message ? innerErr.message : innerErr);
//         }
//       }

//       if (foundCategoryId) {
//         // found the category that contains this skill — load it and preset skill
//         await handleCategoryChange(foundCategoryId, normalizedSkillId);
//         setFormData((p) => ({ ...p, CategoryId: String(foundCategoryId) }));
//         return;
//       }
//     } catch (err) {
//       console.warn("Error while trying to auto-find category for skill:", err && err.message ? err.message : err);
//     }
//   }

//   // ------------- fallback: no category info found; keep skills empty and set SkillId if possible -------------
//   setSkillsByCategory([]);
//   setFormData((p) => ({ ...p, SkillId: normalizedSkillId || "" }));
// };


//   /* -------------------- file validation -------------------- */
//   const validatePdfFile = (file) => {
//     if (!file) return { ok: true };
//     if (file.type !== "application/pdf") {
//       return { ok: false, msg: "Only PDF files are allowed." };
//     }
//     if (file.size > MAX_PDF_BYTES) {
//       return {
//         ok: false,
//         msg: `PDF must be ${MAX_PDF_BYTES / (1024 * 1024)} MB or smaller.`,
//       };
//     }
//     return { ok: true };
//   };

//   /* -------------------- submit (edit) -------------------- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!editingSkill && !formData.SkillId) {
//       setError("Please select a skill.");
//       return;
//     }

//     const certValidation = validatePdfFile(formData.Certificate);
//     if (!certValidation.ok) {
//       setError(certValidation.msg);
//       return;
//     }
//     const contentValidation = validatePdfFile(formData.ContentFile);
//     if (!contentValidation.ok) {
//       setError(contentValidation.msg);
//       return;
//     }

//     try {
//       const fd = new FormData();
//       fd.append("UserId", userId);
//       if (formData.SkillId) fd.append("SkillId", formData.SkillId);
//       if (formData.Source) fd.append("Source", formData.Source);
//       if (formData.Certificate) fd.append("Certificate", formData.Certificate);
//       if (formData.ContentFile) fd.append("ContentFile", formData.ContentFile);
//       if (editingSkill) {
//         fd.append("EditedText", pdfText);
//       }

//       if (editingSkill) {
//         await axios.put(`${API_BASE}/api/myskills/${editingSkill._id}`, fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         showSuccess("Skill updated successfully! ✨");
//       } else {
//         await axios.post(`${API_BASE}/api/myskills`, fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         showSuccess("Skill added successfully! 🎉");
//       }

//       await fetchSkills();
//       setShowModal(false);
//       setEditingSkill(null);
//     } catch (err) {
//       console.error("Error saving skill:", err);
//       const msg = err.response?.data?.message || "Server error while saving skill.";
//       setError(msg);
//     }
//   };

//   const handleDisable = async (id) => {
//     if (!window.confirm("Are you sure you want to disable this skill?")) return;
//     try {
//       const res = await axios.put(`${API_BASE}/api/myskills/disable/${id}`);
//       if (!res.data?.success) {
//         alert(res.data.message || "Cannot disable skill at this time.");
//         return;
//       }
//       showSuccess("Skill disabled (set to Unavailable).");
//       await fetchSkills();
//     } catch (err) {
//       console.error("Error disabling skill:", err);
//       alert("Error disabling skill");
//     }
//   };

//   const handleReactivate = async (id) => {
//     try {
//       const res = await axios.put(`${API_BASE}/api/myskills/reactivate/${id}`);
//       if (!res.data?.success) {
//         alert(res.data?.message || "Could not reactivate skill");
//         return;
//       }
//       showSuccess("Skill reactivated!");
//       await fetchSkills();
//     } catch (err) {
//       console.error("Error reactivating skill:", err);
//       alert("Error reactivating skill");
//     }
//   };

//   const onCertificateChange = (file) => {
//     setFormData((p) => ({ ...p, Certificate: file }));
//   };
//   const onContentFileChange = (file) => {
//     setFormData((p) => ({ ...p, ContentFile: file }));
//   };

//   const isUnavailable = (s) =>
//     s?.Status === "Unavailable" || s?.SkillAvailability === "Unavailable";

//   useEffect(() => {
//     const onSkillAdded = async () => {
//       setShowModal(false);
//       setEditingSkill(null);
//       await fetchSkills();
//       showSuccess("Skill added!");
//     };
//     window.addEventListener("skillAdded", onSkillAdded);
//     return () => window.removeEventListener("skillAdded", onSkillAdded);
//   }, []);

//   /* -------------------- Render -------------------- */
//   return (
//     <div className="p-6 sm:p-8 bg-[#F7F4EA] rounded-2xl shadow-md min-h-[80vh] border border-[#A8BBA3]/60">
//       <style>{`
//         .skill-popup { background: #F7EFE5; border-radius: 20px; padding: 22px; border: 1px solid #D8C7B2; box-shadow: 0px 14px 40px rgba(9,30,66,0.08); animation: popupShow 220ms ease-out;}
//         @keyframes popupShow { from { opacity: 0; transform: scale(0.985); } to { opacity: 1; transform: scale(1); } }
//         .skill-popup h2, .skill-popup h3 { color: #8B5E34; font-weight: 700; }
//         .skill-popup .left-box { background: #FFF9F4; border: 1px solid #E6D5C3; border-radius: 12px; padding: 18px; }
//         .skill-popup .preview-box { background: #FBF7F2; border: 1px solid #E6D5C3; border-radius: 12px; padding: 18px; }
//         .skill-popup input, .skill-popup select, .skill-popup textarea { background: #FFFFFF; border: 1px solid #C8B8A6; padding: 10px 12px; border-radius: 8px; width: 100%; outline: none; transition: 0.18s; }
//         .skill-popup input:focus, .skill-popup select:focus, .skill-popup textarea:focus { border-color: #B27744; box-shadow: 0 0 0 4px rgba(178,119,68,0.08); }
//         .btn-brown { background: #B27744 !important; color: white !important; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .btn-brown:hover { background: #8B5E34 !important; }
//         .btn-light-brown { background: #EFE3D8; color: #6C4A2F; padding: 10px 16px; border-radius: 8px; font-weight: 600; }
//         .btn-blue { background: #4A67FF; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .btn-green { background: #2E8B57; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .image-preview-box { border: 1px solid #D8C7B2; background: #FFF; border-radius: 10px; height: 170px; display:flex; align-items:center; justify-content:center; color:#A38D78; font-size:14px; }
//       `}</style>

//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h2 className="text-2xl font-semibold text-[#B87C4C]">My Skills</h2>
//           <p className="text-sm text-gray-600">Manage your skills, certificates and topics PDFs</p>
//         </div>

//         <button
//           onClick={openAddModal}
//           className="inline-flex items-center gap-2 bg-[#B87C4C] text-white px-4 py-2 rounded-md shadow hover:bg-[#8E5C32] transition"
//         >
//           <FiPlus /> Add Skill
//         </button>
//       </div>

//       {successMsg && (
//         <div className="mb-4 px-4 py-2 rounded-md bg-[#A8BBA3]/20 text-[#31513A] border border-[#A8BBA3]/60 text-sm">
//           {successMsg}
//         </div>
//       )}

//       {loading ? (
//         <p className="text-center text-gray-500">Loading...</p>
//       ) : skills.length === 0 ? (
//         <div className="flex flex-col items-center mt-10 opacity-80">
//           <img
//             alt="empty"
//             src="https://cdn-icons-png.flaticon.com/512/4072/4072183.png"
//             className="w-24 mb-4"
//           />
//           <p className="text-lg text-gray-600 italic">No skills added yet.</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {skills.map((s) => (
//             <div
//               key={s._id}
//               className={`grid grid-cols-12 gap-6 items-center p-5 rounded-xl border shadow-sm transition transform hover:scale-[1.002] ${isUnavailable(s)
//                   ? "bg-[#E5DED3] border-[#C0A890]"
//                   : "bg-[#A8BBA3]/35 border-[#A8BBA3]"
//                 }`}>
//               <div className="col-span-1 flex items-center justify-center">
//                 <div
//                   className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${isUnavailable(s)
//                       ? "bg-gray-300 text-gray-700"
//                       : "bg-[#B87C4C]/15 text-[#B87C4C]"
//                     }`}
//                 >
//                   📘
//                 </div>
//               </div>

//               <div className="col-span-7 space-y-4">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <div className="flex items-center gap-3 flex-wrap">
//                       <h3 className="text-lg font-semibold text-gray-900">
//                         {s.SkillName || (s.SkillId && (s.SkillId.Name || s.SkillId)) || "Unknown Skill"}
//                       </h3>
//                       {s.CategoryName && (
//                         <span className="text-[11px] font-semibold text-[#B87C4C] bg-[#F7F4EA] px-2 py-0.5 rounded-full">
//                           {s.CategoryName}
//                         </span>
//                       )}
//                     </div>

//                     <p className="text-sm text-gray-700 mt-1">
//                       <span className="font-medium">Source:</span> {s.Source || "N/A"}
//                     </p>
//                   </div>

//                   <div
//                     className={`text-sm font-semibold mt-1 px-3 py-1 rounded-full ${isUnavailable(s) ? "bg-gray-400 text-white" : "bg-[#B87C4C]/90 text-white"
//                       }`}
//                   >
//                     {isUnavailable(s) ? "Unavailable" : "Available"}
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="flex items-center gap-4">
//                     <span className="w-32 text-sm font-medium text-gray-700">Certificate:</span>
//                     {s.CertificateURL ? (
//                       <a
//                         href={`${API_BASE}${s.CertificateURL}`}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="flex items-center gap-2 text-[#B87C4C] hover:text-[#8E5C32] transition text-sm"
//                       >
//                         <FiDownload /> View Certificate
//                       </a>
//                     ) : (
//                       <span className="text-sm text-red-600 flex items-center gap-2">
//                         <FiFileText /> Not uploaded
//                       </span>
//                     )}
//                   </div>

//                   <div className="flex items-center gap-4">
//                     <span className="w-32 text-sm font-medium text-gray-700">Topics PDF:</span>
//                     {s.ContentFileURL ? (
//                       <a
//                         href={`${API_BASE}${s.ContentFileURL}`}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="flex items-center gap-2 text-[#B87C4C] hover:text-[#8E5C32] transition text-sm"
//                       >
//                         <FiBookOpen /> View Topics PDF
//                       </a>
//                     ) : (
//                       <span className="text-sm text-gray-500 flex items-center gap-2">
//                         <FiBookOpen /> Not uploaded
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="col-span-4 flex justify-end gap-3">
//                 {isUnavailable(s) ? (
//                   <button
//                     onClick={() => handleReactivate(s._id)}
//                     className="inline-flex items-center gap-2 px-4 py-2 bg-[#A8BBA3]/25 text-[#31513A] border border-[#A8BBA3] rounded-md hover:bg-[#A8BBA3]/45 transition text-sm"
//                   >
//                     <FiRefreshCw /> Reactivate
//                   </button>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => openEditModal(s)}
//                       className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#CBBFAE] rounded-md shadow hover:bg-[#F7F4EA] hover:border-[#B87C4C] transition text-sm"
//                     >
//                       <FiEdit /> Edit
//                     </button>

//                     <button
//                       onClick={() => handleDisable(s._id)}
//                       className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 transition text-sm"
//                     >
//                       <FiTrash2 /> Disable
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {showModal && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center px-4"
//           aria-modal="true"
//           role="dialog"
//           onClick={() => {
//             setShowModal(false);
//             setEditingSkill(null);
//           }}
//         >
//           <div
//             className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//             aria-hidden="true"
//           />

//           <div
//             className="relative w-full max-w-4xl mx-4 transform transition-all duration-300 scale-100"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div
//               className="bg-white rounded-2xl shadow-2xl border p-6 overflow-auto"
//               style={{ maxHeight: "90vh" }}
//             >
//               <div className="
//   rounded-t-2xl
//   px-6 py-5
//   shadow-md
//   border border-[#e8d8c8]
//   bg-gradient-to-r from-[#B17847] to-[#A66A3A]
//   text-white
// ">
//                 <h3 className="text-2xl font-bold">
//                   {modalMode === "edit" ? "Edit Skill" : "Add New Skill"}
//                 </h3>
//                 <p className="text-sm opacity-90 mt-1">
//                   Manage your skill details easily
//                 </p>
//               </div>

//               {modalMode === "add" ? (
//                 <div className="modal-content w-full" onClick={(e) => e.stopPropagation()}>
//                   <style>{`
//       .modal-content header, .modal-content .header, .modal-content .site-header, .modal-content .navbar, .modal-content .topbar, .modal-content footer, .modal-content .site-footer, .modal-content .app-footer { display: none !important; }
//       .modal-content .modal-inner { display: block; width: 100%; box-sizing: border-box; }
//       .modal-content .modal-inner img, .modal-content .modal-inner input, .modal-content .modal-inner select, .modal-content .modal-inner textarea, .modal-content .modal-inner button { box-sizing: border-box; }
//     `}</style>

//                   <div className="modal-inner">
//                     <AddSkill
//                       inline={true}
//                       userId={userId}
//                       onDone={async () => {
//                         setShowModal(false);
//                         await fetchSkills();
//                         setEditingSkill(null);
//                         showSuccess("Skill added!");
//                       }}
//                     />

//                     <div className="mt-4 flex justify-end gap-3">
//                       <button
//                         onClick={() => {
//                           setShowModal(false);
//                           setEditingSkill(null);
//                         }}
//                         className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
//                       >
//                         Close
//                       </button>

//                       <button
//                         onClick={async () => {
//                           setShowModal(false);
//                           setEditingSkill(null);
//                           await fetchSkills();
//                           showSuccess("List refreshed");
//                         }}
//                         className="px-4 py-2 rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32]"
//                       >
//                         Done
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <form onSubmit={handleSubmit} className="space-y-6">
//                   {!editingSkill ? null : (
//                     <>
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Category
//                         </label>
//                         <select
//                           value={String(formData.CategoryId || "")}
//                           onChange={(e) => handleCategoryChange(e.target.value)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 focus:outline-none bg-white/80"
//                         >
//                           <option value="">Select Category</option>
//                           {categories.map((c) => {
//                             // prefer numeric CategoryId (server expects CategoryId), fallback to Mongo _id if not present
//                             const optVal = String(c.CategoryId ?? c._id ?? "");
//                             return (
//                               <option key={optVal} value={optVal}>
//                                 {c.CategoryName || c.name || "Unnamed Category"}
//                               </option>
//                             );
//                           })}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Skill
//                         </label>
//                         <select
//                           value={String(formData.SkillId || "")}
//                           onChange={(e) => setFormData((p) => ({ ...p, SkillId: String(e.target.value) }))}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                           required
//                         >
//                           <option value="">Select Skill</option>
//                           {skillsByCategory.map((sk) => (
//                             <option key={sk.id} value={sk.id}>
//                               {sk.name}
//                             </option>
//                           ))}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Certificate Source
//                         </label>
//                         <input
//                           type="text"
//                           placeholder="Enter certificate source (optional)"
//                           value={formData.Source}
//                           onChange={(e) => setFormData((p) => ({ ...p, Source: e.target.value }))}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Certificate (PDF)
//                         </label>
//                         <input
//                           type="file"
//                           accept="application/pdf"
//                           onChange={(e) => onCertificateChange(e.target.files[0] || null)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                         {editingSkill && editingSkill.CertificateURL && (
//                           <p className="text-sm mt-1">
//                             Current: {" "}
//                             <a
//                               href={`${API_BASE}${editingSkill.CertificateURL}`}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="text-[#B87C4C] hover:underline"
//                             >
//                               View
//                             </a>
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           New Topics PDF (optional)
//                         </label>
//                         <input
//                           type="file"
//                           accept="application/pdf"
//                           onChange={(e) => onContentFileChange(e.target.files[0] || null)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                         {editingSkill && editingSkill.ContentFileURL && (
//                           <p className="text-sm mt-1">
//                             Current Topics PDF: {" "}
//                             <a
//                               href={`${API_BASE}${editingSkill.ContentFileURL}`}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="text-[#B87C4C] hover:underline"
//                             >
//                               View
//                             </a>
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Edit PDF Content
//                         </label>

//                         {loadingPdf ? (
//                           <p className="text-gray-500 text-sm">Loading PDF content...</p>
//                         ) : (
//                           <>
//                             <textarea
//                               className="w-full border border-[#CBBFAE] px-3 py-2 h-48 rounded-md bg-white/80"
//                               value={pdfText}
//                               onChange={(e) => setPdfText(e.target.value)}
//                             />

//                             <div className="mt-4 p-3 border bg-white rounded">
//                               <h4 className="text-md font-semibold text-gray-700">Live Preview</h4>
//                               <div className="text-sm text-gray-800 whitespace-pre-line mt-2">
//                                 {pdfText || "Start typing to generate preview..."}
//                               </div>
//                             </div>
//                           </>
//                         )}
//                       </div>

//                       {error && <p className="text-red-600 text-sm">{error}</p>}

//                       <button
//                         type="submit"
//                         className="w-full py-3 text-lg font-semibold rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32] transition"
//                       >
//                         Update Skill
//                       </button>
//                     </>
//                   )}
//                 </form>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// // }
// // src/pages/MySkill.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   FiPlus,
//   FiEdit,
//   FiTrash2,
//   FiBookOpen,
//   FiDownload,
//   FiRefreshCw,
//   FiFileText,
// } from "react-icons/fi";
// import AddSkill from "./AddSkill";

// const API_BASE = "http://localhost:4000";
// const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

// export default function MySkill({ userId }) {
//   const [skills, setSkills] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [showModal, setShowModal] = useState(false);
//   const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
//   const [editingSkill, setEditingSkill] = useState(null);

//   const [categories, setCategories] = useState([]);
//   const [skillsByCategory, setSkillsByCategory] = useState([]); // normalized: { id, name, raw }
//   const [successMsg, setSuccessMsg] = useState("");
//   const [pdfText, setPdfText] = useState("");
//   const [loadingPdf, setLoadingPdf] = useState(false);

//   const [formData, setFormData] = useState({
//     CategoryId: "",
//     SkillId: "",
//     Source: "",
//     Certificate: null,
//     ContentFile: null,
//   });

//   const [error, setError] = useState("");

//   const showSuccess = (msg) => {
//     setSuccessMsg(msg);
//     setTimeout(() => setSuccessMsg(""), 2500);
//   };

//   /* -------------------- fetch user skills -------------------- */
//   const fetchSkills = async () => {
//     if (!userId) return;
//     setLoading(true);
//     try {
//       const res = await axios.get(`${API_BASE}/api/myskills/${userId}`);
//       const data = res.data?.data || res.data?.skills || res.data || [];
//       setSkills(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Error fetching user skills:", err);
//       setSkills([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSkills();
//   }, [userId]);

//   // ensure pdfText is always in sync with the editingSkill
//   useEffect(() => {
//     let cancelled = false;

//     const loadPdf = async () => {
//       if (!editingSkill || !editingSkill._id) {
//         setPdfText("");
//         return;
//       }

//       setLoadingPdf(true);
//       try {
//         const res = await axios.get(`${API_BASE}/api/myskills/content/${editingSkill._id}`);
//         if (cancelled) return;
//         setPdfText(res?.data?.text || "");
//       } catch (err) {
//         if (!cancelled) {
//           console.warn("Could not load pdfText for editingSkill:", err?.message || err);
//           setPdfText("");
//         }
//       } finally {
//         if (!cancelled) setLoadingPdf(false);
//       }
//     };

//     loadPdf();
//     return () => { cancelled = true; };
//   }, [editingSkill?._id]);

//   /* -------------------- UX effects -------------------- */
//   useEffect(() => {
//     document.body.style.overflow = showModal ? "hidden" : "auto";
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, [showModal]);

//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === "Escape") {
//         setShowModal(false);
//         setEditingSkill(null);
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, []);

//   /* -------------------- fetch categories -------------------- */
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/api/users/categories`);
//         const data = Array.isArray(res.data)
//           ? res.data
//           : res.data?.data || res.data || [];
//         setCategories(Array.isArray(data) ? data : []);
//       } catch (err) {
//         console.error("Error loading categories:", err);
//         setCategories([]);
//       }
//     };
//     loadCategories();
//   }, []);

//   /* --------------------
//      handleCategoryChange
//      - normalizes returned skills into { id, name, raw } so selects are consistent
//      - accepts optional presetSkillId to auto-select after load
//   -------------------- */
//   const handleCategoryChange = async (categoryId, presetSkillId = "") => {
//     const catIdStr = categoryId ? String(categoryId) : "";
//     setFormData((p) => ({ ...p, CategoryId: catIdStr, SkillId: "" }));
//     setSkillsByCategory([]);
//     if (!catIdStr) return [];

//     try {
//       const res = await axios.get(`${API_BASE}/api/users/skills/category/${catIdStr}`);
//       const raw = Array.isArray(res.data) ? res.data : res.data?.data || res.data || [];
//       const normalized = (raw || []).map((sk) => {
//         const id = sk.SkillId ?? sk._id ?? sk.id ?? "";
//         const name = sk.Name || sk.SkillName || sk.name || "Unnamed Skill";
//         return { id: String(id), name, raw: sk };
//       });
//       setSkillsByCategory(normalized);

//       if (presetSkillId) {
//         let rawPreset = "";
//         if (typeof presetSkillId === "object" && presetSkillId !== null) {
//           rawPreset = presetSkillId._id || presetSkillId.SkillId || "";
//         } else {
//           rawPreset = presetSkillId || "";
//         }
//         const presetStr = String(rawPreset);
//         const found = normalized.find((n) => n.id === presetStr);
//         setFormData((p) => ({ ...p, SkillId: found ? found.id : presetStr }));
//       }

//       return normalized;
//     } catch (err) {
//       console.error("Error loading skills for category:", err);
//       setSkillsByCategory([]);
//       return [];
//     }
//   };

//   /* -------------------- open add modal -------------------- */
//   const openAddModal = () => {
//     setModalMode("add");
//     setEditingSkill(null);
//     setFormData({
//       CategoryId: "",
//       SkillId: "",
//       Source: "",
//       Certificate: null,
//       ContentFile: null,
//     });
//     setSkillsByCategory([]);
//     setError("");
//     setShowModal(true);
//   };

//   /* -------------------- open edit modal (fixed binding) -------------------- */
//   const openEditModal = async (item) => {
//     setModalMode("edit");
//     setEditingSkill(item);

//     // normalize category id
//     let normalizedCategoryId = "";
//     if (!item) {
//       normalizedCategoryId = "";
//     } else {
//       if (item.CategoryId && typeof item.CategoryId === "object" && item.CategoryId !== null) {
//         normalizedCategoryId =
//           (item.CategoryId.CategoryId !== undefined && item.CategoryId.CategoryId !== null)
//             ? item.CategoryId.CategoryId
//             : (item.CategoryId._id || "");
//       } else if (item.Category && typeof item.Category === "object" && item.Category !== null) {
//         normalizedCategoryId =
//           (item.Category.CategoryId !== undefined && item.Category.CategoryId !== null)
//             ? item.Category.CategoryId
//             : (item.Category._id || "");
//       } else {
//         if (item.CategoryId !== undefined && item.CategoryId !== null) normalizedCategoryId = item.CategoryId;
//         else if (item.Category !== undefined && item.Category !== null) normalizedCategoryId = item.Category;
//         else if (item.categoryId !== undefined && item.categoryId !== null) normalizedCategoryId = item.categoryId;
//         else normalizedCategoryId = "";
//       }
//     }
//     normalizedCategoryId = normalizedCategoryId ? String(normalizedCategoryId) : "";

//     // normalize skill id
//     let normalizedSkillId = "";
//     if (item && item.SkillId && typeof item.SkillId === "object" && item.SkillId !== null) {
//       normalizedSkillId =
//         (item.SkillId.SkillId !== undefined && item.SkillId.SkillId !== null)
//           ? item.SkillId.SkillId
//           : (item.SkillId._id || "");
//     } else {
//       if (item && item.SkillId !== undefined && item.SkillId !== null) normalizedSkillId = item.SkillId;
//       else if (item && item.Skill !== undefined && item.Skill !== null) normalizedSkillId = item.Skill;
//       else if (item && item.skillId !== undefined && item.skillId !== null) normalizedSkillId = item.skillId;
//       else if (item && item.skill !== undefined && item.skill !== null) normalizedSkillId = item.skill;
//       else normalizedSkillId = "";
//     }
//     normalizedSkillId = normalizedSkillId ? String(normalizedSkillId) : "";

//     setFormData({
//       CategoryId: normalizedCategoryId || "",
//       SkillId: "",
//       Source: item && item.Source ? item.Source : "",
//       Certificate: null,
//       ContentFile: null,
//     });
//     setError("");
//     setShowModal(true);

//     // load PDF content preview
//     setLoadingPdf(true);
//     try {
//       const res = await axios.get(`${API_BASE}/api/myskills/content/${item._id}`);
//       setPdfText(res && res.data && res.data.text ? res.data.text : "");
//     } catch (e) {
//       setPdfText("");
//       console.warn("Could not read PDF content:", e && e.message ? e.message : e);
//     }
//     setLoadingPdf(false);

//     // load skills for this category and set SkillId
//     if (normalizedCategoryId) {
//       await handleCategoryChange(normalizedCategoryId, normalizedSkillId);
//       return;
//     }

//     // if category missing but skill present, try to find category
//     if (normalizedSkillId && Array.isArray(categories) && categories.length > 0) {
//       try {
//         let foundCategoryId = "";
//         for (let i = 0; i < categories.length; i++) {
//           const c = categories[i];
//           const catVal = String((c.CategoryId !== undefined && c.CategoryId !== null) ? c.CategoryId : (c._id || ""));
//           if (!catVal) continue;
//           try {
//             const resp = await axios.get(`${API_BASE}/api/users/skills/category/${catVal}`);
//             const skillsRaw = Array.isArray(resp.data) ? resp.data : (resp.data && resp.data.data ? resp.data.data : resp.data || []);
//             for (let k = 0; k < skillsRaw.length; k++) {
//               const sk = skillsRaw[k];
//               const skId = (sk.SkillId !== undefined && sk.SkillId !== null) ? String(sk.SkillId) : (sk._id ? String(sk._id) : "");
//               if (skId === normalizedSkillId) {
//                 foundCategoryId = catVal;
//                 break;
//               }
//             }
//             if (foundCategoryId) break;
//           } catch (innerErr) {
//             console.warn(`Failed to load skills for category ${catVal}:`, innerErr && innerErr.message ? innerErr.message : innerErr);
//           }
//         }

//         if (foundCategoryId) {
//           await handleCategoryChange(foundCategoryId, normalizedSkillId);
//           setFormData((p) => ({ ...p, CategoryId: String(foundCategoryId) }));
//           return;
//         }
//       } catch (err) {
//         console.warn("Error while trying to auto-find category for skill:", err && err.message ? err.message : err);
//       }
//     }

//     // fallback
//     setSkillsByCategory([]);
//     setFormData((p) => ({ ...p, SkillId: normalizedSkillId || "" }));
//   };

//   /* -------------------- file validation -------------------- */
//   const validatePdfFile = (file) => {
//     if (!file) return { ok: true };
//     if (file.type !== "application/pdf") {
//       return { ok: false, msg: "Only PDF files are allowed." };
//     }
//     if (file.size > MAX_PDF_BYTES) {
//       return {
//         ok: false,
//         msg: `PDF must be ${MAX_PDF_BYTES / (1024 * 1024)} MB or smaller.`,
//       };
//     }
//     return { ok: true };
//   };

//   /* -------------------- submit (edit) -------------------- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!editingSkill && !formData.SkillId) {
//       setError("Please select a skill.");
//       return;
//     }

//     const certValidation = validatePdfFile(formData.Certificate);
//     if (!certValidation.ok) {
//       setError(certValidation.msg);
//       return;
//     }
//     const contentValidation = validatePdfFile(formData.ContentFile);
//     if (!contentValidation.ok) {
//       setError(contentValidation.msg);
//       return;
//     }

//     try {
//       const fd = new FormData();
//       fd.append("UserId", userId);
//       if (formData.SkillId) fd.append("SkillId", formData.SkillId);
//       if (formData.Source) fd.append("Source", formData.Source);
//       if (formData.Certificate) fd.append("Certificate", formData.Certificate);
//       if (formData.ContentFile) fd.append("ContentFile", formData.ContentFile);
//       if (editingSkill) {
//         fd.append("EditedText", pdfText);
//       }

//       if (editingSkill) {
//         await axios.put(`${API_BASE}/api/myskills/${editingSkill._id}`, fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         showSuccess("Skill updated successfully! ✨");
//       } else {
//         await axios.post(`${API_BASE}/api/myskills`, fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         showSuccess("Skill added successfully! 🎉");
//       }

//       await fetchSkills();
//       setShowModal(false);
//       setEditingSkill(null);
//     } catch (err) {
//       console.error("Error saving skill:", err);
//       const msg = err.response?.data?.message || "Server error while saving skill.";
//       setError(msg);
//     }
//   };

//   const handleDisable = async (id) => {
//     if (!window.confirm("Are you sure you want to disable this skill?")) return;
//     try {
//       const res = await axios.put(`${API_BASE}/api/myskills/disable/${id}`);
//       if (!res.data?.success) {
//         alert(res.data.message || "Cannot disable skill at this time.");
//         return;
//       }
//       showSuccess("Skill disabled (set to Unavailable).");
//       await fetchSkills();
//     } catch (err) {
//       console.error("Error disabling skill:", err);
//       alert("Error disabling skill");
//     }
//   };

//   const handleReactivate = async (id) => {
//     try {
//       const res = await axios.put(`${API_BASE}/api/myskills/reactivate/${id}`);
//       if (!res.data?.success) {
//         alert(res.data?.message || "Could not reactivate skill");
//         return;
//       }
//       showSuccess("Skill reactivated!");
//       await fetchSkills();
//     } catch (err) {
//       console.error("Error reactivating skill:", err);
//       alert("Error reactivating skill");
//     }
//   };

//   const onCertificateChange = (file) => {
//     setFormData((p) => ({ ...p, Certificate: file }));
//   };
//   const onContentFileChange = (file) => {
//     setFormData((p) => ({ ...p, ContentFile: file }));
//   };

//   const isUnavailable = (s) =>
//     s?.Status === "Unavailable" || s?.SkillAvailability === "Unavailable";

//   useEffect(() => {
//     const onSkillAdded = async (ev) => {
//       // allow event.detail usage or simple signal
//       setShowModal(false);
//       setEditingSkill(null);
//       await fetchSkills();
//       showSuccess("Skill added!");
//     };
//     window.addEventListener("skillAdded", onSkillAdded);
//     return () => window.removeEventListener("skillAdded", onSkillAdded);
//   }, []);

//   /* -------------------- Render -------------------- */
//   return (
//     <div className="p-6 sm:p-8 bg-[#F7F4EA] rounded-2xl shadow-md min-h-[80vh] border border-[#A8BBA3]/60">
//       <style>{`
//         .skill-popup { background: #F7EFE5; border-radius: 20px; padding: 22px; border: 1px solid #D8C7B2; box-shadow: 0px 14px 40px rgba(9,30,66,0.08); animation: popupShow 220ms ease-out;}
//         @keyframes popupShow { from { opacity: 0; transform: scale(0.985); } to { opacity: 1; transform: scale(1); } }
//         .skill-popup h2, .skill-popup h3 { color: #8B5E34; font-weight: 700; }
//         .skill-popup .left-box { background: #FFF9F4; border: 1px solid #E6D5C3; border-radius: 12px; padding: 18px; }
//         .skill-popup .preview-box { background: #FBF7F2; border: 1px solid #E6D5C3; border-radius: 12px; padding: 18px; }
//         .skill-popup input, .skill-popup select, .skill-popup textarea { background: #FFFFFF; border: 1px solid #C8B8A6; padding: 10px 12px; border-radius: 8px; width: 100%; outline: none; transition: 0.18s; }
//         .skill-popup input:focus, .skill-popup select:focus, .skill-popup textarea:focus { border-color: #B27744; box-shadow: 0 0 0 4px rgba(178,119,68,0.08); }
//         .btn-brown { background: #B27744 !important; color: white !important; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .btn-brown:hover { background: #8B5E34 !important; }
//         .btn-light-brown { background: #EFE3D8; color: #6C4A2F; padding: 10px 16px; border-radius: 8px; font-weight: 600; }
//         .btn-blue { background: #4A67FF; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .btn-green { background: #2E8B57; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
//         .image-preview-box { border: 1px solid #D8C7B2; background: #FFF; border-radius: 10px; height: 170px; display:flex; align-items:center; justify-content:center; color:#A38D78; font-size:14px; }
//       `}</style>

//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h2 className="text-2xl font-semibold text-[#B87C4C]">My Skills</h2>
//           <p className="text-sm text-gray-600">Manage your skills, certificates and topics PDFs</p>
//         </div>

//         <button
//           onClick={openAddModal}
//           className="inline-flex items-center gap-2 bg-[#B87C4C] text-white px-4 py-2 rounded-md shadow hover:bg-[#8E5C32] transition"
//         >
//           <FiPlus /> Add Skill
//         </button>
//       </div>

//       {successMsg && (
//         <div className="mb-4 px-4 py-2 rounded-md bg-[#A8BBA3]/20 text-[#31513A] border border-[#A8BBA3]/60 text-sm">
//           {successMsg}
//         </div>
//       )}

//       {loading ? (
//         <p className="text-center text-gray-500">Loading...</p>
//       ) : skills.length === 0 ? (
//         <div className="flex flex-col items-center mt-10 opacity-80">
//           <img
//             alt="empty"
//             src="https://cdn-icons-png.flaticon.com/512/4072/4072183.png"
//             className="w-24 mb-4"
//           />
//           <p className="text-lg text-gray-600 italic">No skills added yet.</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {skills.map((s) => (
//             <div
//               key={s._id}
//               className={`grid grid-cols-12 gap-6 items-center p-5 rounded-xl border shadow-sm transition transform hover:scale-[1.002] ${isUnavailable(s)
//                   ? "bg-[#E5DED3] border-[#C0A890]"
//                   : "bg-[#A8BBA3]/35 border-[#A8BBA3]"
//                 }`}
//             >
//               <div className="col-span-1 flex items-center justify-center">
//                 <div
//                   className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${isUnavailable(s)
//                       ? "bg-gray-300 text-gray-700"
//                       : "bg-[#B87C4C]/15 text-[#B87C4C]"
//                     }`}
//                 >
//                   📘
//                 </div>
//               </div>

//               <div className="col-span-7 space-y-4">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <div className="flex items-center gap-3 flex-wrap">
//                       <h3 className="text-lg font-semibold text-gray-900">
//                         {s.SkillName || (s.SkillId && (s.SkillId.Name || s.SkillId)) || "Unknown Skill"}
//                       </h3>
//                       {s.CategoryName && (
//                         <span className="text-[11px] font-semibold text-[#B87C4C] bg-[#F7F4EA] px-2 py-0.5 rounded-full">
//                           {s.CategoryName}
//                         </span>
//                       )}
//                     </div>

//                     <p className="text-sm text-gray-700 mt-1">
//                       <span className="font-medium">Source:</span> {s.Source || "N/A"}
//                     </p>
//                   </div>

//                   <div
//                     className={`text-sm font-semibold mt-1 px-3 py-1 rounded-full ${isUnavailable(s) ? "bg-gray-400 text-white" : "bg-[#B87C4C]/90 text-white"
//                       }`}
//                   >
//                     {isUnavailable(s) ? "Unavailable" : "Available"}
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="flex items-center gap-4">
//                     <span className="w-32 text-sm font-medium text-gray-700">Certificate:</span>
//                     {s.CertificateURL ? (
//                       <a
//                         href={`${API_BASE}${s.CertificateURL}`}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="flex items-center gap-2 text-[#B87C4C] hover:text-[#8E5C32] transition text-sm"
//                       >
//                         <FiDownload /> View Certificate
//                       </a>
//                     ) : (
//                       <span className="text-sm text-red-600 flex items-center gap-2">
//                         <FiFileText /> Not uploaded
//                       </span>
//                     )}
//                   </div>

//                   <div className="flex items-center gap-4">
//                     <span className="w-32 text-sm font-medium text-gray-700">Topics PDF:</span>
//                     {s.ContentFileURL ? (
//                       <a
//                         href={`${API_BASE}${s.ContentFileURL}`}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="flex items-center gap-2 text-[#B87C4C] hover:text-[#8E5C32] transition text-sm"
//                       >
//                         <FiBookOpen /> View Topics PDF
//                       </a>
//                     ) : (
//                       <span className="text-sm text-gray-500 flex items-center gap-2">
//                         <FiBookOpen /> Not uploaded
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="col-span-4 flex justify-end gap-3">
//                 {isUnavailable(s) ? (
//                   <button
//                     onClick={() => handleReactivate(s._id)}
//                     className="inline-flex items-center gap-2 px-4 py-2 bg-[#A8BBA3]/25 text-[#31513A] border border-[#A8BBA3] rounded-md hover:bg-[#A8BBA3]/45 transition text-sm"
//                   >
//                     <FiRefreshCw /> Reactivate
//                   </button>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => openEditModal(s)}
//                       className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#CBBFAE] rounded-md shadow hover:bg-[#F7F4EA] hover:border-[#B87C4C] transition text-sm"
//                     >
//                       <FiEdit /> Edit
//                     </button>

//                     <button
//                       onClick={() => handleDisable(s._id)}
//                       className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 transition text-sm"
//                     >
//                       <FiTrash2 /> Disable
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {showModal && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center px-4"
//           aria-modal="true"
//           role="dialog"
//           onClick={() => {
//             setShowModal(false);
//             setEditingSkill(null);
//           }}
//         >
//           <div
//             className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//             aria-hidden="true"
//           />

//           <div
//             className="relative w-full max-w-4xl mx-4 transform transition-all duration-300 scale-100"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div
//               className="bg-white rounded-2xl shadow-2xl border p-6 overflow-auto"
//               style={{ maxHeight: "90vh" }}
//             >
//               <div className="
//   rounded-t-2xl
//   px-6 py-5
//   shadow-md
//   border border-[#e8d8c8]
//   bg-gradient-to-r from-[#B17847] to-[#A66A3A]
//   text-white
// ">
//                 <h3 className="text-2xl font-bold">
//                   {modalMode === "edit" ? "Edit Skill" : "Add New Skill"}
//                 </h3>
//                 <p className="text-sm opacity-90 mt-1">
//                   Manage your skill details easily
//                 </p>
//               </div>

//             {modalMode === "add" ? (
//   // simplified visible AddSkill container — higher z-index and simpler layout for debugging
//   <div className="modal-content w-full" onClick={(e) => e.stopPropagation()}>
//     <div style={{ padding: 12, background: "#fffaf0", borderRadius: 12, border: "1px solid #e6d5c3" }}>
//       <h4 className="text-lg font-semibold mb-3" style={{ color: "#8B5E34" }}>Add Skill (Debug Visible)</h4>

//       {/* Direct inline AddSkill form — this should always be visible when showModal + modalMode==='add' */}
//       <AddSkill
//         inline={true}
//         userId={userId}
//         onDone={async () => {
//           setShowModal(false);
//           await fetchSkills();
//           setEditingSkill(null);
//           showSuccess("Skill added!");
//         }}
//       />

//       <div className="mt-4 flex justify-end gap-3">
//         <button
//           onClick={() => {
//             setShowModal(false);
//             setEditingSkill(null);
//           }}
//           className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
//         >
//           Close
//         </button>

//         <button
//           onClick={async () => {
//             setShowModal(false);
//             setEditingSkill(null);
//             await fetchSkills();
//             showSuccess("List refreshed");
//           }}
//           className="px-4 py-2 rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32]"
//         >
//           Done
//         </button>
//       </div>
//     </div>
//   </div>
// ) : (
 
//                 <form onSubmit={handleSubmit} className="space-y-6">
//                   {!editingSkill ? null : (
//                     <>
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Category
//                         </label>
//                         <select
//                           value={String(formData.CategoryId || "")}
//                           onChange={(e) => handleCategoryChange(e.target.value)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 focus:outline-none bg-white/80"
//                         >
//                           <option value="">Select Category</option>
//                           {categories.map((c) => {
//                             const optVal = String(c.CategoryId ?? c._id ?? "");
//                             return (
//                               <option key={optVal} value={optVal}>
//                                 {c.CategoryName || c.name || "Unnamed Category"}
//                               </option>
//                             );
//                           })}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Skill
//                         </label>
//                         <select
//                           value={String(formData.SkillId || "")}
//                           onChange={(e) => setFormData((p) => ({ ...p, SkillId: String(e.target.value) }))}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                           required
//                         >
//                           <option value="">Select Skill</option>
//                           {skillsByCategory.map((sk) => (
//                             <option key={sk.id} value={sk.id}>
//                               {sk.name}
//                             </option>
//                           ))}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Certificate Source
//                         </label>
//                         <input
//                           type="text"
//                           placeholder="Enter certificate source (optional)"
//                           value={formData.Source}
//                           onChange={(e) => setFormData((p) => ({ ...p, Source: e.target.value }))}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Certificate (PDF)
//                         </label>
//                         <input
//                           type="file"
//                           accept="application/pdf"
//                           onChange={(e) => onCertificateChange(e.target.files[0] || null)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                         {editingSkill && editingSkill.CertificateURL && (
//                           <p className="text-sm mt-1">
//                             Current:{" "}
//                             <a
//                               href={`${API_BASE}${editingSkill.CertificateURL}`}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="text-[#B87C4C] hover:underline"
//                             >
//                               View
//                             </a>
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           New Topics PDF (optional)
//                         </label>
//                         <input
//                           type="file"
//                           accept="application/pdf"
//                           onChange={(e) => onContentFileChange(e.target.files[0] || null)}
//                           className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
//                         />
//                         {editingSkill && editingSkill.ContentFileURL && (
//                           <p className="text-sm mt-1">
//                             Current Topics PDF:{" "}
//                             <a
//                               href={`${API_BASE}${editingSkill.ContentFileURL}`}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="text-[#B87C4C] hover:underline"
//                             >
//                               View
//                             </a>
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">
//                           Edit PDF Content
//                         </label>

//                         {loadingPdf ? (
//                           <p className="text-gray-500 text-sm">Loading PDF content...</p>
//                         ) : (
//                           <>
//                             <textarea
//                               className="w-full border border-[#CBBFAE] px-3 py-2 h-48 rounded-md bg-white/80"
//                               value={pdfText}
//                               onChange={(e) => setPdfText(e.target.value)}
//                             />

//                             <div className="mt-4 p-3 border bg-white rounded">
//                               <h4 className="text-md font-semibold text-gray-700">Live Preview</h4>
//                               <div className="text-sm text-gray-800 whitespace-pre-line mt-2">
//                                 {pdfText || "Start typing to generate preview..."}
//                               </div>
//                             </div>
//                           </>
//                         )}
//                       </div>

//                       {error && <p className="text-red-600 text-sm">{error}</p>}

//                       <button
//                         type="submit"
//                         className="w-full py-3 text-lg font-semibold rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32] transition"
//                       >
//                         Update Skill
//                       </button>
//                     </>
//                   )}
//                 </form>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// src/pages/MySkill.jsx
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
} from "react-icons/fi";
import AddSkill from "./AddSkill";

const API_BASE = "http://localhost:4000";
const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

export default function MySkill({ userId }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingSkill, setEditingSkill] = useState(null);

  const [categories, setCategories] = useState([]);
  const [skillsByCategory, setSkillsByCategory] = useState([]); // normalized: { id, name, raw }
  const [successMsg, setSuccessMsg] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [loadingPdf, setLoadingPdf] = useState(false);

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
      const data = res.data?.data || res.data?.skills || res.data || [];
      setSkills(Array.isArray(data) ? data : []);
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

  // ensure pdfText is always in sync with the editingSkill
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      if (!editingSkill || !editingSkill._id) {
        setPdfText("");
        return;
      }

      setLoadingPdf(true);
      try {
        const res = await axios.get(`${API_BASE}/api/myskills/content/${editingSkill._id}`);
        if (cancelled) return;
        setPdfText(res?.data?.text || "");
      } catch (err) {
        if (!cancelled) {
          console.warn("Could not load pdfText for editingSkill:", err?.message || err);
          setPdfText("");
        }
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [editingSkill?._id]);

  /* -------------------- UX effects -------------------- */
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setEditingSkill(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* -------------------- fetch categories -------------------- */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users/categories`);
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data || [];
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  /* --------------------
     handleCategoryChange
     - normalizes returned skills into { id, name, raw } so selects are consistent
     - accepts optional presetSkillId to auto-select after load
  -------------------- */
  const handleCategoryChange = async (categoryId, presetSkillId = "") => {
    const catIdStr = categoryId ? String(categoryId) : "";
    setFormData((p) => ({ ...p, CategoryId: catIdStr, SkillId: "" }));
    setSkillsByCategory([]);
    if (!catIdStr) return [];

    try {
      const res = await axios.get(`${API_BASE}/api/users/skills/category/${catIdStr}`);
      const raw = Array.isArray(res.data) ? res.data : res.data?.data || res.data || [];
      const normalized = (raw || []).map((sk) => {
        const id = sk.SkillId ?? sk._id ?? sk.id ?? "";
        const name = sk.Name || sk.SkillName || sk.name || "Unnamed Skill";
        return { id: String(id), name, raw: sk };
      });
      setSkillsByCategory(normalized);

      if (presetSkillId) {
        let rawPreset = "";
        if (typeof presetSkillId === "object" && presetSkillId !== null) {
          rawPreset = presetSkillId._id || presetSkillId.SkillId || "";
        } else {
          rawPreset = presetSkillId || "";
        }
        const presetStr = String(rawPreset);
        const found = normalized.find((n) => n.id === presetStr);
        setFormData((p) => ({ ...p, SkillId: found ? found.id : presetStr }));
      }

      return normalized;
    } catch (err) {
      console.error("Error loading skills for category:", err);
      setSkillsByCategory([]);
      return [];
    }
  };

  /* -------------------- open add modal -------------------- */
 
//   /* -------------------- open add modal -------------------- */
  const openAddModal = () => {
    setModalMode("add");
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

  /* -------------------- open edit modal (fixed binding) -------------------- */
  const openEditModal = async (item) => {
    setModalMode("edit");
    setEditingSkill(item);

    // normalize category id
    let normalizedCategoryId = "";
    if (!item) {
      normalizedCategoryId = "";
    } else {
      if (item.CategoryId && typeof item.CategoryId === "object" && item.CategoryId !== null) {
        normalizedCategoryId =
          (item.CategoryId.CategoryId !== undefined && item.CategoryId.CategoryId !== null)
            ? item.CategoryId.CategoryId
            : (item.CategoryId._id || "");
      } else if (item.Category && typeof item.Category === "object" && item.Category !== null) {
        normalizedCategoryId =
          (item.Category.CategoryId !== undefined && item.Category.CategoryId !== null)
            ? item.Category.CategoryId
            : (item.Category._id || "");
      } else {
        if (item.CategoryId !== undefined && item.CategoryId !== null) normalizedCategoryId = item.CategoryId;
        else if (item.Category !== undefined && item.Category !== null) normalizedCategoryId = item.Category;
        else if (item.categoryId !== undefined && item.categoryId !== null) normalizedCategoryId = item.categoryId;
        else normalizedCategoryId = "";
      }
    }
    normalizedCategoryId = normalizedCategoryId ? String(normalizedCategoryId) : "";

    // normalize skill id
    let normalizedSkillId = "";
    if (item && item.SkillId && typeof item.SkillId === "object" && item.SkillId !== null) {
      normalizedSkillId =
        (item.SkillId.SkillId !== undefined && item.SkillId.SkillId !== null)
          ? item.SkillId.SkillId
          : (item.SkillId._id || "");
    } else {
      if (item && item.SkillId !== undefined && item.SkillId !== null) normalizedSkillId = item.SkillId;
      else if (item && item.Skill !== undefined && item.Skill !== null) normalizedSkillId = item.Skill;
      else if (item && item.skillId !== undefined && item.skillId !== null) normalizedSkillId = item.skillId;
      else if (item && item.skill !== undefined && item.skill !== null) normalizedSkillId = item.skill;
      else normalizedSkillId = "";
    }
    normalizedSkillId = normalizedSkillId ? String(normalizedSkillId) : "";

    setFormData({
      CategoryId: normalizedCategoryId || "",
      SkillId: "",
      Source: item && item.Source ? item.Source : "",
      Certificate: null,
      ContentFile: null,
    });
    setError("");
    setShowModal(true);

    // load PDF content preview
    setLoadingPdf(true);
    try {
      const res = await axios.get(`${API_BASE}/api/myskills/content/${item._id}`);
      setPdfText(res && res.data && res.data.text ? res.data.text : "");
    } catch (e) {
      setPdfText("");
      console.warn("Could not read PDF content:", e && e.message ? e.message : e);
    }
    setLoadingPdf(false);

    // load skills for this category and set SkillId
    if (normalizedCategoryId) {
      await handleCategoryChange(normalizedCategoryId, normalizedSkillId);
      return;
    }

    // if category missing but skill present, try to find category
    if (normalizedSkillId && Array.isArray(categories) && categories.length > 0) {
      try {
        let foundCategoryId = "";
        for (let i = 0; i < categories.length; i++) {
          const c = categories[i];
          const catVal = String((c.CategoryId !== undefined && c.CategoryId !== null) ? c.CategoryId : (c._id || ""));
          if (!catVal) continue;
          try {
            const resp = await axios.get(`${API_BASE}/api/users/skills/category/${catVal}`);
            const skillsRaw = Array.isArray(resp.data) ? resp.data : (resp.data && resp.data.data ? resp.data.data : resp.data || []);
            for (let k = 0; k < skillsRaw.length; k++) {
              const sk = skillsRaw[k];
              const skId = (sk.SkillId !== undefined && sk.SkillId !== null) ? String(sk.SkillId) : (sk._id ? String(sk._id) : "");
              if (skId === normalizedSkillId) {
                foundCategoryId = catVal;
                break;
              }
            }
            if (foundCategoryId) break;
          } catch (innerErr) {
            console.warn(`Failed to load skills for category ${catVal}:`, innerErr && innerErr.message ? innerErr.message : innerErr);
          }
        }

        if (foundCategoryId) {
          await handleCategoryChange(foundCategoryId, normalizedSkillId);
          setFormData((p) => ({ ...p, CategoryId: String(foundCategoryId) }));
          return;
        }
      } catch (err) {
        console.warn("Error while trying to auto-find category for skill:", err && err.message ? err.message : err);
      }
    }

    // fallback
    setSkillsByCategory([]);
    setFormData((p) => ({ ...p, SkillId: normalizedSkillId || "" }));
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

  /* -------------------- submit (edit) -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editingSkill && !formData.SkillId) {
      setError("Please select a skill.");
      return;
    }

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
        fd.append("EditedText", pdfText);
      }

      if (editingSkill) {
        await axios.put(`${API_BASE}/api/myskills/${editingSkill._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("Skill updated successfully! ✨");
      } else {
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
      const msg = err.response?.data?.message || "Server error while saving skill.";
      setError(msg);
    }
  };

  const handleDisable = async (id) => {
    if (!window.confirm("Are you sure you want to disable this skill?")) return;
    try {
      const res = await axios.put(`${API_BASE}/api/myskills/disable/${id}`);
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

  const onCertificateChange = (file) => {
    setFormData((p) => ({ ...p, Certificate: file }));
  };
  const onContentFileChange = (file) => {
    setFormData((p) => ({ ...p, ContentFile: file }));
  };

  const isUnavailable = (s) =>
    s?.Status === "Unavailable" || s?.SkillAvailability === "Unavailable";

  useEffect(() => {
    const onSkillAdded = async (ev) => {
      // allow event.detail usage or simple signal
      setShowModal(false);
      setEditingSkill(null);
      await fetchSkills();
      showSuccess("Skill added!");
    };
    window.addEventListener("skillAdded", onSkillAdded);
    return () => window.removeEventListener("skillAdded", onSkillAdded);
  }, []);

  /* -------------------- Debug wrapper for AddSkill -------------------- */
  const InlineAddSkillDebug = (props) => {
    try {
      return React.createElement(AddSkill, props);
    } catch (err) {
      console.error("AddSkill render error:", err);
      return (
        <div style={{
          padding: 12,
          border: "2px solid #ff6666",
          background: "#fff6f6",
          borderRadius: 8,
          color: "#800",
          fontWeight: 600
        }}>
          AddSkill failed to render — check console. Error: {String(err && err.message)}
        </div>
      );
    }
  };

  /* -------------------- Render -------------------- */
  return (
    <div className="p-6 sm:p-8 bg-[#F7F4EA] rounded-2xl shadow-md min-h-[80vh] border border-[#A8BBA3]/60">
      <style>{`
        .skill-popup { background: #F7EFE5; border-radius: 20px; padding: 22px; border: 1px solid #D8C7B2; box-shadow: 0px 14px 40px rgba(9,30,66,0.08); animation: popupShow 220ms ease-out;}
        @keyframes popupShow { from { opacity: 0; transform: scale(0.985); } to { opacity: 1; transform: scale(1); } }
        .skill-popup h2, .skill-popup h3 { color: #8B5E34; font-weight: 700; }
        .skill-popup .left-box { background: #FFF9F4; border: 1px solid #E6D5C3; border-radius: 12px; padding: 18px; }
        .skill-popup .preview-box { background: #FBF7F2; border: 1px solid #E6D5C3; border-radius: 12px; padding: 18px; }
        .skill-popup input, .skill-popup select, .skill-popup textarea { background: #FFFFFF; border: 1px solid #C8B8A6; padding: 10px 12px; border-radius: 8px; width: 100%; outline: none; transition: 0.18s; }
        .skill-popup input:focus, .skill-popup select:focus, .skill-popup textarea:focus { border-color: #B27744; box-shadow: 0 0 0 4px rgba(178,119,68,0.08); }
        .btn-brown { background: #B27744 !important; color: white !important; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
        .btn-brown:hover { background: #8B5E34 !important; }
        .btn-light-brown { background: #EFE3D8; color: #6C4A2F; padding: 10px 16px; border-radius: 8px; font-weight: 600; }
        .btn-blue { background: #4A67FF; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
        .btn-green { background: #2E8B57; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
        .image-preview-box { border: 1px solid #D8C7B2; background: #FFF; border-radius: 10px; height: 170px; display:flex; align-items:center; justify-content:center; color:#A38D78; font-size:14px; }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#B87C4C]">My Skills</h2>
          <p className="text-sm text-gray-600">Manage your skills, certificates and topics PDFs</p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-[#B87C4C] text-white px-4 py-2 rounded-md shadow hover:bg-[#8E5C32] transition"
        >
          <FiPlus /> Add Skill
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-2 rounded-md bg-[#A8BBA3]/20 text-[#31513A] border border-[#A8BBA3]/60 text-sm">
          {successMsg}
        </div>
      )}

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
              className={`grid grid-cols-12 gap-6 items-center p-5 rounded-xl border shadow-sm transition transform hover:scale-[1.002] ${isUnavailable(s)
                  ? "bg-[#E5DED3] border-[#C0A890]"
                  : "bg-[#A8BBA3]/35 border-[#A8BBA3]"
                }`}>
              <div className="col-span-1 flex items-center justify-center">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${isUnavailable(s)
                      ? "bg-gray-300 text-gray-700"
                      : "bg-[#B87C4C]/15 text-[#B87C4C]"
                    }`}
                >
                  📘
                </div>
              </div>

              <div className="col-span-7 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {s.SkillName || (s.SkillId && (s.SkillId.Name || s.SkillId)) || "Unknown Skill"}
                      </h3>
                      {s.CategoryName && (
                        <span className="text-[11px] font-semibold text-[#B87C4C] bg-[#F7F4EA] px-2 py-0.5 rounded-full">
                          {s.CategoryName}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Source:</span> {s.Source || "N/A"}
                    </p>
                  </div>

                  <div
                    className={`text-sm font-semibold mt-1 px-3 py-1 rounded-full ${isUnavailable(s) ? "bg-gray-400 text-white" : "bg-[#B87C4C]/90 text-white"
                      }`}
                  >
                    {isUnavailable(s) ? "Unavailable" : "Available"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="w-32 text-sm font-medium text-gray-700">Certificate:</span>
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

                  <div className="flex items-center gap-4">
                    <span className="w-32 text-sm font-medium text-gray-700">Topics PDF:</span>
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          aria-modal="true"
          role="dialog"
          onClick={() => {
            setShowModal(false);
            setEditingSkill(null);
          }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          <div
            className="relative w-full max-w-4xl mx-4 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border p-6 overflow-auto"
              style={{ maxHeight: "90vh" }}
            >
              <div className="
  rounded-t-2xl
  px-6 py-5
  shadow-md
  border border-[#e8d8c8]
  bg-gradient-to-r from-[#B17847] to-[#A66A3A]
  text-white
">
                <h3 className="text-2xl font-bold">
                  {modalMode === "edit" ? "Edit Skill" : "Add New Skill"}
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  Manage your skill details easily
                </p>
              </div>

         
 {modalMode === "add" ? (
                <div className="modal-content w-full" onClick={(e) => e.stopPropagation()}>
                  <style>{`
      .modal-content header, .modal-content .header, .modal-content .site-header, .modal-content .navbar, .modal-content .topbar, .modal-content footer, .modal-content .site-footer, .modal-content .app-footer { display: none !important; }
      .modal-content .modal-inner { display: block; width: 100%; box-sizing: border-box; }
      .modal-content .modal-inner img, .modal-content .modal-inner input, .modal-content .modal-inner select, .modal-content .modal-inner textarea, .modal-content .modal-inner button { box-sizing: border-box; }
    `}</style>

                  <div className="modal-inner">
                    <AddSkill
                      inline={true}
                      userId={userId}
                      onDone={async () => {
                        setShowModal(false);
                        await fetchSkills();
                        setEditingSkill(null);
                        showSuccess("Skill added!");
                      }}
                    />

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setEditingSkill(null);
                        }}
                        className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
                      >
                        Close
                      </button>

                      <button
                        onClick={async () => {
                          setShowModal(false);
                          setEditingSkill(null);
                          await fetchSkills();
                          showSuccess("List refreshed");
                        }}
                        className="px-4 py-2 rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32]"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )  : (
 
                <form onSubmit={handleSubmit} className="space-y-6">
                  {!editingSkill ? null : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={String(formData.CategoryId || "")}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 focus:outline-none bg-white/80"
                        >
                          <option value="">Select Category</option>
                          {categories.map((c) => {
                            const optVal = String(c.CategoryId ?? c._id ?? "");
                            return (
                              <option key={optVal} value={optVal}>
                                {c.CategoryName || c.name || "Unnamed Category"}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Skill
                        </label>
                        <select
                          value={String(formData.SkillId || "")}
                          onChange={(e) => setFormData((p) => ({ ...p, SkillId: String(e.target.value) }))}
                          className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
                          required
                        >
                          <option value="">Select Skill</option>
                          {skillsByCategory.map((sk) => (
                            <option key={sk.id} value={sk.id}>
                              {sk.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Certificate Source
                        </label>
                        <input
                          type="text"
                          placeholder="Enter certificate source (optional)"
                          value={formData.Source}
                          onChange={(e) => setFormData((p) => ({ ...p, Source: e.target.value }))}
                          className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Certificate (PDF)
                        </label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => onCertificateChange(e.target.files[0] || null)}
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

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          New Topics PDF (optional)
                        </label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => onContentFileChange(e.target.files[0] || null)}
                          className="w-full border border-[#CBBFAE] px-3 py-2 rounded-md focus:ring-2 focus:ring-[#B87C4C]/30 bg-white/80"
                        />
                        {editingSkill && editingSkill.ContentFileURL && (
                          <p className="text-sm mt-1">
                            Current Topics PDF: {" "}
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

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Edit PDF Content
                        </label>

                        {loadingPdf ? (
                          <p className="text-gray-500 text-sm">Loading PDF content...</p>
                        ) : (
                          <>
                            <textarea
                              className="w-full border border-[#CBBFAE] px-3 py-2 h-48 rounded-md bg-white/80"
                              value={pdfText}
                              onChange={(e) => setPdfText(e.target.value)}
                            />

                            <div className="mt-4 p-3 border bg-white rounded">
                              <h4 className="text-md font-semibold text-gray-700">Live Preview</h4>
                              <div className="text-sm text-gray-800 whitespace-pre-line mt-2">
                                {pdfText || "Start typing to generate preview..."}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {error && <p className="text-red-600 text-sm">{error}</p>}

                      <button
                        type="submit"
                        className="w-full py-3 text-lg font-semibold rounded-md bg-[#B87C4C] text-white hover:bg-[#8E5C32] transition"
                      >
                        Update Skill
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
