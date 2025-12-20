import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";

function OtpVerifyForgot() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpStatus, setOtpStatus] = useState("");
  const [vibrate, setVibrate] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      setOtpStatus("wrong");
      setVibrate(true);
      toast.error("Please enter all 6 digits");
      setTimeout(() => setVibrate(false), 500);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:4000/api/forgot-password/verify-otp",
        { Email: email, otp: otpString },
        { withCredentials: true }
      );
      setOtpStatus("correct");
      toast.success(res.data.message);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setOtpStatus("wrong");
      setVibrate(true);
      toast.error(err.response?.data?.message || err.message);
      setTimeout(() => setVibrate(false), 500);
    }
  };

  const handleResend = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/forgot-password/request-otp",
        { Email: email },
        { withCredentials: true }
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-10">
        <div className="bg-white shadow-xl rounded-2xl p-10 w-400 max-w-md text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            OTP Verification
          </h2>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (window[`otpInputForgot${index}`] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value) {
                      const newOtp = [...otp];
                      newOtp[index] = value;
                      setOtp(newOtp);
                      setOtpStatus("");

                      // Auto focus to next box
                      if (index < 5) {
                        window[`otpInputForgot${index + 1}`]?.focus();
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Backspace to previous box
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      window[`otpInputForgot${index - 1}`]?.focus();
                    }
                    // Delete key
                    if (e.key === "Delete" || (e.key === "Backspace" && otp[index])) {
                      const newOtp = [...otp];
                      newOtp[index] = "";
                      setOtp(newOtp);
                      setOtpStatus("");
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
                    if (pastedData.length === 6) {
                      const newOtp = pastedData.split("");
                      setOtp(newOtp);
                      window[`otpInputForgot5`]?.focus();
                    }
                  }}
                  className={`w-14 h-14 border-2 rounded-xl text-center text-2xl font-bold transition-all duration-300 focus:outline-none ${
                    otpStatus === "correct"
                      ? "border-green-500 bg-green-50 text-green-600"
                      : otpStatus === "wrong"
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  }`}
                  style={
                    vibrate && otpStatus === "wrong"
                      ? {
                          animation: "vibrate 0.1s 4",
                        }
                      : {}
                  }
                />
              ))}
            </div>

            <style>{`
              @keyframes vibrate {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
              }
            `}</style>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-800 to-indigo-600 hover:from-indigo-800 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-md transition-all duration-300"
            >
              Verify OTP
            </button>
          </form>

          <button
            onClick={handleResend}
            disabled={loading}
            className={`mt-6 w-full py-2.5 rounded-xl text-white font-semibold shadow-md transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed opacity-50"
                : "bg-green-700 hover:bg-green-600"
            }`}
          >
            {loading ? "Resending OTP..." : "Resend OTP"}
          </button>
        </div>
      </div>
      <Footer />
      <Toaster position="top-center" />
    </>
  );
}

export default OtpVerifyForgot;
