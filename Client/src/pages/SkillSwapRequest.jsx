// SkillSwapRequest.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiSearch,
  FiFileText,
  FiExternalLink,
  FiX,
  FiUsers,
  FiBook,
  FiMapPin,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
import { toast } from "react-toastify";

const SkillSwapRequests = () => {
  const [user, setUser] = useState(null);

  // DATA STATES
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [existingSwaps, setExistingSwaps] = useState([]);

  // CATEGORY & SKILL FILTER STATES
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterSkillList, setFilterSkillList] = useState([]);
  const [selectedFilterSkill, setSelectedFilterSkill] = useState("");

  // UI STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState("");

  // SKILL MODAL
  const [selectedSkillDetail, setSelectedSkillDetail] = useState(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  // CATEGORY IMAGE PREVIEW
  const [modalImage, setModalImage] = useState("");
  const [showModal, setShowModal] = useState(false);

  // CATEGORY CAROUSEL
  const [categoryStartIndex, setCategoryStartIndex] = useState(0);
  const categoriesPerView = 5;

  // --------------------------
  // LOGIN CHECK
  // --------------------------
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) return (window.location.href = "/login");

    setUser(loggedUser);
  }, []);

  // --------------------------
  // FETCH ALL DATA AFTER LOGIN
  // --------------------------
  useEffect(() => {
    if (user) {
      fetchMembers();
      fetchRequests();
      fetchExistingSwaps();
      fetchCategories();
    }
  }, [user]);

  // ------------------------------
  // FETCH MEMBERS
  // ------------------------------
  const fetchMembers = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/requests/members");

      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error("Member fetch error:", err);
    }
  };

  // ------------------------------
  // FETCH CATEGORIES + SKILLS
  // ------------------------------
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/requests/categories");

      if (res.data.success) {
        setCategories(res.data.categories);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (err) {
      console.error("Category fetch error:", err);
      toast.error("Failed to load categories");
    }
  };

  // ------------------------------
  // FETCH REQUESTS
  // ------------------------------
  const fetchRequests = async () => {
    try {
      const userId = user._id || user.UserId || user.id;

      const [sentRes, receivedRes] = await Promise.all([
        axios.get(`http://localhost:4000/api/requests/sent/${userId}`),
        axios.get(`http://localhost:4000/api/requests/received/${userId}`),
      ]);

      const allRequests = [
        ...(sentRes.data.requests || []),
        ...(receivedRes.data.requests || []),
      ];

      setRequests(allRequests);
    } catch (err) {
      console.error("Request fetch error:", err);
    }
  };

  // ------------------------------
  // EXISTING SWAPS
  // ------------------------------
  const fetchExistingSwaps = async () => {
    try {
      const userId = user._id || user.UserId;
      const res = await axios.get(`http://localhost:4000/api/swaps/user/${userId}`);

      if (res.data.success) {
        const filtered = res.data.swaps.filter(
          (s) => s.Status === "Active" || s.Status === "Completed"
        );
        setExistingSwaps(filtered);
      }
    } catch (err) {
      console.error("Swap fetch error:", err);
    }
  };

  // ------------------------------
  // CATEGORY CLICK — LOAD SKILLS
  // ------------------------------
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);

    const selectedCat = categories.find((c) => c.CategoryId === categoryId);

    if (selectedCat) {
      setFilterSkillList(selectedCat.skills); // FIXED HERE
    } else {
      setFilterSkillList([]);
    }

    setSelectedFilterSkill("");
    setFilteredMembers([]);
  };

  // ------------------------------
  // FILTER MEMBERS — FIXED 🔥
  // ------------------------------
  useEffect(() => {
    let result = [...members];

    const hasCategory = !!selectedCategory;
    const hasSkill = !!selectedFilterSkill;
    const hasSearch = searchTerm.trim() !== "";

    if (!hasCategory && !hasSkill && !hasSearch) {
      setFilteredMembers([]);
      return;
    }

    // -------------------------
    // 1) FILTER BY CATEGORY
    // -------------------------
    if (hasCategory) {
      result = result.filter((m) =>
        m.Skills.some(
          (s) =>
            s.Skill &&
            Number(s.Skill.CategoryId) === Number(selectedCategory)
        )
      );
    }

    // -------------------------
    // 2) FILTER BY SKILL
    // -------------------------
    if (hasSkill) {
      result = result.filter((m) =>
        m.Skills.some((s) => String(s.SkillId) === String(selectedFilterSkill))
      );
    }

    // -------------------------
    // 3) SEARCH FILTER — FIXED 🔥
    // -------------------------
    if (hasSearch) {
      const term = searchTerm.toLowerCase();

      result = result.filter((m) => {
        const username = m.Username?.toLowerCase() || "";
        const city = m.City?.cityName?.toLowerCase() || "";

        const skillNames = m.Skills.map(
          (s) => s.Skill?.Name?.toLowerCase() || ""
        ).join(" ");

        return (
          username.includes(term) ||
          city.includes(term) ||
          skillNames.includes(term)
        );
      });
    }

    setFilteredMembers(result);
  }, [selectedCategory, selectedFilterSkill, searchTerm, members]);

  // ------------------------------
  // CHECK IF REQUEST ALREADY SENT
  // ------------------------------
  const hasPendingRequest = (memberId) =>
    requests.some(
      (r) =>
        String(r.SenderId?._id || r.SenderId) === String(user._id) &&
        String(r.ReceiverId?._id || r.ReceiverId) === String(memberId) &&
        r.Status === "Pending"
    );

  // ------------------------------
  // CHECK EXISTING SWAP
  // ------------------------------
  const hasExistingSwap = (memberId, skillId) =>
    existingSwaps.some((swap) => {
      const sameSkill =
        String(swap.SkillToLearn?.SkillId || swap.SkillToLearnId) ===
        String(skillId);

      const samePair =
        (String(swap.Sender?._id) === String(user._id) &&
          String(swap.Receiver?._id) === String(memberId)) ||
        (String(swap.Receiver?._id) === String(user._id) &&
          String(swap.Sender?._id) === String(memberId));

      return sameSkill && samePair;
    });

  // ------------------------------
  // OPEN POPUP
  // ------------------------------
  const openPopup = (member) => {
    setSelectedMember(member);
    setSelectedSkill("");
    setShowPopup(true);
  };

  // ------------------------------
  // SEND REQUEST
  // ------------------------------
  const sendRequest = async () => {
    if (!selectedSkill) return toast.error("Please select a skill.");

    try {
      const res = await axios.post("http://localhost:4000/api/requests/send", {
        SenderId: user._id,
        ReceiverId: selectedMember._id,
        SkillToLearnId: selectedSkill,
      });

      if (res.data.success) {
        toast.success("Request sent successfully!");
        setShowPopup(false);
        await fetchRequests();
      } else {
        toast.error(res.data.message || "Failed to send request.");
      }
    } catch (err) {
      toast.error("Error while sending request.");
    }
  };

  // ------------------------------
  // SKILL MODAL OPEN
  // ------------------------------
  const openSkillModal = (skillObj, owner) => {
    setSelectedSkillDetail({ ...skillObj, owner });
    setShowSkillModal(true);
  };

  // ------------------------------
  // HELPER: PDF CHECK
  // ------------------------------
  const isPdf = (url) =>
    typeof url === "string" && url.toLowerCase().endsWith(".pdf");

  // ------------------------------
  // CATEGORY CAROUSEL VISIBLE ITEMS
  // ------------------------------
  const visibleCategories = categories.slice(
    categoryStartIndex,
    categoryStartIndex + categoriesPerView
  );
const resetFilters = () => {
  setSelectedCategory("");
  setSelectedFilterSkill("");
  setFilterSkillList([]);
  setSearchTerm("");
  setFilteredMembers([]);
  setSelectedMember(null);
  // scroll top optional
  window.scrollTo({ top: 0, behavior: "smooth" });
};

  // ------------------------------
  // UI STARTS HERE
  // ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] via-[#E8F0E3] to-[#F8F5F0] p-6">

      {/* ⭐ CATEGORY CAROUSEL */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <FiBook className="text-[#B87C4C]" />
              Browse Categories
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => categoryStartIndex > 0 && setCategoryStartIndex(categoryStartIndex - 1)}
                disabled={categoryStartIndex === 0}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                <FiChevronLeft />
              </button>

              <button
                onClick={() =>
                  categoryStartIndex + categoriesPerView < categories.length &&
                  setCategoryStartIndex(categoryStartIndex + 1)
                }
                disabled={categoryStartIndex + categoriesPerView >= categories.length}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          <div className="flex gap-3 overflow-hidden">
            {visibleCategories.map((category) => (
              <button
                key={category.CategoryId}
                onClick={() => handleCategoryClick(category.CategoryId)}
                className={`w-28 h-28 flex-shrink-0 rounded-xl border-2 overflow-hidden ${
                  selectedCategory === category.CategoryId
                    ? "border-[#B87C4C] ring-2 ring-[#B87C4C]/30"
                    : "border-gray-200 hover:border-[#A8BBA3]"
                }`}
              >
                <div className="h-3/4 bg-gray-100 overflow-hidden">
                  <img
                    src={`http://localhost:4000/icons/${category.image || "default.jpg"}`}
                    className="w-full h-full object-cover"
                    alt=""
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImage(`http://localhost:4000/icons/${category.image}`);
                      setShowModal(true);
                    }}
                  />
                </div>
                <div className="h-1/4 flex items-center justify-center text-xs font-medium">
                  {category.CategoryName}
                </div>
              </button>
            ))} {/* VIEW MORE CARD */}
            {categories.length > categoriesPerView && (
              <button
                className="flex-shrink-0 w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-[#B87C4C] hover:bg-gray-50 transition-all"
                onClick={() => {
                  nextCategories();
                }}
              >
                <FiChevronRight className="w-6 h-6 text-gray-400 mb-2" />
                <p className="text-xs font-medium text-gray-600">
                  View More
                </p>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* ⭐ FILTER SECTION */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
    <FiUsers className="text-[#B87C4C]" />
    Skill Swap Request
  </h1>

  <button
    onClick={resetFilters}
    className="px-4 py-2 bg-[#B87C4C] text-white rounded-lg shadow hover:bg-[#8E5C32] transition-all"
  >
    Refresh Filters
  </button>
</div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">

            {/* SKILL DROPDOWN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Skill to Learn
              </label>

              <select
                value={selectedFilterSkill}
                onChange={(e) => setSelectedFilterSkill(e.target.value)}
                disabled={!selectedCategory}
                 className="w-full p-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-1 focus:ring-[#B87C4C] focus:border-[#B87C4C] disabled:bg-gray-100 disabled:text-gray-500 transition-all text-sm"

              >
                <option value="">Choose a skill</option>

                {filterSkillList.map((s) => (
                  <option key={s.SkillId} value={s.SkillId}>
                    {s.Name}
                  </option>
                ))}
              </select>
            </div>

            {/* SEARCH */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <FiSearch /> Search Members
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username, skill, city..."
                 className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-1 focus:ring-[#B87C4C] focus:border-[#B87C4C] transition-all text-sm"

              />
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ RESULT SECTION */}
      <div className="max-w-6xl mx-auto">

        {/* EMPTY STATES */}
       {/* EMPTY STATES */}
        {!selectedCategory && searchTerm.trim() === "" && (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-[#F7F4EA] to-[#A8BBA3] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUsers className="w-6 h-6 text-[#B87C4C]" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              Welcome to Skill Swap
            </h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
              Select a category from above, then choose the skill you want to learn to discover available members.
            </p>
          </div>
        )}

        {selectedCategory && !selectedFilterSkill && searchTerm.trim() === "" && (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="w-14 h-14 bg-[#A8BBA3] rounded-full flex items-center justify-center mx-auto mb-3">
              <FiBook className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-2">
              Great! You've selected a category
            </h3>
            <p className="text-gray-600 text-sm">
              Now choose the specific skill you want to learn from the dropdown above.
            </p>
          </div>
        )}

        {selectedCategory && selectedFilterSkill && filteredMembers.length === 0 && (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiSearch className="w-5 h-5 text-gray-500" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-2">
              No Members Found
            </h3>
            <p className="text-gray-600 text-sm">
              No members match your selected skill or search criteria.
            </p>
          </div>
        )}

        {/* MEMBER CARDS */}
       {/* MEMBER CARDS */}
        {filteredMembers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Available Members
                <span className="bg-[#B87C4C] text-white px-2 py-0.5 rounded-full text-xs">
                  {
                    filteredMembers.filter(
                      (m) => m._id !== user._id && m.Role !== "Admin"
                    ).length
                  }
                </span>
              </h2>

              <p className="text-gray-600 text-xs">
                Members who can teach you{" "}
                <strong>
                  {
                    filterSkillList.find(
                      (s) => s.SkillId === selectedFilterSkill
                    )?.Name
                  }
                </strong>
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers
                .filter((m) => m._id !== user._id && m.Role !== "Admin")
                .map((m) => {
                  const isPending = hasPendingRequest(m._id);
                  const isOutOfSwaps = m.SwapsRemaining === 0;

                  return (
                    <div
                      key={m._id}
                      className="bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
                    >
                      {/* USER HEADER */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {m.Username?.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-sm">
                            {m.Username}
                          </h3>
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <FiMapPin className="w-2.5 h-2.5" />
                            {m.City?.cityName || "Unknown City"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {m.Email}
                          </p>
                        </div>
                      </div>

                      {/* SKILLS LIST */}
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-700 mb-1 text-xs">
                          Available Skills:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {m.Skills.filter(
                            (s) => s.SkillAvailability === "Available"
                          ).map((s) => (
                            <button
                              key={s._id}
                              onClick={() =>
                                openSkillModal(
                                  { ...s, Skill: s.Skill },
                                  m
                                )
                              }
                              disabled={hasExistingSwap(m._id, s.SkillId)}
                              className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                                hasExistingSwap(m._id, s.SkillId)
                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-[#A8BBA3] text-white hover:bg-[#8E5C32] hover:scale-105"
                              }`}
                            >
                              {s.Skill?.Name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SEND REQUEST BUTTON */}
                      <button
                        onClick={() => openPopup(m)}
                        disabled={isOutOfSwaps || isPending}
                        className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
                          isPending
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : isOutOfSwaps
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-white hover:shadow-md hover:scale-[1.02]"
                        }`}
                      >
                        {isPending
                          ? "Request Sent ✓"
                          : isOutOfSwaps
                          ? "Out of Swaps"
                          : "Send Request"}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ⭐ SEND REQUEST POPUP */}
      {showPopup && selectedMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 shadow">

            <h2 className="text-lg font-semibold mb-3">
              Select a skill to learn from {selectedMember.Username}
            </h2>

            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            >
              <option value="">Choose skill</option>

              {selectedMember.Skills.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.Skill?.Name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={sendRequest}
                className="flex-1 bg-[#B87C4C] text-white py-2 rounded-lg"
              >
                Send
              </button>

              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

       {/* ⭐ SKILL MODAL */}
      {showSkillModal && selectedSkillDetail && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowSkillModal(false);
              setSelectedSkillDetail(null);
            }}
          />

          <div className="relative w-full max-w-2xl bg-[#F7F4EA] rounded-2xl border shadow-xl overflow-hidden">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-[#B87C4C] text-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-xl">
                  {selectedSkillDetail.Skill?.Name?.charAt(0)}
                </div>

                <div>
                  <h3 className="font-bold text-lg">
                    {selectedSkillDetail.Skill?.Name}
                  </h3>

                  <p className="text-sm">
                    From {selectedSkillDetail.owner?.Username}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSkillModal(false);
                  setSelectedSkillDetail(null);
                }}
                className="p-2 hover:bg-white/30 rounded"
              >
                <FiX />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-6">
              {/* CERTIFICATE */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Certificate
                </h4>

                {selectedSkillDetail.CertificateURL ? (
                  <a
                    href={`http://localhost:4000${selectedSkillDetail.CertificateURL}`}
                    target="_blank"
                    className="bg-[#B87C4C] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                  >
                    <FiFileText /> Open Certificate
                  </a>
                ) : (
                  <p className="italic text-gray-500">No certificate</p>
                )}
              </div>

              {/* SOURCE */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Source
                </h4>

                {selectedSkillDetail.Source ? (
                  selectedSkillDetail.Source.startsWith("http") ? (
                    <a
                      href={selectedSkillDetail.Source}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200"
                    >
                      <FiExternalLink /> Open Source
                    </a>
                  ) : (
                    <div className="p-2 border bg-white rounded">
                      {selectedSkillDetail.Source}
                    </div>
                  )
                ) : (
                  <p className="italic text-gray-500">No source provided</p>
                )}
              </div>

              {/* CONTENT FILE */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Content File
                </h4>

                {selectedSkillDetail.ContentFileURL ? (
                  <a
                    href={`http://localhost:4000${selectedSkillDetail.ContentFileURL}`}
                    target="_blank"
                    className="bg-[#B87C4C] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                  >
                    <FiFileText /> Open Content File
                  </a>
                ) : (
                  <p className="italic text-gray-500">No content file</p>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-gray-100 text-right">
              <button
                onClick={() => {
                  setShowSkillModal(false);
                  setSelectedSkillDetail(null);
                }}
                className="px-5 py-2 bg-gray-500 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ CATEGORY PREVIEW MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <img src={modalImage} className="max-w-[300px] rounded-xl shadow" />
        </div>
      )}
    </div>
  );
};

export default SkillSwapRequests;
