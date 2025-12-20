import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:4000/api/forgot-password/request-otp",
        { Email: email },
        { withCredentials: true }
      );
      toast.success(res.data.message);
      navigate("/otp-verify-forgot", { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
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
            Forgot Password
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 text-center mb-6">
            Enter your registered email, we&apos;ll send you an OTP to reset your
            password.
          </p>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-[#CBBFAE] rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-[#B87C4C]/40 
                bg-white/90 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-white text-sm sm:text-base font-semibold transition-all 
              ${
                loading
                  ? "bg-[#B87C4C]/50 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] hover:shadow-lg hover:scale-[1.01]"
              }`}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <p className="mt-4 text-[11px] sm:text-xs text-gray-500 text-center">
            Make sure to check your spam / promotions folder if you don&apos;t see
            the email in your inbox.
          </p>
        </div>
      </div>

      <Footer />
      <Toaster position="top-center" />
    </>
  );
}

export default ForgotPassword;
