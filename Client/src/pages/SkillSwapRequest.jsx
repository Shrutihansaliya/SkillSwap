import { useEffect, useState } from "react";
import axios from "axios";
import { FiSearch, FiFileText, FiExternalLink, FiX } from "react-icons/fi";

const SkillSwapRequests = () => {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [existingSwaps, setExistingSwaps] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSkillId, setActiveSkillId] = useState(null);

  const [selectedSkillDetail, setSelectedSkillDetail] = useState(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const openSkillModal = (skill, member) => {
    setSelectedSkillDetail({ ...skill, owner: member });
    setShowSkillModal(true);
    setActiveSkillId(skill._id);
  };

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) return (window.location.href = "/login");
    setUser(loggedUser);
  }, []);

  useEffect(() => {
    if (user) {
      fetchMembers();
      fetchRequests();
      fetchExistingSwaps();
    }
  }, [user]);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/requests/users/all"
      );
      setMembers(res.data.members || []);
      setFilteredMembers(res.data.members || []);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const userId = user._id || user.UserId || user.id;
      const [sentRes, receivedRes] = await Promise.all([
        axios.get(`http://localhost:4000/api/requests/sent/${userId}`),
        axios.get(`http://localhost:4000/api/requests/received/${userId}`),
      ]);
      const allRequests = [
        ...(sentRes.data.requests || sentRes.data || []),
        ...(receivedRes.data.requests || receivedRes.data || []),
      ];
      setRequests(allRequests);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const fetchExistingSwaps = async () => {
    try {
      const userId = user._id || user.UserId;
      const res = await axios.get(
        `http://localhost:4000/api/swaps/user/${userId}`
      );
      if (res.data.success) {
        const filtered = res.data.swaps.filter(
          (s) => s.Status === "Active" || s.Status === "Completed"
        );
        setExistingSwaps(filtered);
      }
    } catch (err) {
      console.error("Error fetching existing swaps:", err);
    }
  };

  const openPopup = (member) => {
    setSelectedMember(member);
    setSelectedSkill("");
    setShowPopup(true);
  };

  const sendRequest = async () => {
    if (!selectedSkill) return alert("Please select a skill.");
    if (!user?._id) return alert("User not found. Please login again.");
    if (!selectedMember?._id) return alert("Member not found.");

    try {
      const res = await axios.post(
        "http://localhost:4000/api/requests/send",
        {
          SenderId: user._id,
          ReceiverId: selectedMember._id,
          SkillToLearnId: selectedSkill,
        }
      );

      if (res.data.success) {
        alert("Request sent successfully!");
        setShowPopup(false);
        await fetchRequests();
      } else {
        alert(res.data.message || "Failed to send request.");
      }
    } catch (err) {
      console.error("Error sending request:", err);
      alert(err.response?.data?.message || "Error while sending request.");
    }
  };

  const hasPendingRequest = (memberId) =>
    requests.some(
      (r) =>
        String(r.SenderId?._id || r.SenderId) === String(user._id) &&
        String(r.ReceiverId?._id || r.ReceiverId) === String(memberId) &&
        r.Status === "Pending"
    );

  const hasExistingSwap = (memberId, skillId) => {
    return existingSwaps.some((swap) => {
      const sameSkill =
        String(swap.SkillToLearn?._id || swap.SkillToLearnId?._id) ===
        String(skillId);
      const samePair =
        (String(swap.Sender?._id) === String(user._id) &&
          String(swap.Receiver?._id) === String(memberId)) ||
        (String(swap.Receiver?._id) === String(user._id) &&
          String(swap.Sender?._id) === String(memberId));
      return sameSkill && samePair;
    });
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMembers(members);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = members.filter((m) => {
      const username = m.Username?.toLowerCase() || "";
      const skillNames = m.Skills.map(
        (s) => s.Skill?.Name?.toLowerCase() || ""
      ).join(" ");
      return username.includes(term) || skillNames.includes(term);
    });
    setFilteredMembers(filtered);
  }, [searchTerm, members]);

  const isPdf = (url) =>
    typeof url === "string" && url.toLowerCase().endsWith(".pdf");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F4EA] via-[#A8BBA3] to-[#F7F4EA] p-6 sm:p-8 rounded-2xl border border-[#A8BBA3]/60">
      {/* Search */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-5xl">
          <input
            type="text"
            placeholder="Search members by username or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-2 rounded-3xl border border-[#CBBFAE] 
             focus:ring-2 focus:ring-[#B87C4C]/40 outline-none shadow-md 
             placeholder-gray-400 placeholder:text-sm 
             text-gray-700 text-base sm:text-lg bg-[#F7F4EA]/90 transition-all duration-300 
             hover:shadow-lg"
          />

          <span className="absolute inset-y-0 left-5 flex items-center text-[#B87C4C] pointer-events-none">
            <FiSearch className="h-5 w-5" />
          </span>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] bg-clip-text text-transparent drop-shadow-sm">
        💫 Skill Swap Members
      </h1>

      {/* Popup (select skill) */}
      {showPopup && selectedMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-40">
          <div className="bg-[#F7F4EA] backdrop-blur-md p-6 rounded-2xl shadow-2xl w-96 border border-[#A8BBA3]/70 transform transition-all">
            <h2 className="font-semibold mb-4 text-lg text-[#B87C4C]">
              Select a skill to learn from{" "}
              <span className="font-bold">{selectedMember.Username}</span>
            </h2>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full border border-[#CBBFAE] rounded-lg p-2 mb-5 focus:ring-2 focus:ring-[#B87C4C]/40 outline-none bg-white/90 text-sm"
            >
              <option value="">Select Skill</option>

              {selectedMember.Skills.filter(
                (s) => s.SkillAvailability === "Available"
              ).map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.Skill?.Name || "Unnamed Skill"}
                </option>
              ))}
            </select>
            <div className="flex justify-between gap-3">
              <button
                onClick={sendRequest}
                className="flex-1 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] hover:shadow-lg text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                Send
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 bg-gradient-to-r from-gray-400 to-gray-600 hover:shadow-lg text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill modal */}
      {showSkillModal && selectedSkillDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowSkillModal(false);
              setSelectedSkillDetail(null);
              setActiveSkillId(null);
            }}
          />

          <div className="relative z-10 w-full max-w-2xl mx-4">
            <div className="bg-[#F7F4EA]/95 border border-[#A8BBA3]/70 rounded-2xl shadow-2xl overflow-hidden">
              {/* header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#B87C4C] to-[#A8BBA3]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-white/20 flex items-center justify-center text-white font-semibold text-lg">
                    {selectedSkillDetail.Skill?.Name?.charAt(0)?.toUpperCase() ||
                      "S"}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">
                      {selectedSkillDetail.Skill?.Name || "Skill"}
                    </h3>
                    <p className="text-white/90 text-sm">
                      From {selectedSkillDetail.owner?.Username}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowSkillModal(false);
                    setSelectedSkillDetail(null);
                    setActiveSkillId(null);
                  }}
                  className="p-2 rounded-md bg-white/20 hover:bg-white/30 text-white transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* content */}
              <div className="p-6 bg-gradient-to-b from-[#F7F4EA] to-white">
                
                {/* Certificate */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Certificate
                  </h4>

                  {selectedSkillDetail.CertificateURL ? (
                    <div className="flex items-center gap-4">
                      <div className="w-28 h-20 rounded-lg border border-[#CBBFAE] bg-[#A8BBA3]/25 flex items-center justify-center">
                        <FiFileText className="w-8 h-8 text-[#B87C4C]" />
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {selectedSkillDetail.CertificateName ||
                            "View Certificate"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Issued:{" "}
                          {selectedSkillDetail.AddedDate
                            ? new Date(
                                selectedSkillDetail.AddedDate
                              ).toLocaleDateString()
                            : "—"}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <a
                            href={`http://localhost:4000${selectedSkillDetail.CertificateURL}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-lg bg-[#B87C4C] text-white font-medium hover:bg-[#8E5C32] inline-flex items-center gap-2"
                          >
                            <FiFileText /> Open Certificate
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="italic text-gray-400">
                      No certificate available
                    </div>
                  )}
                </div>

                {/* Source */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Source
                  </h4>

                  {selectedSkillDetail.Source ? (
                    selectedSkillDetail.Source.toString().startsWith("http") ? (
                      <a
                        href={selectedSkillDetail.Source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A8BBA3]/25 hover:bg-[#A8BBA3]/45 border border-[#A8BBA3]/60 text-[#31513A] font-medium shadow-sm transition"
                      >
                        <FiExternalLink /> Open Source
                      </a>
                    ) : (
                      <div className="px-4 py-3 rounded-lg bg-white border border-[#CBBFAE] text-gray-700">
                        {selectedSkillDetail.Source}
                      </div>
                    )
                  ) : (
                    <div className="italic text-gray-400">
                      No source available
                    </div>
                  )}
                </div>

                {/* CONTENT FILE */}
                <div className="mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Content File
                  </h4>

                  {selectedSkillDetail.ContentFileURL ? (
                    <div className="flex items-center gap-4">
                      <div className="w-28 h-20 rounded-lg border border-[#CBBFAE] bg-[#FDECEF] flex items-center justify-center">
                        <FiFileText className="w-8 h-8 text-[#B87C4C]" />
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {selectedSkillDetail.ContentFileName ||
                            "View Content File"}
                        </div>

                        <div className="mt-3 flex gap-2 items-center">
                          <a
                            href={`http://localhost:4000${selectedSkillDetail.ContentFileURL}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-lg bg-[#B87C4C] text-white font-medium hover:bg-[#8E5C32] inline-flex items-center gap-2"
                          >
                            <FiFileText /> Open Content
                          </a>

                          {isPdf(selectedSkillDetail.ContentFileURL) && (
                            <span className="text-xs text-gray-500">
                              PDF File
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="italic text-gray-400">
                      No content file available
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 flex justify-end bg-[#F7F4EA]">
                <button
                  onClick={() => {
                    setShowSkillModal(false);
                    setSelectedSkillDetail(null);
                    setActiveSkillId(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-gray-400 to-gray-600 text-white font-semibold hover:scale-105 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member cards */}
      <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-8 mt-4">
        {filteredMembers
          .filter((m) => m._id !== user._id && m.Role !== "Admin")
          .map((m) => {
            const isPending = hasPendingRequest(m._id);
            const isOutOfSwaps = m.SwapsRemaining === 0;

            return (
              <div
                key={m._id}
                className="bg-gradient-to-tr from-[#F7F4EA] via-white to-[#A8BBA3]/50 p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border border-[#A8BBA3]/70"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#B87C4C]/20 rounded-full flex items-center justify-center text-[#B87C4C] font-bold text-xl">
                    {m.Username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#8E5C32]">
                      {m.Username}
                    </h3>
                    <p className="text-sm text-gray-600">{m.Email}</p>
                  </div>
                </div>

                {isOutOfSwaps && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">
                    No swaps left for this user
                  </p>
                )}

                {/* Skills */}
                <div className="mt-2 flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Skills:
                  </h4>

                  {m.Skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {m.Skills.filter(
                        (s) => s.SkillAvailability === "Available"
                      ).map((s) => {
                        const skillId = s._id;
                        const isActive = activeSkillId === skillId;
                        const disabledForSwap = hasExistingSwap(
                          m._id,
                          skillId
                        );

                        return (
                          <div key={skillId} className="relative">
                            <button
                              onClick={() => {
                                const isActiveNow = activeSkillId === skillId;
                                setActiveSkillId(
                                  isActiveNow ? null : skillId
                                );
                                openSkillModal(s, m);
                              }}
                              disabled={disabledForSwap}
                              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                                disabledForSwap
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : isActive
                                  ? "bg-[#B87C4C] text-white shadow-lg"
                                  : "bg-[#A8BBA3]/40 text-[#31513A] hover:bg-[#A8BBA3]/70"
                              }`}
                            >
                              {s.Skill?.Name || "Unnamed Skill"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs italic text-gray-400">
                      No skills
                    </span>
                  )}
                </div>

                <button
                  onClick={() => openPopup(m)}
                  disabled={isOutOfSwaps || isPending}
                  className={`mt-4 w-full py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-300 ${
                    isPending
                      ? "bg-gray-400 cursor-not-allowed"
                      : isOutOfSwaps
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] hover:scale-105 hover:shadow-lg"
                  }`}
                >
                  {isPending
                    ? "Requested"
                    : isOutOfSwaps
                    ? "Out of Swaps"
                    : "Send Request"}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default SkillSwapRequests;
