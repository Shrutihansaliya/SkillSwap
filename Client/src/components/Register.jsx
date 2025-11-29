import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaCalendarAlt,
  FaTransgender,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaInfoCircle,
  FaImage,
  FaShieldAlt,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    Username: "",
    Email: "",
    Password: "",
    DateOfBirth: "",
    Gender: "Male",
    StreetNo: "",
    Area: "",
    City: "",
    ContactNo: "",
    Bio: "",
    profileImage: null,
  });

  const [cities, setCities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [emailForOtp, setEmailForOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/city");
        setCities(res.data);
      } catch (err) {
        console.error("Error fetching cities:", err);
      }
    };
    fetchCities();
  }, []);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const getPasswordStrength = (password) => {
    if (!password) return "";
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return "Weak";
    if (score === 3) return "Medium";
    return "Strong";
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.Username.trim()) {
      newErrors.Username = "Username is required.";
    } else if (form.Username.trim().length < 3) {
      newErrors.Username = "Username must be at least 3 characters.";
    }

    if (!form.Email.trim()) {
      newErrors.Email = "Email is required.";
    } else if (!validateEmail(form.Email.trim())) {
      newErrors.Email = "Please enter a valid email.";
    }

    if (!form.Password) {
      newErrors.Password = "Password is required.";
    } else if (form.Password.length < 6) {
      newErrors.Password = "Password must be at least 6 characters.";
    }

    if (!form.DateOfBirth) {
      newErrors.DateOfBirth = "Date of birth is required.";
    }

    if (!form.StreetNo.trim()) {
      newErrors.StreetNo = "Street number is required.";
    }

    if (!form.Area.trim()) {
      newErrors.Area = "Area is required.";
    }

    if (!form.City) {
      newErrors.City = "Please select a city.";
    }

    if (!form.ContactNo.trim()) {
      newErrors.ContactNo = "Contact number is required.";
    } else if (!/^\d{10}$/.test(form.ContactNo.trim())) {
      newErrors.ContactNo = "Contact number must be 10 digits.";
    }

    if (form.Bio && form.Bio.length > 200) {
      newErrors.Bio = "Bio must be less than 200 characters.";
    }

    if (form.profileImage) {
      const file = form.profileImage;
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        newErrors.profileImage = "Only JPG and PNG images are allowed.";
      }
      const maxSizeMB = 2;
      if (file.size / 1024 / 1024 > maxSizeMB) {
        newErrors.profileImage = `Image size must be less than ${maxSizeMB}MB.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "profileImage") {
      const file = files[0];
      if (file) {
        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!validTypes.includes(file.type)) {
          setErrors((prev) => ({
            ...prev,
            profileImage: "Only JPG and PNG images are allowed.",
          }));
          return;
        }
        const maxSizeMB = 2;
        if (file.size / 1024 / 1024 > maxSizeMB) {
          setErrors((prev) => ({
            ...prev,
            profileImage: `Image size must be less than ${maxSizeMB}MB.`,
          }));
          return;
        }
        setErrors((prev) => ({ ...prev, profileImage: "" }));
        setForm((prev) => ({ ...prev, profileImage: file }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
      if (name === "Password") {
        setPasswordStrength(getPasswordStrength(value));
      }
    }
  };

  const handlecont = (e) => {
    const { name, value } = e.target;
    if (name === "ContactNo" && !/^\d*$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(form).forEach((key) => data.append(key, form[key]));

      const res = await axios.post(
        "http://localhost:4000/api/users/register",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      alert("✅ " + res.data.message);
      setEmailForOtp(form.Email);
      setStep(2);
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:4000/api/users/verify-otp",
        { email: emailForOtp, otp },
        { withCredentials: true }
      );

      alert("✅ " + res.data.message);

      // ✅ Save correct user format required by Dashboard & AddSkill
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: res.data.user.UserId, // MongoDB ID
          Username: res.data.user.Username,
          Email: res.data.user.Email,
        })
      );

      navigate("/add-skill"); // Go to skill add page
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || err.message));
    }
  };

  const handleResendOtp = async () => {
    if (!emailForOtp) {
      alert("Email not found. Please register again.");
      setStep(1);
      return;
    }

    setResendLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/auth/resend-otp",
        { email: emailForOtp },
        { withCredentials: true }
      );
      alert("🔁 " + res.data.message);
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || err.message));
    } finally {
      setResendLoading(false);
    }
  };

  const togglePassword = () => setShowPassword((prev) => !prev);

  const getPasswordStrengthColor = () => {
    if (passwordStrength === "Weak") return "text-red-500";
    if (passwordStrength === "Medium") return "text-yellow-500";
    if (passwordStrength === "Strong") return "text-green-500";
    return "text-gray-400";
  };

  const getPasswordStrengthBg = () => {
    if (passwordStrength === "Weak") return "bg-red-100";
    if (passwordStrength === "Medium") return "bg-yellow-100";
    if (passwordStrength === "Strong") return "bg-green-100";
    return "bg-gray-100";
  };

  return (
    <>
<Header />

<div className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-[#A8BBA3] via-[#F7F4EA] to-[#A8BBA3]
    px-4 py-10">

  <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
    
    {/* Left side info panel */}
    <div className="hidden md:flex flex-col justify-between 
        bg-[#A8BBA3] text-gray-900 rounded-3xl p-8 
        border border-white/40 shadow-2xl md:w-5/12">
      
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full 
            bg-white/40 text-gray-900 text-xs font-semibold mb-4">
          <FaShieldAlt className="text-xs" />
          Secure Skill Swap Platform
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Join the Skill Swap Community
        </h1>

        <p className="text-sm text-gray-700 mb-6">
          Learn new skills, share your knowledge, and connect with people
          worldwide.
        </p>

        <div className="space-y-3 text-gray-800 text-sm">
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-800" />
            <span>Secure email verification with OTP</span>
          </div>

          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-800" />
            <span>Create a rich profile with your bio & city</span>
          </div>

          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-800" />
            <span>Start adding your skills right after signup</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-800">
        <span className="font-semibold">Tip:</span> Use real contact number
      </div>
    </div>

    {/* Right side form card */}
    <div className="bg-[#F7F4EA] rounded-3xl shadow-2xl w-full md:w-7/12 
        p-6 md:p-8 border border-[#A8BBA3]/40">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${
                    step === 1
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  1
                </div>
                <div className="text-sm">
                  <div
                    className={`font-semibold ${
                      step === 1 ? "text-indigo-600" : "text-gray-500"
                    }`}
                  >
                    Create Account
                  </div>
                  <div className="text-xs text-gray-400">
                    Fill your details carefully
                  </div>
                </div>
              </div>

              <FaArrowRight className="text-gray-300 text-lg" />

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${
                    step === 2
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  2
                </div>
                <div className="text-sm">
                  <div
                    className={`font-semibold ${
                      step === 2 ? "text-emerald-500" : "text-gray-500"
                    }`}
                  >
                    Verify Email
                  </div>
                  <div className="text-xs text-gray-400">
                    Enter OTP from your inbox
                  </div>
                </div>
              </div>
            </div>

            {step === 1 && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                  User Registration
                </h2>
                <p className="text-sm text-gray-500 mb-5 flex items-center gap-2">
                  <FaInfoCircle className="text-blue-400" />
                  Fill all required fields to continue.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaUser className="text-gray-400" /> Username
                    </label>
                    <input
                      type="text"
                      name="Username"
                      placeholder="e.g. KrishPatel"
                      value={form.Username}
                      onChange={handleChange}
                      required
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                    />
                    {errors.Username && (
                      <p className="text-xs text-red-500">{errors.Username}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaEnvelope className="text-gray-400" /> Email
                    </label>
                    <input
                      type="email"
                      name="Email"
                      placeholder="you@example.com"
                      value={form.Email}
                      onChange={handleChange}
                      required
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                    />
                    {errors.Email && (
                      <p className="text-xs text-red-500">{errors.Email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaLock className="text-gray-400" /> Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="Password"
                        placeholder="Minimum 6 characters"
                        value={form.Password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="p-3 border rounded-xl w-full pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <span
                        onClick={togglePassword}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer text-lg"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                    {errors.Password && (
                      <p className="text-xs text-red-500">{errors.Password}</p>
                    )}
                    {passwordStrength && (
                      <div
                        className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${getPasswordStrengthBg()} ${getPasswordStrengthColor()}`}
                      >
                        <FaShieldAlt className="text-xs" />
                        <span>Password strength: {passwordStrength}</span>
                      </div>
                    )}
                  </div>

                  {/* DOB */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaCalendarAlt className="text-gray-400" /> Date of Birth
                    </label>
                    <input
                      type="date"
                      name="DateOfBirth"
                      value={form.DateOfBirth}
                      onChange={handleChange}
                      required
                      max={new Date().toISOString().split("T")[0]}
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                    />
                    {errors.DateOfBirth && (
                      <p className="text-xs text-red-500">
                        {errors.DateOfBirth}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaTransgender className="text-gray-400" /> Gender
                    </label>
                    <select
                      name="Gender"
                      value={form.Gender}
                      onChange={handleChange}
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Street */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-gray-400" /> Street No
                    </label>
                    <input
                      type="text"
                      name="StreetNo"
                      placeholder="Street / House No"
                      value={form.StreetNo}
                      onChange={handleChange}
                      required
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                    />
                    {errors.StreetNo && (
                      <p className="text-xs text-red-500">{errors.StreetNo}</p>
                    )}
                  </div>

                  {/* Area */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-gray-400" /> Area
                    </label>
                    <input
                      type="text"
                      name="Area"
                      placeholder="Area / Locality"
                      value={form.Area}
                      onChange={handleChange}
                      required
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                    />
                    {errors.Area && (
                      <p className="text-xs text-red-500">{errors.Area}</p>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-gray-400" /> City
                    </label>
                    <select
                      name="City"
                      value={form.City}
                      onChange={handleChange}
                      required
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                    >
                      <option value="">Select City</option>
                      {cities.map((city) => (
                        <option key={city._id} value={city._id}>
                          {city.cityName}
                        </option>
                      ))}
                    </select>
                    {errors.City && (
                      <p className="text-xs text-red-500">{errors.City}</p>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaPhoneAlt className="text-gray-400" /> Contact No
                    </label>
                    <input
                      type="tel"
                      name="ContactNo"
                      placeholder="10 digit mobile no."
                      value={form.ContactNo}
                      onChange={handlecont}
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                    />
                    {errors.ContactNo && (
                      <p className="text-xs text-red-500">
                        {errors.ContactNo}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaInfoCircle className="text-gray-400" /> Bio{" "}
                      <span className="text-gray-400 text-[11px]">
                        (optional, max 200 characters)
                      </span>
                    </label>
                    <textarea
                      name="Bio"
                      placeholder="Tell others about your skills and interests..."
                      value={form.Bio}
                      onChange={handleChange}
                      className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full min-h-[80px]"
                    />
                    {errors.Bio && (
                      <p className="text-xs text-red-500">{errors.Bio}</p>
                    )}
                  </div>

                  {/* Profile Image */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <FaImage className="text-gray-400" /> Profile Image{" "}
                      <span className="text-gray-400 text-[11px]">
                        (optional, JPG/PNG, max 2MB)
                      </span>
                    </label>
                    <input
                      type="file"
                      name="profileImage"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleChange}
                      className="p-2 border rounded-xl w-full text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {errors.profileImage && (
                      <p className="text-xs text-red-500">
                        {errors.profileImage}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`mt-2 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl hover:opacity-95 hover:shadow-lg transition transform hover:-translate-y-0.5 md:col-span-2 flex items-center justify-center gap-2 text-sm ${
                      loading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Creating your account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <FaArrowRight />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
                  Verify OTP
                </h2>
                <p className="text-sm text-gray-500 text-center mb-5">
                  We&apos;ve sent a 5-digit OTP to{" "}
                  <span className="font-semibold text-indigo-600">
                    {emailForOtp}
                  </span>
                  . Enter it below to verify your account.
                </p>

                <form
                  onSubmit={handleOtpVerify}
                  className="flex flex-col gap-4 items-center"
                >
<input
  type="text"
  placeholder="Enter OTP"
  value={otp}
  onChange={(e) => {
    // Only number allow + max 6 digit
    const onlyNums = e.target.value.replace(/\D/g, "");
    setOtp(onlyNums.slice(0, 6));
  }}
  required
  maxLength={6}
  pattern="[0-9]{6}"
  className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center tracking-[0.4em] text-lg font-semibold"
/>


                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <FaCheckCircle />
                    Verify OTP & Continue
                  </button>
                </form>

                <button
                  onClick={handleResendOtp}
                  type="button"
                  disabled={resendLoading}
                  className={`mt-5 w-full py-2.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 
                  ${
                    resendLoading
                      ? "bg-blue-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {resendLoading ? "Resending OTP..." : "Resend OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-4 text-xs text-gray-500 underline w-full text-center"
                >
                  Change email / details?
                </button>
              </>
            )}

            <p className="mt-6 text-center text-gray-500 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 font-medium hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Register;
