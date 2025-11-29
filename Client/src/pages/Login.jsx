import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaCheckCircle,
  FaSignInAlt,
} from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (blocked && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setBlocked(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [blocked, countdown]);

  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (blocked || loading) return;

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        "http://localhost:4000/api/login",
        { Email: email, Password: password },
        { withCredentials: true }
      );

      if (res.data.token) localStorage.setItem("token", res.data.token);
      if (res.data.user)
        localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("✅ " + res.data.message);

      const userRole = res.data.role;
      if (userRole === "Admin") {
        navigate("/Admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert("❌ " + msg);

      setPassword("");

      if (msg.toLowerCase().includes("password")) {
        setError("Wrong password. Please try again.");
      } else {
        setError(msg);
      }

      if (msg.includes("blocked for")) {
        const secondsMatch = msg.match(/(\d+)\s*seconds/);
        if (secondsMatch && secondsMatch[1]) {
          const seconds = parseInt(secondsMatch[1], 10);
          setCountdown(seconds);
          setBlocked(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => setShowPassword((prev) => !prev);

  return (
    <>
      <Header />

      {/* 🔹 main background updated */}
      <div
        className="min-h-screen flex items-center justify-center 
        bg-gradient-to-br from-[#A8BBA3] via-[#F7F4EA] to-[#A8BBA3] 
        px-4 py-10"
      >
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
          {/* 🔹 Left info panel updated to match Register */}
          <div
            className="hidden md:flex flex-col justify-between 
            bg-[#A8BBA3] rounded-3xl p-8 
            border border-white/40 shadow-2xl md:w-5/12 text-gray-900"
          >
            <div>
              <div
                className="inline-flex items-center gap-2 px-4 py-1 rounded-full 
                bg-white/40 text-gray-900 text-xs font-semibold mb-4"
              >
                <FaShieldAlt className="text-xs" />
                Secure Skill Swap Login
              </div>
              <h1 className="text-3xl font-bold mb-3">
                Welcome back 👋
              </h1>
              <p className="text-sm text-gray-700 mb-6">
                Login to continue swapping skills, chatting with learners and
                sharing your knowledge with the community.
              </p>

              <div className="space-y-3 text-gray-800 text-sm">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-800" />
                  <span>Protected login with rate limiting</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-800" />
                  <span>Access your dashboard & skill matches</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-800" />
                  <span>Continue your ongoing swaps instantly</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-800">
              <span className="font-semibold">Note:</span> Too many wrong
              attempts will temporarily lock your account for security.
            </div>
          </div>

          {/* 🔹 Right login card updated background/border */}
          <div
            className="bg-[#F7F4EA] rounded-3xl shadow-2xl w-full md:w-7/12 
            p-6 md:p-8 border border-[#A8BBA3]/40"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaSignInAlt className="text-indigo-600" />
                  Login to your account
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your registered email and password.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end text-xs text-gray-500">
                <span>New here?</span>
                <Link
                  to="/register"
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Create an account
                </Link>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-2 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <FaEnvelope className="text-gray-400" /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white/70"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <FaLock className="text-gray-400" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 text-sm pr-12 bg-white/70 ${
                      error && error.toLowerCase().includes("password")
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                  />
                  <span
                    onClick={togglePassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer text-lg"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Keep your credentials safe and private.
                </span>
                <Link
                  to="/forgot-password"
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={blocked || loading}
                className={`w-full text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm
                  ${
                    blocked
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 hover:opacity-95 hover:shadow-lg hover:-translate-y-0.5 transform"
                  } ${loading ? "opacity-60 cursor-wait" : ""}`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Logging you in...
                  </>
                ) : (
                  <>
                    Login
                    <FaSignInAlt />
                  </>
                )}
              </button>
            </form>

            {blocked && (
              <p className="text-center text-red-600 mt-3 text-sm font-medium">
                Too many failed attempts. Try again in {countdown}s
              </p>
            )}

            <p className="text-center text-gray-600 mt-5 text-sm md:hidden">
              Don’t have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-600 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Login;
