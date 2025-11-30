import SkillSwap from "../models/SkillSwap.js";
import Request from "../models/Request.js";
import User from "../models/User.js";
import UserSkill from "../models/UserSkill.js";
import Skill from "../models/Skill.js";
import City from "../models/City.js"; // For City name
import Feedback from "../models/Feedback.js"; // ⭐ NEW

// ----------------------------------------------------------------------
// ⭐ ADMIN STATS
// ----------------------------------------------------------------------
export const getAdminSwapStats = async (req, res) => {
  try {
    const totalSwaps = await SkillSwap.countDocuments();
    const activeSwaps = await SkillSwap.countDocuments({ Status: "Active" });
    const completedSwaps = await SkillSwap.countDocuments({ Status: "Completed" });
    const pendingRequests = await Request.countDocuments({ Status: "Pending" });

    return res.json({
      success: true,
      stats: { totalSwaps, activeSwaps, completedSwaps, pendingRequests }
    });

  } catch (err) {
    console.error("Admin Stats Error:", err);
    return res.json({ success: false, stats: {} });
  }
};





// ----------------------------------------------------------------------
// ⭐ ADMIN LIST SWAPS (Filters + Feedback Added)
// ----------------------------------------------------------------------
export const getAdminSwaps = async (req, res) => {
  try {
    let { status, singleSkill, skillA, skillB, page = 1, pageSize = 10 } = req.query;

    page = Number(page);
    pageSize = Number(pageSize);

    let filter = {};
    if (status) filter.Status = status;

    let swaps = await SkillSwap.find(filter)
      .populate({
        path: "RequestId",
        populate: [
          { path: "SenderId", select: "Username Email City" },
          { path: "ReceiverId", select: "Username Email City" },
          { path: "SkillToLearnId", model: "UserSkill" },
          { path: "SkillToTeachId", model: "UserSkill" }
        ]
      })
      .sort({ CreatedAt: -1 })
      .lean();

    // Attach extra info
    for (let s of swaps) {

      // Learn Skill
      if (s.RequestId?.SkillToLearnId?.SkillId) {
        const learnSkill = await Skill.findOne({ SkillId: s.RequestId.SkillToLearnId.SkillId }).lean();
        s.LearnSkillName = learnSkill?.Name || "--";
      }

      // Teach Skill
      if (s.RequestId?.SkillToTeachId?.SkillId) {
        const teachSkill = await Skill.findOne({ SkillId: s.RequestId.SkillToTeachId.SkillId }).lean();
        s.TeachSkillName = teachSkill?.Name || "--";
      }

      // Sender Info
      if (s.RequestId?.SenderId) {
        const city = await City.findById(s.RequestId.SenderId.City).lean();
        s.SenderName = s.RequestId.SenderId.Username;
        s.SenderEmail = s.RequestId.SenderId.Email;
        s.SenderCity = city?.cityName || "--";
      }

      // Receiver Info
      if (s.RequestId?.ReceiverId) {
        const city = await City.findById(s.RequestId.ReceiverId.City).lean();
        s.ReceiverName = s.RequestId.ReceiverId.Username;
        s.ReceiverEmail = s.RequestId.ReceiverId.Email;
        s.ReceiverCity = city?.cityName || "--";
      }

      // ⭐ FETCH FEEDBACKS (Only if swap completed)
      if (s.Status === "Completed") {
        const feedbacks = await Feedback.find({ SwapId: s._id }).lean();

        s.SenderFeedback = feedbacks.find(f => String(f.SenderId) === String(s.RequestId.SenderId?._id)) || null;
        s.ReceiverFeedback = feedbacks.find(f => String(f.SenderId) === String(s.RequestId.ReceiverId?._id)) || null;
      }
    }

    // FILTER 1 — Single Skill
    if (singleSkill) {
      swaps = swaps.filter(s =>
        String(s.RequestId?.SkillToLearnId?.SkillId) === singleSkill ||
        String(s.RequestId?.SkillToTeachId?.SkillId) === singleSkill
      );
    }

    // FILTER 2 — Skill A → Skill B
    if (skillA && skillB) {
      swaps = swaps.filter(s =>
        String(s.RequestId?.SkillToLearnId?.SkillId) === skillA &&
        String(s.RequestId?.SkillToTeachId?.SkillId) === skillB
      );
    }

    const total = swaps.length;
    const paginated = swaps.slice((page - 1) * pageSize, page * pageSize);

    return res.json({
      success: true,
      swaps: paginated,
      total
    });

  } catch (err) {
    console.error("Admin Swap List Error:", err);
    return res.json({ success: false, swaps: [] });
  }
};



// ----------------------------------------------------------------------
// ⭐ DROPDOWN DATA (Users + Skills)
// ----------------------------------------------------------------------
export const getAdminDropdownData = async (req, res) => {
  try {
    const users = await User.find({ Role: "member" })
      .select("Username Email _id")
      .lean();

    const skills = await Skill.find()
      .select("Name SkillId")
      .lean();

    return res.json({ success: true, users, skills });
  } catch (err) {
    console.error("Dropdown Data Error:", err);
    return res.json({ success: false, users: [], skills: [] });
  }
};
