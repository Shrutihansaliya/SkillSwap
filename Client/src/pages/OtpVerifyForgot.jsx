import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function OtpVerifyForgot() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:4000/api/forgot-password/verify-otp",
        { Email: email, otp },
        { withCredentials: true }
      );
      alert(res.data.message);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
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
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
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
            <div>
             
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 placeholder-gray-400 transition"
              />
            </div>

            <button
              type="submit"
           className="w-full py-2.5 bg-gradient-to-r from-indigo-800 to-indigo-600 hover:from-indigo-800 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-md transition-all duration-300"
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
    </>
  );
}

export default OtpVerifyForgot;
