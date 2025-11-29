import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-white after:w-full"
      : "text-slate-300 hover:text-white after:w-0";

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800">
      {/* header height & width control */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        {/* Logo */}
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => navigate("/")}
        >
          <img
            src="/sslogo.png"
            alt="SkillSwap Logo"
            className="h-10 w-auto object-contain"   // ⬅ logo moto
          />
          <span className="hidden text-sm font-semibold uppercase tracking-[0.30em] text-slate-100 sm:inline">
            SkillSwap
          </span>
        </div>

        {/* Nav + buttons */}
        <nav className="flex flex-1 items-center justify-end gap-8">
          {/* Left links */}
          <div className="hidden items-center gap-6 text-sm md:text-base font-medium md:flex">
            <Link
              to="/"
              className={`relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-sky-400 after:to-emerald-400 after:transition-all ${isActive(
                "/"
              )}`}
            >
              Home
            </Link>
            <Link
              to="/services"
              className={`relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-sky-400 after:to-emerald-400 after:transition-all ${isActive(
                "/services"
              )}`}
            >
              Services
            </Link>
            <Link
              to="/about"
              className={`relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-sky-400 after:to-emerald-400 after:transition-all ${isActive(
                "/about"
              )}`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-sky-400 after:to-emerald-400 after:transition-all ${isActive(
                "/contact"
              )}`}
            >
              Contact
            </Link>
          </div>

          {/* Right buttons – bigger */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-slate-600/80 bg-slate-900/70 px-5 py-2 text-sm font-semibold text-slate-100 shadow-md backdrop-blur hover:border-sky-400/70 hover:text-sky-300 hover:shadow-lg transition-all"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-md hover:brightness-110 hover:shadow-xl transition-all"
            >
              Register
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
