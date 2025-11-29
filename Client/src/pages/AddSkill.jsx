// src/pages/AddSkill.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

function AddSkill() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user) {
      alert("Please login or verify OTP first.");
      navigate("/otp-verify");
    }
  }, [user, navigate]);

  const [categories, setCategories] = useState([]);
  const [skillEntries, setSkillEntries] = useState([
    {
      CategoryId: "",
      Skills: [],
      SkillId: "",
      Certificate: null,
      Source: "",
      TemplateType: "", // "main" | "sub" | "image"
      TemplateData: null,
      TemplateImage: null,
    },
  ]);

  // default logo path (from conversation history)
  const logoUrl = "/mnt/data/babcd0c6-8a3c-4e8c-8e5b-7ac104a02d2e.png";

  // fetch categories
  useEffect(() => {
    axios
      .get("http://localhost:4000/api/users/categories")
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  // helper to fetch skills for a category
  const fetchSkillsForRow = async (index, categoryId) => {
    if (!categoryId) return;
    try {
      const res = await axios.get(
        `http://localhost:4000/api/users/skills/category/${categoryId}`
      );
      const newEntries = [...skillEntries];
      newEntries[index].Skills = res.data || [];
      newEntries[index].SkillId = "";
      setSkillEntries(newEntries);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryChange = (index, categoryId) => {
    const newEntries = [...skillEntries];
    newEntries[index].CategoryId = categoryId;
    newEntries[index].SkillId = "";
    newEntries[index].Skills = [];
    setSkillEntries(newEntries);
    fetchSkillsForRow(index, categoryId);
  };

  const handleSkillChange = (index, skillId) => {
    const newEntries = [...skillEntries];
    newEntries[index].SkillId = skillId;
    setSkillEntries(newEntries);
  };

  const handleCertificateChange = (index, file) => {
    const newEntries = [...skillEntries];
    newEntries[index].Certificate = file;
    setSkillEntries(newEntries);
  };

  const handleSourceChange = (index, value) => {
    const newEntries = [...skillEntries];
    newEntries[index].Source = value;
    setSkillEntries(newEntries);
  };

  const handleTemplateTypeChange = (index, value) => {
    const newEntries = [...skillEntries];
    newEntries[index].TemplateType = value;
    newEntries[index].TemplateData = null;
    newEntries[index].TemplateImage = null;
    setSkillEntries(newEntries);
  };

  const handleTemplateDataChange = (index, value) => {
    const newEntries = [...skillEntries];
    newEntries[index].TemplateData = value;
    setSkillEntries(newEntries);
  };

  const handleTemplateImageChange = (index, file) => {
    const newEntries = [...skillEntries];
    newEntries[index].TemplateImage = file;
    setSkillEntries(newEntries);
  };

  const addSkillRow = () => {
    if (skillEntries.length >= 5) return alert("Maximum 5 skills allowed.");
    setSkillEntries([
      ...skillEntries,
      {
        CategoryId: "",
        Skills: [],
        SkillId: "",
        Certificate: null,
        Source: "",
        TemplateType: "",
        TemplateData: null,
        TemplateImage: null,
      },
    ]);
  };

  const removeSkillRow = (index) => {
    if (skillEntries.length <= 1) return alert("At least 1 skill required.");
    const newEntries = skillEntries.filter((_, i) => i !== index);
    setSkillEntries(newEntries);
  };

  // Build payload and submit (same as your existing flow)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to add skills.");

    for (let i = 0; i < skillEntries.length; i++) {
      const s = skillEntries[i];
      if (!s.CategoryId || !s.SkillId)
        return alert(`Please select category and skill for row ${i + 1}`);
      if (!s.TemplateType) return alert(`Please select template for row ${i + 1}`);
      if (s.TemplateType === "image" && !s.TemplateImage)
        return alert(`Please upload image for template on row ${i + 1}`);
      if (s.TemplateType === "main" && !s.TemplateData)
        return alert(`Enter main topics for row ${i + 1}`);
      if (s.TemplateType === "sub" && !s.TemplateData)
        return alert(`Enter topics + subtopics for row ${i + 1}`);
    }

    try {
      const formData = new FormData();
      formData.append("UserId", user._id);

      const skillDataPayload = skillEntries.map((s) => ({
        SkillId: Number(s.SkillId),
        Source: s.Source || null,
        TemplateType: s.TemplateType,
        TemplateData: s.TemplateData || null,
      }));
      formData.append("SkillData", JSON.stringify(skillDataPayload));

      skillEntries.forEach((entry) => {
        formData.append("certificates", entry.Certificate || "");
      });

      skillEntries.forEach((entry) => {
        if (entry.TemplateImage) {
          formData.append("TemplateImages", entry.TemplateImage);
        } else {
          formData.append("TemplateImages", new Blob([]), "");
        }
      });

      await axios.post("http://localhost:4000/api/users/user-skills", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Skills added successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  // Helper: find CategoryName and SkillName for a given entry
  const getCategoryName = (catId) => {
    const c = categories.find((x) => String(x.CategoryId) === String(catId));
    return c ? c.CategoryName : "";
  };

  const getSkillNameFromRow = (entry) => {
    const s = entry.Skills?.find((x) => String(x.SkillId) === String(entry.SkillId));
    return s ? s.Name : "";
  };

  // For preview: create object URLs for template images
  const imagePreviews = useMemo(() => {
    return skillEntries.map((entry) =>
      entry.TemplateImage ? URL.createObjectURL(entry.TemplateImage) : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillEntries.map((e) => e.TemplateImage)]);

  // Render preview block for a single skill entry
  const renderPreviewForEntry = (entry, idx) => {
    const categoryName = getCategoryName(entry.CategoryId);
    const skillName = getSkillNameFromRow(entry);

    if (!entry.TemplateType) {
      return (
        <div className="p-4 text-sm text-gray-500 italic">Select a template and enter content to preview.</div>
      );
    }

    if (entry.TemplateType === "main") {
      // parse comma separated
      const topics = (entry.TemplateData || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return (
        <div>
          <h3 className="text-lg font-semibold mt-2">Main Topics</h3>
          <ul className="mt-2 list-none space-y-1">
            {topics.length ? (
              topics.map((t, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span className="text-gray-800">{t}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500 italic">No topics entered yet.</li>
            )}
          </ul>
        </div>
      );
    }

    if (entry.TemplateType === "sub") {
      // each line: Main - sub1, sub2
      const lines = (entry.TemplateData || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      return (
        <div>
          <h3 className="text-lg font-semibold mt-2">Topics Breakdown</h3>
          <div className="mt-2 space-y-3">
            {lines.length ? (
              lines.map((line, i) => {
                const [main, subs] = line.split("-");
                const subList = (subs || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                return (
                  <div key={i}>
                    <div className="font-medium text-gray-900">• {main?.trim()}</div>
                    <ul className="ml-6 mt-1 list-disc list-inside text-gray-700">
                      {subList.length ? (
                        subList.map((s, j) => <li key={j}>{s}</li>)
                      ) : (
                        <li className="text-sm text-gray-500 italic">No sub-topics</li>
                      )}
                    </ul>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 italic">No topics entered yet.</div>
            )}
          </div>
        </div>
      );
    }

    if (entry.TemplateType === "image") {
      const imgSrc = imagePreviews[idx] || null;
      return (
        <div>
          <h3 className="text-lg font-semibold mt-2">Image Preview</h3>
          <div className="mt-3 mb-3">
            {imgSrc ? (
              <img src={imgSrc} alt="Template" className="max-w-full max-h-48 object-contain rounded-md border" />
            ) : (
              <div className="w-full h-44 flex items-center justify-center bg-gray-50 border rounded-md text-sm text-gray-500">
                No image selected
              </div>
            )}
          </div>
          <h4 className="font-medium">Description</h4>
          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{entry.TemplateData || <span className="text-gray-400 italic">No description</span>}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto mt-8 px-4">
        <h2 className="text-2xl font-bold mb-6">Add Skills</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: FORM */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {skillEntries.map((entry, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-3 relative bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Skill {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSkillRow(index)}
                        className="text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <select
                    value={entry.CategoryId}
                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg mb-2"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.CategoryId} value={c.CategoryId}>
                        {c.CategoryName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={entry.SkillId}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg mb-2"
                    required
                    disabled={!entry.CategoryId}
                  >
                    <option value="">-- Select Skill --</option>
                    {entry.Skills.map((s) => (
                      <option key={s.SkillId} value={s.SkillId}>
                        {s.Name}
                      </option>
                    ))}
                  </select>

                  <label className="text-sm font-semibold text-gray-700">
                    Select Template for Content PDF <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={entry.TemplateType}
                    onChange={(e) => handleTemplateTypeChange(index, e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg mb-2"
                    required
                  >
                    <option value="">-- Select Template --</option>
                    <option value="main">Main Topics Only</option>
                    <option value="sub">Main Topics + Sub-topics</option>
                    <option value="image">Image + Description</option>
                  </select>

                  {/* TEMPLATE FIELDS */}
                  {entry.TemplateType === "main" && (
                    <>
                      <label className="text-sm font-semibold">Main Topics (comma separated)</label>
                      <textarea
                        className="border w-full p-3 rounded mb-2"
                        style={{ minHeight: "180px" }}
                        placeholder={`Enter main topics separated by commas. Example:\n\nIntroduction, Data Types, Joins, Functions`}
                        value={entry.TemplateData || ""}
                        onChange={(e) => handleTemplateDataChange(index, e.target.value)}
                        required
                      />
                    </>
                  )}

                  {entry.TemplateType === "sub" && (
                    <>
                      <label className="text-sm font-semibold">Topics + Sub-topics (one per line)</label>
                      <textarea
                        className="border w-full p-3 rounded mb-2"
                        style={{ minHeight: "220px" }}
                        placeholder={`Enter each topic on new line in this format:\nMain Topic - Subtopic 1, Subtopic 2\n\nExample:\nIntroduction to MySQL - What is MySQL, Features, Use Cases\nDatabase Basics - DBMS Concepts, RDBMS, ACID Properties`}
                        value={entry.TemplateData || ""}
                        onChange={(e) => handleTemplateDataChange(index, e.target.value)}
                        required
                      />
                    </>
                  )}

                  {entry.TemplateType === "image" && (
                    <>
                      <label className="text-sm font-semibold">Upload Image (required)</label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => handleTemplateImageChange(index, e.target.files[0])}
                        className="border px-2 py-1 rounded w-full mb-2"
                      />
                      <label className="text-sm font-semibold">Image Description</label>
                      <textarea
                        className="border w-full p-3 rounded mb-2"
                        style={{ minHeight: "180px" }}
                        placeholder={`Describe what this image shows. Example:\nDiagram showing INNER JOIN between table A and B.`}
                        value={entry.TemplateData || ""}
                        onChange={(e) => handleTemplateDataChange(index, e.target.value)}
                        required
                      />
                    </>
                  )}

                  <label className="text-sm font-semibold text-gray-700">Upload Certificate (Optional)</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleCertificateChange(index, e.target.files[0])}
                    className="border px-2 py-1 rounded w-full mb-2"
                    title="Upload your certificate (if you have one)"
                  />

                  <label className="text-sm font-semibold text-gray-700">Source (Optional)</label>
                  <input
                    type="text"
                    placeholder="Where did you learn this skill? (Optional)"
                    value={entry.Source}
                    onChange={(e) => handleSourceChange(index, e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>
              ))}

              <div className="flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={addSkillRow}
                  className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 ${
                    skillEntries.length >= 5 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={skillEntries.length >= 5}
                >
                  + Add Another Skill
                </button>

                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Save Skills
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: LIVE PREVIEW */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-center mb-4">
              {/* Logo (from uploaded path) */}
              <img src={logoUrl} alt="SkillSwap Logo" className="h-16 object-contain" />
            </div>

            {/* If multiple entries show selector to preview each one */}
            <PreviewPanel
              entries={skillEntries}
              categories={categories}
              getCategoryName={getCategoryName}
              getSkillNameFromRow={getSkillNameFromRow}
              renderPreviewForEntry={renderPreviewForEntry}
              imagePreviews={imagePreviews}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

// PreviewPanel component (keeps main component tidy)
function PreviewPanel({ entries, categories, getCategoryName, getSkillNameFromRow, renderPreviewForEntry, imagePreviews }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= entries.length) setActiveIndex(entries.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const active = entries[activeIndex] || {};

  return (
    <div>
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {entries.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`px-3 py-1 rounded ${activeIndex === i ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Preview {i + 1}
          </button>
        ))}
      </div>

      <div className="p-3 bg-gray-50 rounded">
        <div className="mb-2">
          <div className="text-xs text-gray-500">Category</div>
          <div className="font-medium">{getCategoryName(active.CategoryId) || <span className="text-gray-400">Not selected</span>}</div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-500">Skill</div>
          <div className="font-medium">{getSkillNameFromRow(active) || <span className="text-gray-400">Not selected</span>}</div>
        </div>

        <div className="border-t pt-3">
          {renderPreviewForEntry(active, activeIndex)}
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Preview updates live as you type. This is an HTML preview — final PDF will be generated on submit.
        </div>
      </div>
    </div>
  );
}

export default AddSkill;
