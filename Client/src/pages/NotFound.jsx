// src/pages/NotFound.jsx
import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 
      bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA]"
    >
      <div className="max-w-xl w-full bg-[#F7F4EA]/95 rounded-3xl shadow-2xl p-8 text-center border border-[#A8BBA3]/70">
        {/* Icon circle */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#B87C4C]/10 mb-6 mx-auto border border-[#B87C4C]/30">
          <FiAlertTriangle className="text-[#B87C4C] text-3xl" />
        </div>

        {/* Code + message */}
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent mb-2">
          404
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-1">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mb-6">
          It might have been moved, renamed, or removed.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-[#CBBFAE] text-[#8E5C32] text-sm font-medium 
            bg-white/70 hover:bg-[#F0E2D2] transition-all"
          >
            ⬅ Go Back
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white 
            bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] 
            hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
