import { useEffect, useState } from "react";
import axios from "axios";
import { useAdmin } from "../context/AdminContext.jsx";

const CategoryPage = () => {
  const { message, setMessage } = useAdmin();
  const [categories, setCategories] = useState([]);
  const [CategoryName, setCategoryName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Search states (with debounce)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const API_URL = "http://localhost:4000/api/categories";

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(API_URL);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounce searchTerm -> debouncedSearch
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Add / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CategoryName.trim()) {
      setMessage("Category name cannot be empty.");
      alert("Category name cannot be empty.");
      return;
    }
    try {
      if (editId) {
        const res = await axios.put(`${API_URL}/${editId}`, { CategoryName });
        setMessage(res.data.message);
        alert(res.data.message || "Category updated successfully!");
        setCategories((prev) =>
          prev.map((c) => (c._id === editId ? { ...c, CategoryName } : c))
        );
      } else {
        const res = await axios.post(`${API_URL}/add`, { CategoryName });
        setMessage(res.data.message);
        alert(res.data.message || "Category added successfully!");
        setCategories((prev) => [...prev, res.data.data]);
      }
      setCategoryName("");
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Error saving category";
      setMessage(errMsg);
      alert(errMsg);
    }
  };

  // Edit
  const handleEdit = (cat) => {
    setEditId(cat._id);
    setCategoryName(cat.CategoryName ?? cat.name ?? "");
    setShowForm(true);
  };

  // Toggle Active/Inactive
  const handleToggle = async (cat) => {
    try {
      const res = await axios.put(`${API_URL}/toggle/${cat._id}`);
      const updatedCat = res.data.data;
      setCategories((prev) =>
        prev.map((c) => (c._id === updatedCat._id ? updatedCat : c))
      );
      setMessage(res.data.message);
      alert(res.data.message || "Category status updated successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.message || "Error updating status";
      setMessage(errMsg);
      alert(errMsg);
    }
  };

  // Regex: only letters and spaces for the category input
  const handleCategoryNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(value)) {
      setCategoryName(value);
    }
  };

  // Safer, robust filtered categories using debouncedSearch
  const normalizedSearch = debouncedSearch.toLowerCase();

  const filteredCategories = categories.filter((cat) => {
    const name = (cat?.CategoryName ?? cat?.name ?? "")
      .toString()
      .toLowerCase();
    if (!normalizedSearch) return true;
    return name.includes(normalizedSearch);
  });

  const activeCategories = filteredCategories.filter(
    (c) => (c?.status ?? "").toString().toLowerCase() === "active"
  );
  const inactiveCategories = filteredCategories.filter(
    (c) => (c?.status ?? "").toString().toLowerCase() === "inactive"
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Skill Categories</h2>

      {/* Search Box */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="🔍 Search category..."
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

      {/* Toggle form */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showForm ? "Close Form" : "Add Category"}
      </button>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white shadow p-4 rounded"
        >
          <input
            type="text"
            placeholder="Category Name"
            value={CategoryName}
            onChange={handleCategoryNameChange}
            required
            className="border p-2 rounded w-full mb-3"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {editId ? "Update Category" : "Add Category"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCategoryName("");
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
      {message && <p className="mb-4 text-green-700 font-medium">{message}</p>}

      {/* Active / Inactive Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active */}
        <div>
          <h3 className="text-xl font-semibold mb-2">
            Active Categories ({activeCategories.length})
          </h3>
          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Category Name</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeCategories.length > 0 ? (
                activeCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {cat.CategoryName ?? cat.name ?? ""}
                    </td>
                    <td className="p-2 border text-center space-x-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded"
                      >
                        ✏ Edit
                      </button>
                      <button
                        onClick={() => handleToggle(cat)}
                        className="bg-gray-600 text-white px-3 py-1 rounded"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="p-2 text-center">
                    No matching active categories
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Inactive */}
        <div>
          <h3 className="text-xl font-semibold mb-2">
            Inactive Categories ({inactiveCategories.length})
          </h3>
          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Category Name</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inactiveCategories.length > 0 ? (
                inactiveCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {cat.CategoryName ?? cat.name ?? ""}
                    </td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleToggle(cat)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Activate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="p-2 text-center">
                    No matching inactive categories
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;