// frontend/src/pages/OtpVerify.jsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(emailFromState);

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:4000/api/users/verify-otp",
        { email, otp },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("✅ " + res.data.message);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/add-skill");
      }
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      <Header />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-10">
        <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-md text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-8">
            OTP Verification
          </h2>

          <form onSubmit={handleOtpVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 placeholder-gray-400 transition duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP
              </label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 placeholder-gray-400 transition duration-300"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Verify OTP
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500">
            Already verified?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default OtpVerify;
