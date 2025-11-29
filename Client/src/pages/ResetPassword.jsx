import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return alert("Passwords do not match");
    }

    try {
      const res = await axios.post(
        "http://localhost:4000/api/login/reset-password",
        { Email: email, newPassword },
        { withCredentials: true }
      );

      // ✅ Check if last password was reused
      if (res.data.lastUsed) {
        return alert(res.data.message);
      }

      alert(res.data.message);

      if (res.data.success) navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <>
      <Header />

      <div
        className="min-h-[80vh] flex items-center justify-center px-4 py-10
        bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA]"
      >
        <div
          className="w-full max-w-md bg-[#F7F4EA]/95 border border-[#A8BBA3]/70 
          shadow-2xl rounded-3xl p-6 sm:p-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-transparent bg-clip-text">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 text-center mb-6">
            Choose a strong password you haven&apos;t used before.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-[#CBBFAE] rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-[#B87C4C]/40 
                  bg-white/90 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-[#CBBFAE] rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-[#B87C4C]/40 
                  bg-white/90 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl text-white text-sm sm:text-base font-semibold
                bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] 
                hover:shadow-lg hover:scale-[1.01] transition-all"
            >
              Reset Password
            </button>
          </form>

          <p className="mt-4 text-[11px] sm:text-xs text-gray-500 text-center">
            After resetting, you&apos;ll be logged into your account automatically.
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default ResetPassword;
