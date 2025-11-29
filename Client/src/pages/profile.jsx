import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiCamera, FiSave } from "react-icons/fi";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    Username: "",
    Email: "",
    DateOfBirth: "",
    StreetNo: "",
    Area: "",
    City: "",
    ContactNo: "",
    Bio: "",
    Gender: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return (window.location.href = "/login");
    setUser(storedUser);
    fetchUserProfile(storedUser._id || storedUser.UserId);
    fetchActiveCities();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/users/profile/${userId}`
      );
      if (res.data.success) {
        const u = res.data.user;
        setFormData({
          Username: u.Username || "",
          Email: u.Email || "",
          DateOfBirth: u.DateOfBirth ? u.DateOfBirth.split("T")[0] : "",
          StreetNo: u.StreetNo || "",
          Area: u.Area || "",
          City: u.City?._id || u.City || "",
          ContactNo: u.ContactNo || "",
          Bio: u.Bio || "",
          Gender: u.Gender || "",
        });
        setPreview(
          u.ProfileImageURL
            ? `http://localhost:4000${u.ProfileImageURL}`
            : null
        );
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchActiveCities = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/users/active-cities"
      );
      if (res.data.success) setCities(res.data.cities);
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const form = new FormData();
    Object.entries(formData).forEach(([key, val]) => form.append(key, val));
    if (selectedImage) form.append("profileImage", selectedImage);

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.put(
        `http://localhost:4000/api/users/update/${user._id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        setMessage("✅ Profile updated successfully!");
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } else {
        setMessage("❌ " + res.data.message);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("❌ Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <p className="text-center mt-10 text-[#8E5C32] font-medium">
        Loading...
      </p>
    );

  return (
    <div
      className="min-h-screen flex justify-center items-center 
                 bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA] 
                 px-3 py-6"
    >
      <div
        className="w-full max-w-3xl backdrop-blur-lg bg-[#FDFCF8]/95 
                   rounded-2xl shadow-xl border border-[#CBBFAE] 
                   p-6 md:p-8 transition-all hover:shadow-2xl"
      >
        <h1
          className="text-2xl md:text-3xl font-extrabold text-center mb-6 tracking-tight
                     bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent"
        >
          My Profile
        </h1>

        {message && (
          <div
            className={`text-center mb-3 text-sm font-semibold ${
              message.startsWith("✅") ? "text-green-700" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmit}>
          {/* Profile Image */}
          <div className="md:col-span-2 flex flex-col items-center mb-4">
            <div className="relative group">
              <img
                src={
                  preview ||
                  "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                }
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover 
                           border-4 border-[#D8CCBA] shadow-sm 
                           transition-all group-hover:scale-105"
              />
              <label
                htmlFor="profileImage"
                className="absolute bottom-0 right-0 bg-gradient-to-r 
                           from-[#B87C4C] to-[#8E5C32] text-white p-2 
                           rounded-full shadow-md cursor-pointer 
                           hover:shadow-lg hover:scale-105 transition-all"
              >
                <FiCamera size={15} />
              </label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <p className="mt-2 text-gray-500 text-xs">
              Click the camera to change your photo
            </p>
          </div>

          {[
            { label: "Username", name: "Username", type: "text" },
            { label: "Email", name: "Email", type: "email" },
            { label: "Date of Birth", name: "DateOfBirth", type: "date" },
            { label: "Contact No", name: "ContactNo", type: "text" },
            { label: "Street No", name: "StreetNo", type: "text" },
            { label: "Area", name: "Area", type: "text" },
          ].map((f) => (
            <div key={f.name}>
              <label className="text-[#4A3724] font-medium text-sm mb-1 block">
                {f.label}
              </label>
              <input
                type={f.type}
                name={f.name}
                value={formData[f.name]}
                onChange={handleChange}
                maxLength={f.name === "ContactNo" ? 10 : undefined}
                className="w-full border border-[#D8CCBA] bg-white/80 
                           p-2.5 rounded-xl text-sm text-[#3A2A1A]
                           focus:outline-none focus:ring-2 
                           focus:ring-[#B87C4C]/40"
                required
              />
            </div>
          ))}

          {/* City */}
          <div>
            <label className="text-[#4A3724] font-medium text-sm mb-1 block">
              City
            </label>
            <select
              name="City"
              value={formData.City}
              onChange={handleChange}
              className="w-full border border-[#D8CCBA] bg-white/80 
                         p-2.5 rounded-xl text-sm text-[#3A2A1A]
                         focus:outline-none focus:ring-2 
                         focus:ring-[#B87C4C]/40"
              required
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>
                  {city.cityName}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="text-[#4A3724] font-medium text-sm mb-1 block">
              Gender
            </label>
            <select
              name="Gender"
              value={formData.Gender}
              onChange={handleChange}
              className="w-full border border-[#D8CCBA] bg-white/80 
                         p-2.5 rounded-xl text-sm text-[#3A2A1A]
                         focus:outline-none focus:ring-2 
                         focus:ring-[#B87C4C]/40"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="text-[#4A3724] font-medium text-sm mb-1 block">
              Bio
            </label>
            <textarea
              name="Bio"
              rows="2"
              value={formData.Bio}
              onChange={handleChange}
              className="w-full border border-[#D8CCBA] bg-white/80 
                         p-2.5 rounded-xl text-sm text-[#3A2A1A]
                         focus:outline-none focus:ring-2 
                         focus:ring-[#B87C4C]/40 resize-none"
              placeholder="Write something about yourself..."
            ></textarea>
          </div>

          {/* Save */}
          <div className="md:col-span-2 text-center mt-2">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl font-semibold text-white shadow-md 
                          inline-flex items-center gap-2 text-sm transition-all
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] hover:shadow-lg hover:scale-[1.02]"
                }`}
            >
              <FiSave size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
