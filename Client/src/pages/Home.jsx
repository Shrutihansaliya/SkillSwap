// Client/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

import hero1 from "../assets/hero1.png";
import hero2 from "../assets/hero2.png";
import hero3 from "../assets/hero3.png";
import hero4 from "../assets/hero4.png";

export default function Home() {
  const navigate = useNavigate();
  const images = [hero1, hero2, hero3, hero4];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("Current slide index:", index);
  }, [index]);

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-3px) scale(1.04)";
    e.currentTarget.style.boxShadow =
      "0 0 28px rgba(139,92,246,0.62), 0 6px 30px rgba(79,70,229,0.18)";
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0) scale(1)";
    e.currentTarget.style.boxShadow =
      "0 0 18px rgba(139,92,246,0.45), 0 6px 18px rgba(79,70,229,0.12)";
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f7fafc" }}>
      <Header />

      {/* HERO */}
      <section style={{ position: "relative", height: "70vh", width: "100%", overflow: "hidden" }}>
        {images.map((src, i) => {
          const isActive = i === index;
          return (
            <div
              key={i}
              aria-hidden={!isActive}
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "opacity 1s ease-in-out",
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 5 : 1,
              }}
            />
          );
        })}

        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4))", zIndex: 6 }} />

        <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 1rem" }}>
          <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 800, lineHeight: 1.05 }}>
            Welcome to <span style={{ color: "#a78bfa" }}>SkillSwap</span>
          </h1>
          <p style={{ marginTop: "0.75rem", maxWidth: 720, color: "rgba(255,255,255,0.92)" }}>
            Learn, share and exchange real skills with the community — book sessions, collaborate on projects, and grow together.
          </p>

          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={() => navigate("/register")}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%)",
                color: "white",
                padding: "0.9rem 2.2rem",
                borderRadius: 999,
                fontWeight: 700,
                letterSpacing: "0.6px",
                boxShadow: "0 0 18px rgba(139,92,246,0.45), 0 6px 18px rgba(79,70,229,0.12)",
                border: "none",
                cursor: "pointer",
                transition: "all 250ms cubic-bezier(.2,.9,.2,1)",
                transform: "translateY(0)",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.95 }}>
                <path d="M5 12h14" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5l7 7-7 7" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <span style={{ display: "inline-block" }}>Get Started</span>
            </button>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  transform: i === index ? "scale(1.3)" : "scale(1)",
                  background: i === index ? "white" : "rgba(255,255,255,0.6)",
                  border: "none",
                  transition: "all 200ms ease",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "4rem 1rem", background: "white" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>How It Works</h2>

        <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem" }}>

          {/* CARD 1 */}
          <div
            onClick={() => navigate("/register")}
            style={{
              padding: "1rem",
              borderRadius: 14,
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              cursor: "pointer",
              transition: "transform .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h3 style={{ fontWeight: 600 }}>1. Create an Account</h3>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              Sign up and set up your profile with your skills and interests.
            </p>
          </div>

          {/* CARD 2 */}
          <div
            onClick={() => navigate("/register")}
            style={{
              padding: "1rem",
              borderRadius: 14,
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              cursor: "pointer",
              transition: "transform .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h3 style={{ fontWeight: 600 }}>2. Explore & Connect</h3>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              Browse skills, message people and schedule sessions.
            </p>
          </div>

          {/* CARD 3 */}
          <div
            onClick={() => navigate("/register")}
            style={{
              padding: "1rem",
              borderRadius: 14,
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              cursor: "pointer",
              transition: "transform .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h3 style={{ fontWeight: 600 }}>3. Learn & Share</h3>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              Exchange knowledge, attend sessions and collaborate on projects.
            </p>
          </div>

        </div>
      </section>

      {/* OUR SERVICES */}
      <section style={{ padding: "3rem 1rem", background: "#f8fafc" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Our Services</h2>

        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem" }}>

          {/* SERVICE 1 */}
          <div
            onClick={() => navigate("/register")}
            style={{
              padding: "1rem",
              borderRadius: 12,
              background: "white",
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              cursor: "pointer",
              transition: "transform .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h3 style={{ fontWeight: 600 }}>Learn</h3>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              Access skill-based tutorials and resources.
            </p>
          </div>

          {/* SERVICE 2 */}
          <div
            onClick={() => navigate("/register")}
            style={{
              padding: "1rem",
              borderRadius: 12,
              background: "white",
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              cursor: "pointer",
              transition: "transform .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h3 style={{ fontWeight: 600 }}>Share</h3>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              Share your knowledge and experiences with others.
            </p>
          </div>

          {/* SERVICE 3 */}
          <div
            onClick={() => navigate("/register")}
            style={{
              padding: "1rem",
              borderRadius: 12,
              background: "white",
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              cursor: "pointer",
              transition: "transform .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h3 style={{ fontWeight: 600 }}>Collaborate</h3>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              Work together on projects and enhance your skills.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
