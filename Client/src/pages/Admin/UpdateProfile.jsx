// // pages/Admin/updateProfile.jsx
// import { useState, useEffect } from "react";
// import axios from "axios";
// import { useAdmin } from "../../context/AdminContext.jsx";

// const UpdateProfile = () => {
//   const { user, message, setMessage } = useAdmin();

//   const [form, setForm] = useState({
//     Username: "",
//     Email: "",
//     DateOfBirth: "",
//     Gender: "",
//     StreetNo: "",
//     Area: "",
//     City: "", // will hold city _id
//     ContactNo: "",
//     Bio: "",
//   });

//   const [preview, setPreview] = useState("");
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cities, setCities] = useState([]);

//   // get stored user id from localStorage (you used this pattern previously)
//   const storedUser = JSON.parse(localStorage.getItem("user") || "null");
//   const userId = storedUser?._id;

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         if (!userId) {
//           setMessage("User not found. Please login again.");
//           setLoading(false);
//           return;
//         }

//         // fetch user profile and active cities in parallel
//         const [profileRes, citiesRes] = await Promise.all([
//           axios.get(`http://localhost:4000/api/users/profile/${userId}`),
//           axios.get("http://localhost:4000/api/users/active-cities"),
//         ]);

//         // handle cities
//         if (citiesRes.data?.success && Array.isArray(citiesRes.data.cities)) {
//           setCities(citiesRes.data.cities);
//         } else if (Array.isArray(citiesRes.data)) {
//           // some endpoints return plain array
//           setCities(citiesRes.data);
//         }

//         // handle user profile
//         if (!profileRes.data?.success) {
//           setMessage(profileRes.data?.message || "Failed to load profile.");
//           setLoading(false);
//           return;
//         }

//         const u = profileRes.data.user;

//         setForm({
//           Username: u.Username || "",
//           Email: u.Email || "",
//           DateOfBirth: u.DateOfBirth ? new Date(u.DateOfBirth).toISOString().split("T")[0] : "",
//           Gender: u.Gender || "",
//           StreetNo: u.StreetNo || "",
//           Area: u.Area || "",
//           City: u.City?._id || (typeof u.City === "string" ? u.City : ""),
//           ContactNo: u.ContactNo || "",
//           Bio: u.Bio || "",
//         });

//         setPreview(u.ProfileImageURL ? `http://localhost:4000${u.ProfileImageURL}` : "");
//       } catch (err) {
//         console.error("Load profile error:", err);
//         setMessage("Error loading profile.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId]);

//   const onChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const onFileChange = (e) => {
//     const f = e.target.files?.[0];
//     setFile(f || null);
//     if (f) {
//       setPreview(URL.createObjectURL(f));
//     }
//   };

//   const validateBeforeSubmit = () => {
//     // basic client-side checks to help user (server still validates)
//     if (!form.Username || form.Username.length < 3) {
//       setMessage("Username must be at least 3 characters.");
//       return false;
//     }
//     if (!form.Email) {
//       setMessage("Email is required.");
//       return false;
//     }
//     if (!form.DateOfBirth) {
//       setMessage("Date of birth is required.");
//       return false;
//     }
//     if (!form.StreetNo || !form.Area || !form.City) {
//       setMessage("StreetNo, Area and City are required.");
//       return false;
//     }
//     if (!/^\d{10}$/.test(form.ContactNo || "")) {
//       setMessage("Contact number must be 10 digits.");
//       return false;
//     }
//     return true;
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");

//     if (!validateBeforeSubmit()) return;

//     try {
//       const fd = new FormData();
//       // server expects fields like Username, Email, DateOfBirth, StreetNo, Area, City, ContactNo, Bio
//       fd.append("Username", form.Username);
//       fd.append("Email", form.Email);
//       fd.append("DateOfBirth", form.DateOfBirth);
//       fd.append("StreetNo", form.StreetNo);
//       fd.append("Area", form.Area);
//       fd.append("City", form.City);
//       fd.append("ContactNo", form.ContactNo);
//       fd.append("Bio", form.Bio ?? "");

//       if (file) fd.append("profileImage", file);

//       // NOTE: route is PUT /update/:id per your server routes
//       const res = await axios.put(`http://localhost:4000/api/users/update/${userId}`, fd, {
//         headers: {
//           // let the browser set the correct multipart boundary; axios normally sets correct header.
//           // but we'll provide content-type as multipart/form-data (axios will still add boundary)
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       if (!res.data?.success) {
//         setMessage(res.data?.message || "Update failed.");
//         return;
//       }

//       const updated = res.data.user;

//       // update localStorage: merge previous storedUser with fields returned from server
//       const merged = { ...(storedUser || {}), ...(updated || {}) };
//       localStorage.setItem("user", JSON.stringify(merged));

//       setPreview(updated.ProfileImageURL ? `http://localhost:4000${updated.ProfileImageURL}` : preview);
//       setMessage("✅ Profile updated successfully!");
//     } catch (err) {
//       console.error("Update profile error:", err);
//       // try to extract a friendly message from server response
//       const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
//       setMessage(serverMsg || "❌ Failed to update profile. Check console for details.");
//     }
//   };

//   if (loading) return <p className="p-6 text-gray-500 text-center">Loading...</p>;

//   return (
//     <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md mt-10">
//       <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Update Profile</h2>

//       {message && (
//         <div className="mb-5 text-center text-sm font-medium text-blue-600">
//           {message}
//         </div>
//       )}

//       <form onSubmit={onSubmit} className="space-y-5">
//         {/* Profile Image */}
//         <div className="flex items-center gap-4">
//           <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shadow-inner">
//             {preview ? (
//               <img src={preview} alt="Profile" className="w-full h-full object-cover" />
//             ) : (
//               <span className="text-gray-400 text-sm">No Image</span>
//             )}
//           </div>
//           <label className="cursor-pointer text-gray-500 hover:text-gray-700">
//             <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
//             <span className="px-4 py-2 bg-gray-100 rounded-md shadow hover:bg-gray-200 transition">
//               Change Image
//             </span>
//           </label>
//         </div>

//         {/* Form Fields */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//           <div>
//             <label className="block text-gray-600 font-medium mb-1">Username</label>
//             <input
//               type="text"
//               name="Username"
//               value={form.Username}
//               onChange={onChange}
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-600 font-medium mb-1">Email</label>
//             <input
//               type="email"
//               name="Email"
//               value={form.Email}
//               onChange={onChange}
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-600 font-medium mb-1">Date of Birth</label>
//             <input
//               type="date"
//               name="DateOfBirth"
//               value={form.DateOfBirth}
//               onChange={onChange}
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-600 font-medium mb-1">Gender</label>
//             <select
//               name="Gender"
//               value={form.Gender}
//               onChange={onChange}
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//               required
//             >
//               <option value="">Select</option>
//               <option>Male</option>
//               <option>Female</option>
//               <option>Other</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-gray-600 font-medium mb-1">Street No</label>
//             <input
//               type="text"
//               name="StreetNo"
//               value={form.StreetNo}
//               onChange={onChange}
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-600 font-medium mb-1">Area</label>
//             <input
//               type="text"
//               name="Area"
//               value={form.Area}
//               onChange={onChange}
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-600 font-medium mb-1">City</label>
//             <select
//               name="City"
//               value={form.City}
//               onChange={onChange}
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//               required
//             >
//               <option value="">Select city</option>
//               {cities.map((c) => (
//                 <option key={c._id || c.id || c.cityName} value={c._id || c.id}>
//                   {c.cityName || c.name || c.city}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-gray-600 font-medium mb-1">Contact No</label>
//             <input
//               type="text"
//               name="ContactNo"
//               value={form.ContactNo}
//               onChange={onChange}
//               maxLength={10}
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//               required
//             />
//           </div>

//           <div className="md:col-span-2">
//             <label className="block text-gray-600 font-medium mb-1">Bio</label>
//             <textarea
//               name="Bio"
//               value={form.Bio}
//               onChange={onChange}
//               rows="4"
//               className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
//             />
//           </div>
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
//         >
//           Save Changes
//         </button>
//       </form>
//     </div>
//   );
// };

// export default UpdateProfile;
// pages/Admin/updateProfile.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAdmin } from "../../context/AdminContext.jsx";

const UpdateProfile = () => {
  const { user } = useAdmin();

  const [form, setForm] = useState({
    Username: "",
    Email: "",
    DateOfBirth: "",
    Gender: "",
    StreetNo: "",
    Area: "",
    City: "",
    ContactNo: "",
    Bio: "",
  });

  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);

  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = storedUser?._id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) {
          toast.error("User not found. Please login again.");
          setLoading(false);
          return;
        }

        const [profileRes, citiesRes] = await Promise.all([
          axios.get(`http://localhost:4000/api/users/profile/${userId}`),
          axios.get("http://localhost:4000/api/users/active-cities"),
        ]);

        let cityList = [];
        if (citiesRes.data?.success && Array.isArray(citiesRes.data.cities)) {
          cityList = citiesRes.data.cities;
        } else if (Array.isArray(citiesRes.data)) {
          cityList = citiesRes.data;
        }
        setCities(cityList);

        if (!profileRes.data?.success) {
          toast.error(profileRes.data?.message || "Failed to load profile.");
          setLoading(false);
          return;
        }

        const u = profileRes.data.user;

        setForm({
          Username: u.Username || "",
          Email: u.Email || "",
          DateOfBirth: u.DateOfBirth
            ? new Date(u.DateOfBirth).toISOString().split("T")[0]
            : "",
          Gender: u.Gender || "",
          StreetNo: u.StreetNo || "",
          Area: u.Area || "",
          City:
            u.City?._id ||
            u.City?.id ||
            u.City?.cityId ||
            (typeof u.City === "string" ? u.City : ""),
          ContactNo: u.ContactNo || "",
          Bio: u.Bio || "",
        });

        setPreview(
          u.ProfileImageURL
            ? `http://localhost:4000${u.ProfileImageURL}`
            : ""
        );
      } catch (err) {
        console.error("Load profile error:", err);
        toast.error("Error loading profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const validateBeforeSubmit = () => {
    if (!form.Username || form.Username.length < 3) {
      toast.error("Username must be at least 3 characters.");
      return false;
    }
    if (!form.Email) {
      toast.error("Email is required.");
      return false;
    }
    if (!form.DateOfBirth) {
      toast.error("Date of birth is required.");
      return false;
    }
    if (!form.Gender) {
      toast.error("Gender is required.");
      return false;
    }
    if (!form.StreetNo || !form.Area || !form.City) {
      toast.error("StreetNo, Area and City are required.");
      return false;
    }
    if (!/^\d{10}$/.test(form.ContactNo || "")) {
      toast.error("Contact number must be 10 digits.");
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) return;

    try {
      const fd = new FormData();

      fd.append("Username", form.Username);
      fd.append("Email", form.Email);
      fd.append("DateOfBirth", form.DateOfBirth);
      fd.append("Gender", form.Gender);
      fd.append("StreetNo", form.StreetNo);
      fd.append("Area", form.Area);
      fd.append("City", form.City);
      fd.append("ContactNo", form.ContactNo);
      fd.append("Bio", form.Bio ?? "");
      fd.append("gender", form.Gender ?? "");

      if (file) fd.append("profileImage", file);

      const res = await axios.put(
        `http://localhost:4000/api/users/update/${userId}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (!res.data?.success) {
        toast.error(res.data?.message || "Update failed.");
        return;
      }

      const updated = res.data.user;

      const merged = { ...(storedUser || {}), ...(updated || {}) };
      localStorage.setItem("user", JSON.stringify(merged));

      setPreview(
        updated.ProfileImageURL
          ? `http://localhost:4000${updated.ProfileImageURL}`
          : preview
      );

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Update profile error:", err);
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error;
      toast.error(serverMsg || "Failed to update profile.");
    }
  };

  if (loading)
    return <p className="p-6 text-gray-500 text-center">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Update Profile
      </h2>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Image */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 shadow-inner flex items-center justify-center">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">No Image</span>
            )}
          </div>

          <label className="cursor-pointer text-gray-600 hover:text-gray-800">
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
            <span className="px-4 py-2 bg-gray-200 rounded-md shadow hover:bg-gray-300 transition">
              Change Image
            </span>
          </label>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-gray-600 font-medium">Username</label>
            <input
              type="text"
              name="Username"
              value={form.Username}
              onChange={onChange}
              className="w-full p-3 border rounded-lg shadow-sm"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">Email</label>
            <input
              type="email"
              name="Email"
              value={form.Email}
              onChange={onChange}
              className="w-full p-3 border rounded-lg shadow-sm"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">
              Date of Birth
            </label>
            <input
              type="date"
              name="DateOfBirth"
              value={form.DateOfBirth}
              onChange={onChange}
              className="w-full p-3 border rounded-lg shadow-sm"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">Gender</label>
            <select
              name="Gender"
              value={form.Gender}
              onChange={onChange}
              className="w-full p-3 border rounded-lg shadow-sm"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-600 font-medium">Street No</label>
            <input
              type="text"
              name="StreetNo"
              value={form.StreetNo}
              onChange={onChange}
              className="w-full p-3 border rounded-lg shadow-sm"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">Area</label>
            <input
              type="text"
              name="Area"
              value={form.Area}
              onChange={onChange}
              className="w-full p-3 border rounded-lg shadow-sm"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">City</label>
            <select
              name="City"
              value={form.City}
              onChange={onChange}
              className="w-full p-3 border rounded-lg shadow-sm"
            >
              <option value="">Select city</option>
              {cities.map((c) => {
                const id = c._id || c.id || c.cityId;
                const label =
                  c.cityName || c.CityName || c.name || c.city;

                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-gray-600 font-medium">
              Contact No
            </label>
            <input
              type="text"
              name="ContactNo"
              maxLength={10}
              value={form.ContactNo}
              onChange={onChange}
              className="w-full p-3 border rounded-lg shadow-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-600 font-medium">Bio</label>
            <textarea
              name="Bio"
              value={form.Bio}
              onChange={onChange}
              rows="4"
              className="w-full p-3 border rounded-lg shadow-sm"
            />
          </div>
        </div>

        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow-md">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default UpdateProfile;

// 690f0c6de69125f47d216c7d