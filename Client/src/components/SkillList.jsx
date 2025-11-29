import { useEffect, useState } from "react";
import axios from "axios";
import { useAdmin } from "../context/AdminContext.jsx";

const SkillPage = () => {
  const { user, message, setMessage } = useAdmin();

  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [CategoryId, setCategoryId] = useState("");
  const [Name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Search states (with debounce)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Endpoints
  const CATEGORIES_API = "http://localhost:4000/api/skills/categories";
  const SKILLS_LIST_API = "http://localhost:4000/api/skills/list";
  const SKILLS_ADD_API = "http://localhost:4000/api/skills/add";

  // 🔹 Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(CATEGORIES_API);
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch categories");
    }
  };

  // 🔹 Fetch skills
  const fetchSkills = async () => {
    try {
      const res = await axios.get(SKILLS_LIST_API);
      setSkills(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch skills");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSkills();
  }, []);

  // Debounce searchTerm -> debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // 🔹 Handle Add / Update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!CategoryId) {
      setMessage("Please select a category.");
      alert("Please select a category.");
      return;
    }
    if (!Name?.trim()) {
      setMessage("Skill name cannot be empty.");
      alert("Skill name cannot be empty.");
      return;
    }

    try {
      if (editId) {
        const res = await axios.put(`http://localhost:4000/api/skills/${editId}`, {
          CategoryId,
          Name,
        });
        setMessage(res.data.message);
        alert(res.data.message || "Skill updated successfully!");
      } else {
        const res = await axios.post(SKILLS_ADD_API, { CategoryId, Name });
        setMessage(res.data.message);
        alert(res.data.message || "Skill added successfully!");
      }

      setCategoryId("");
      setName("");
      setEditId(null);
      setShowForm(false);
      fetchSkills();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Error saving skill";
      setMessage(errMsg);
      alert(errMsg);
    }
  };

  // 🔹 Toggle Active / Inactive
  const handleToggleStatus = async (id) => {
    try {
      const res = await axios.put(`http://localhost:4000/api/skills/toggle/${id}`);
      const updated = res.data.data;
      setSkills((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      setMessage(res.data.message);
      alert(res.data.message || "Skill status updated successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || "Error toggling status";
      setMessage(errMsg);
      alert(errMsg);
    }
  };

  // 🔹 Handle Edit
  const handleEdit = (skill) => {
    setEditId(skill._id);
    setCategoryId(skill.CategoryId);
    setName(skill.Name);
    setShowForm(true);
  };

  // 🔹 Search/filtering: match skill name OR category name (case-insensitive)
  const normalizedSearch = debouncedSearch.toLowerCase();

  // Helper to check if a skill matches the search (either its name or its category's name)
  const skillMatchesSearch = (skill, categoryMap) => {
    if (!normalizedSearch) return true;
    const skillName = (skill?.Name ?? "").toString().toLowerCase();
    const catName = (categoryMap[skill.CategoryId]?.CategoryName ?? "").toString().toLowerCase();
    return skillName.includes(normalizedSearch) || catName.includes(normalizedSearch);
  };

  // Build a fast lookup map for categories by CategoryId
  const categoryMap = categories.reduce((acc, c) => {
    acc[c.CategoryId] = c;
    return acc;
  }, {});

  // Render skills per category, but filter skills by the search.
  // When search is active, only categories with at least one matching skill are shown.
  const renderCategorySkills = () => {
    // If there are no categories, return a message
    if (!categories || categories.length === 0) {
      return (
        <p className="text-gray-500 italic">No categories available.</p>
      );
    }

    // Build the list of category blocks to render
    const categoryBlocks = categories.map((cat) => {
      const catId = cat.CategoryId;
      const allSkillsForCat = skills.filter((s) => s.CategoryId === catId);
      const filteredSkills = allSkillsForCat.filter((s) => skillMatchesSearch(s, categoryMap));

      // If a search is active and this category has no filteredSkills, skip rendering it
      if (normalizedSearch && filteredSkills.length === 0) {
        return null;
      }

      // counts for heading
      const totalMatches = filteredSkills.length;
      const activeMatches = filteredSkills.filter((s) => (s.Status ?? "").toString().toLowerCase() === "active").length;
      const inactiveMatches = totalMatches - activeMatches;

      return (
        <div key={catId} className="mb-8">
          <h3 className="text-xl font-semibold mb-2 bg-gray-100 p-2 rounded flex items-center justify-between">
            <span>{cat.CategoryName}</span>
            <span className="text-sm text-gray-600">
              Matches: {totalMatches} {totalMatches > 0 && `• Active ${activeMatches} / Inactive ${inactiveMatches}`}
            </span>
          </h3>

          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Skill Name</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSkills.length > 0 ? (
                filteredSkills.map((skill) => (
                  <tr key={skill._id} className="hover:bg-gray-50">
                    <td className="p-2 border">{skill.Name}</td>
                    <td className="p-2 border text-center">{skill.Status}</td>
                    <td className="p-2 border text-center space-x-2">
                      <button
                        onClick={() => handleEdit(skill)}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg shadow-sm border border-green-300 transition"
                      >
                        ✏ Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(skill._id)}
                        className={`px-3 py-1 rounded text-white ${
                          (skill.Status ?? "").toString().toLowerCase() === "active"
                            ? "bg-gray-600"
                            : "bg-green-600"
                        }`}
                      >
                        {(skill.Status ?? "").toString().toLowerCase() === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                // Show "No skills" only when search is empty. If search is active this branch won't execute because we skip categories with zero matches.
                <tr>
                  <td colSpan="3" className="p-3 border text-center text-gray-500 italic">
                    No skills
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    });

    // Remove nulls (categories that were skipped)
    const visibleBlocks = categoryBlocks.filter(Boolean);

    // If search is active and nothing matched anywhere, show a friendly message
    if (normalizedSearch && visibleBlocks.length === 0) {
      return (
        <p className="text-center text-gray-500 italic mt-6">
          No results for "<span className="font-medium text-gray-700">{debouncedSearch}</span>"
        </p>
      );
    }

    return visibleBlocks;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Skills</h2>

      {/* Search Box */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="🔍 Search by skill or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ×
          </button>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showForm ? "Close Form" : "Add Skill"}
      </button>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white shadow p-4 rounded space-y-4">
          <div>
            <label className="block mb-1 font-medium">Category</label>
            <select
              value={CategoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="border p-2 rounded w-full"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.CategoryId} value={cat.CategoryId}>
                  {cat.CategoryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Skill Name</label>
            <input
              type="text"
              value={Name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={150}
              className="border p-2 rounded w-full"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {editId ? "Update Skill" : "Add Skill"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCategoryId("");
                setName("");
                setEditId(null);
                setShowForm(false);
              }}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Message */}
      {message && <p className="mb-4 text-sm text-green-700 font-medium">{message}</p>}

      {/* Skills Table by Category */}
      {renderCategorySkills()}
    </div>
  );
};

export default SkillPage;