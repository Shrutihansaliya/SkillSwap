// src/pages/Admin/ChangePassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useAdmin } from "../../context/AdminContext.jsx";
import { toast } from "react-toastify";          // ⭐ ADDED
import "react-toastify/dist/ReactToastify.css";   // ⭐ ADDED

const ChangePassword = () => {
  const { user } = useAdmin(); 
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPw || !newPw || !confirmPw) {
      toast.error("Please fill all fields.");   // ⭐ replaced
      return;
    }

    if (newPw !== confirmPw) {
      toast.error("New passwords do not match.");  // ⭐ replaced
      return;
    }

    if (newPw === currentPw) {
      toast.error("New password must be different from current password."); // ⭐ replaced
      return;
    }

    if (!user?._id) {
      toast.error("Admin not found. Please login again."); // ⭐ replaced
      return;
    }

    setLoading(true);

    try {
      const res = await axios.put(
        "http://localhost:4000/api/users/change-password",
        {
          userId: user._id,
          currentPassword: currentPw,
          newPassword: newPw,
        }
      );

      if (res.data.success) {
        toast.success(res.data.message); // ⭐ replaced
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        toast.error(res.data.message);   // ⭐ replaced
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong."); // ⭐ replaced
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-indigo-600 mb-6 text-center">
        Change Password
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          className="border p-3 rounded-xl focus:ring-2 focus:ring-indigo-300"
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          className="border p-3 rounded-xl focus:ring-2 focus:ring-indigo-300"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          className="border p-3 rounded-xl focus:ring-2 focus:ring-indigo-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      {/* ⭐ Toast Container */}
      <toast.ToastContainer />
    </div>
  );
};

export default ChangePassword;
