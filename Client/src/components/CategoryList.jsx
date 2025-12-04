// CategoryPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAdmin } from "../context/AdminContext.jsx";

const CategoryPage = () => {
  const { message, setMessage } = useAdmin();

  const [categories, setCategories] = useState([]);
  const [CategoryName, setCategoryName] = useState("");
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [existingImageName, setExistingImageName] = useState("");

  // Modal
  const [modalImage, setModalImage] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const API_URL = "http://localhost:4000/api/categories";

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(API_URL);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle file select + preview
  const handleImagesChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setPreviewImage(null);
      return;
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type)) {
      alert("Only PNG, JPG, JPEG allowed");
      return;
    }

    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewImage(null);
    setExistingImageName("");
  };

  // Add or Update category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CategoryName.trim()) return alert("Category name required");

    try {
      const formData = new FormData();
      formData.append("CategoryName", CategoryName.trim());

      if (imageFile) {
        formData.append("image", imageFile); // backend expects "image"
      }

      let res;

      if (editId) {
        res = await axios.put(`${API_URL}/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setCategories((prev) =>
          prev.map((c) => (c._id === editId ? res.data.data : c))
        );
      } else {
        res = await axios.post(`${API_URL}/add`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setCategories((prev) => [...prev, res.data.data]);
      }

      alert(res.data.message);

      // Reset form
      setCategoryName("");
      setImageFile(null);
      setPreviewImage(null);
      setExistingImageName("");
      setEditId(null);
      setShowForm(false);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving category");
    }
  };

  // Edit category
  const handleEdit = (cat) => {
    setEditId(cat._id);
    setCategoryName(cat.CategoryName);
    setImageFile(null);
    setPreviewImage(null);

    if (cat.image) setExistingImageName(cat.image);
    else setExistingImageName("");

    setShowForm(true);
  };

  // Toggle status
  const handleToggle = async (cat) => {
    try {
      const res = await axios.put(`${API_URL}/toggle/${cat._id}`);
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? res.data.data : c))
      );
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  // Get category image or default
  const getImage = (cat) => {
    if (!cat?.image) return "/icons/default.jpg";
    return `/icons/${cat.image}`;
  };

  // Filter categories
  const filteredCategories = categories.filter((cat) =>
    (cat.CategoryName || "")
      .toLowerCase()
      .includes(debouncedSearch)
  );

  const activeCategories = filteredCategories.filter(
    (c) => c.status === "Active"
  );

  const inactiveCategories = filteredCategories.filter(
    (c) => c.status === "Inactive"
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <h2 className="text-2xl font-bold mb-4">Skill Categories</h2>

      {/* Search input */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="🔍 Search category"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {searchTerm && (
          <button
            className="px-3 bg-gray-200 rounded"
            onClick={() => setSearchTerm("")}
          >
            ×
          </button>
        )}
      </div>

      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Close Form" : "Add Category"}
      </button>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
          <input
            type="text"
            value={CategoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Category Name"
            className="w-full p-2 border rounded mb-3"
          />

          {/* Existing image */}
          {existingImageName && !previewImage && (
            <div className="mb-2">
              <img
                src={`http://localhost:4000/icons/${existingImageName}`}
                className="w-24 h-24 object-cover rounded cursor-pointer"
                onClick={() =>
                  (setModalImage(`/icons/${existingImageName}`), setShowModal(true))
                }
              />
            </div>
          )}

          {/* Preview image */}
          {previewImage && (
            <div className="mb-2">
              <img
                src={previewImage}
                className="w-24 h-24 object-cover rounded cursor-pointer"
                onClick={() => (setModalImage(previewImage), setShowModal(true))}
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImagesChange}
            className="p-2 w-full border rounded"
          />

          {(previewImage || existingImageName) && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-red-600 text-sm mt-1 underline"
            >
              Remove Image
            </button>
          )}

          <div className="mt-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded">
              {editId ? "Update Category" : "Add Category"}
            </button>
          </div>
        </form>
      )}
      {/* ACTIVE + INACTIVE TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ACTIVE CATEGORIES */}
        <div>
          <h3 className="text-xl font-semibold mb-2">
            Active Categories ({activeCategories.length})
          </h3>

          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Image</th>
                <th className="p-2 border">Category</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {activeCategories.length ? (
                activeCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="p-2 border text-center">
                      <img
                        src={`http://localhost:4000${getImage(cat)}`}
                        className="w-12 h-12 rounded object-cover mx-auto cursor-pointer"
                        onClick={() => {
                          setModalImage(getImage(cat));
                          setShowModal(true);
                        }}
                        alt="category"
                      />
                    </td>

                    <td className="p-2 border">{cat.CategoryName}</td>

                   <td className="p-2 border">
  <div className="flex items-center justify-center gap-2">

    <button
      className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded whitespace-nowrap"
      onClick={() => handleEdit(cat)}
    >
      ✏ Edit
    </button>

    <button
      className="bg-gray-600 text-white px-3 py-1 rounded whitespace-nowrap"
      onClick={() => handleToggle(cat)}
    >
      Deactivate
    </button>

  </div>
</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-2 border text-center" colSpan="3">
                    No active categories
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* INACTIVE CATEGORIES */}
        <div>
          <h3 className="text-xl font-semibold mb-2">
            Inactive Categories ({inactiveCategories.length})
          </h3>

          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Image</th>
                <th className="p-2 border">Category</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {inactiveCategories.length ? (
                inactiveCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="p-2 border text-center">
                      <img
                        src={`http://localhost:4000${getImage(cat)}`}
                        className="w-12 h-12 rounded object-cover mx-auto cursor-pointer"
                        onClick={() => {
                          setModalImage(getImage(cat));
                          setShowModal(true);
                        }}
                        alt="category"
                      />
                    </td>

                    <td className="p-2 border">{cat.CategoryName}</td>

                    <td className="p-2 border text-center">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => handleToggle(cat)}
                      >
                        Activate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-2 text-center">
                    No inactive categories
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* IMAGE MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div className="bg-white p-3 rounded shadow-lg">
            <img
              src={`http://localhost:4000${modalImage}`}
              className="max-w-[300px] max-h-[300px] object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default CategoryPage;
