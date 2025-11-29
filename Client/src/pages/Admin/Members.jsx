// src/pages/Admin/Members.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle } from "react-icons/fa";
import { FiFileText, FiBookOpen, FiExternalLink, FiX } from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext.jsx";

const API_BASE = "http://localhost:4000";

export default function Members() {
  const { setMessage } = useAdmin();
  const [members, setMembers] = useState([]);
  const [popup, setPopup] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debounce, setDebounce] = useState("");

  // small debounce for search
  useEffect(() => {
    const t = setTimeout(() => setDebounce(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // load members
  useEffect(() => {
    axios
      .get("/api/admin/members")
      .then((res) => res.data?.success && setMembers(res.data.data))
      .catch(() => setMessage("Failed to fetch members"));
  }, [setMessage]);

  // filtered list
  const filter = members.filter((m) => {
    const q = debounce.toLowerCase();
    return (
      m.Username?.toLowerCase().includes(q) ||
      m.Email?.toLowerCase().includes(q) ||
      JSON.stringify(m.Skills).toLowerCase().includes(q)
    );
  });

  const isPdf = (url) =>
    typeof url === "string" && url.toLowerCase().endsWith(".pdf");

  return (
    <>
      {/* SEARCH */}
      <div className="flex justify-center mb-6">
        <input
          placeholder="Search member..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-full px-4 py-2 w-full max-w-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* MEMBER CARDS – 4 per row on xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
        {filter.map((m) => (
          <div
            key={m._id}
            onClick={() => setPopup(m)}
            className="
              w-[270px]
              h-[340px]
              bg-white
              shadow-[0_8px_25px_rgba(0,0,0,0.12)]
              border border-gray-200
              cursor-pointer
              mx-auto
              transition-all duration-300
              hover:shadow-[0_12px_35px_rgba(0,0,0,0.20)]
              overflow-hidden
              flex flex-col
            "
          >
            {/* TOP NAVY HEADER */}
            <div className="h-16 bg-gradient-to-r from-[#0b1220] to-[#1c2943] text-white text-lg font-semibold flex items-center justify-between px-5">
              <span>{m.Username}</span>
              {m.IsVerified && <FaCheckCircle className="text-white text-xl" />}
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col items-center text-center px-5 pt-5">
              {/* ROUND PROFILE PIC – header niche */}
              <img
                src={
                  m.ProfileImageURL
                    ? `${API_BASE}${m.ProfileImageURL}`
                    : "/default-user.png"
                }
                className="w-25 h-25 rounded-full object-cover shadow-md border-4 border-white"
              />

              {/* EMAIL */}
              <p className="text-gray-700 text-sm mt-2">{m.Email}</p>

              {/* CITY */}
              <p className="text-gray-500 text-xs">
                {m.City?.CityName || "City Not Set"}
              </p>

              {/* BIO */}
              <p className="text-gray-600 text-xs italic mt-1 h-[20px] overflow-hidden">
                {m.Bio || "student"}
              </p>

              {/* SKILLS */}
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {m.Skills?.length > 0 ? (
                  m.Skills.map((s, i) => (
                    <span
                      key={i}
                      className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-[2px] rounded-full border border-indigo-200"
                    >
                      {s.Name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-[10px] italic">
                    No Skills
                  </span>
                )}
              </div>
            </div>

            {/* PROFILE BUTTON */}
            <div className="pb-4 flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPopup(m);
                }}
                className="px-6 py-2 text-sm rounded-full bg-[#0b1220] text-white hover:bg-[#1f2a3d] transition shadow-sm"
              >
                Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* POPUP */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPopup(null)}
          />

          <div className="relative z-10 w-full max-w-3xl mx-4">
            <div className="bg-white/95 border border-white/60 rounded-2xl shadow-2xl overflow-hidden">
              {/* POPUP HEADER */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-pink-500">
                <div className="flex items-center gap-3">
                 <div className="w-24 h-24 bg-white/20 flex items-center justify-center">
  <img
    src={
      popup.ProfileImageURL
        ? `${API_BASE}${popup.ProfileImageURL}`
        : "/default-user.png"
    }
    className="w-full h-full object-cover border-2 border-white shadow-lg"
  />
</div>

                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">
                      {popup.Username}
                    </h3>
                    <p className="text-white/90 text-xs">
                      {popup.Email || "No email"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPopup(null)}
                  className="p-2 rounded-md bg-blue-600 hover:bg-blue-800 text-white shadow-sm transition"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* POPUP BODY */}
              <div className="p-6 bg-gradient-to-b from-white to-white/95 max-h-[80vh] overflow-y-auto">
                {/* Top info blocks */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex-1 min-w-[220px]">
                    <h4 className="font-semibold text-gray-800 mb-1">
                      Contact Info
                    </h4>
                    <p className="text-sm text-gray-700">
                      <b>Email:</b> {popup.Email || "-"}
                    </p>
                    <p className="text-sm text-gray-700">
                      <b>Contact:</b> {popup.ContactNo || "-"}
                    </p>
                    <p className="text-sm text-gray-700">
                      <b>Bio:</b> {popup.Bio || "No bio available"}
                    </p>
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <h4 className="font-semibold text-gray-800 mb-1">
                      Address
                    </h4>
                    <p className="text-sm text-gray-700">
                      {popup.StreetNo || ""} {popup.Area || ""}{" "}
                      {popup.City?.CityName || ""}
                    </p>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  🛠 Skills
                </h2>

                {/* No skills */}
                {(!popup.Skills || popup.Skills.length === 0) && (
                  <p className="text-gray-400 text-sm">No skills available</p>
                )}

                {/* Skills list */}
                {popup.Skills?.map((s, i) => (
                  <div
                    key={i}
                    className={`mb-5 rounded-2xl border border-gray-200 shadow-sm p-4 ${
                      s.SkillAvailability === "Unavailable"
                        ? "opacity-40 blur-[0.5px]"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800 text-[15px]">
                          {s.Name || "Unnamed Skill"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {s.CertificateStatus || "-"} • Availability:{" "}
                          {s.SkillAvailability || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Certificate */}
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-gray-700 mb-1">
                        Certificate
                      </h4>

                      {s.CertificateURL ? (
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-16 rounded-lg border bg-indigo-50 flex items-center justify-center">
                            <FiFileText className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              View Certificate
                            </p>
                            <a
                              href={`${API_BASE}${s.CertificateURL}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:opacity-95"
                            >
                              <FiFileText className="w-4 h-4" />
                              Open
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="italic text-gray-400 text-xs">
                          No certificate uploaded
                        </p>
                      )}
                    </div>

                    {/* Topics PDF */}
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-1">
                        Topics PDF
                      </h4>

                      {s.ContentFileURL && isPdf(s.ContentFileURL) ? (
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-16 rounded-lg border bg-purple-50 flex items-center justify-center">
                            <FiBookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <a
                              href={`${API_BASE}${s.ContentFileURL}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:opacity-95"
                            >
                              <FiBookOpen className="w-4 h-4" />
                              Open
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="italic text-gray-400 text-xs">
                          No Topics PDF
                        </p>
                      )}
                    </div>

                    {/* Source */}
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-1">
                        Source
                      </h4>

                      {s.Source ? (
                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border">
                          <FiExternalLink className="w-4 h-4 text-indigo-600" />
                          <div className="flex-1 break-words">{s.Source}</div>
                        </div>
                      ) : (
                        <p className="italic text-gray-400 text-xs">
                          No source provided
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}