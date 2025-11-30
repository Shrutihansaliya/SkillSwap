import User from "../models/User.js";
import UserSkill from "../models/UserSkill.js";
import Skill from "../models/Skill.js";
import bcrypt from "bcryptjs";
import SkillCategory from "../models/SkillCategory.js";
import SkillSwap from "../models/SkillSwap.js";
import Request from "../models/Request.js";
// Get all members with their skills
// export const getMembers = async (req, res) => {
//   try {
//     const users = await User.find({ Role: "member" }).lean();

//     const usersWithSkills = await Promise.all(
//       users.map(async (user) => {
//         const userSkills = await UserSkill.find({ UserId: user._id }).lean();

//         const skillNames = await Promise.all(
//           userSkills.map(async (us) => {
//             const skill = await Skill.findOne({ SkillId: us.SkillId }).lean();
//             return skill ? skill.Name : null;
//           })
//         );

//         return {
//           ...user,
//           Skills: skillNames.filter(Boolean),
//         };
//       })
//     );

//     res.json({ success: true, data: usersWithSkills });
//   } catch (err) {
//     console.error("Get members error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
// Get all members with their skills + city
// ==============================================
//      UPDATED getMembers with FILTER SUPPORT
// ==============================================



export const getMembers = async (req, res) => {
  try {
    const { categoryId, skillId, search } = req.query;

    // 1️⃣ Build base user filter (role = member)
    let userFilter = { Role: "member" };

    // 2️⃣ TEXT SEARCH ON USERNAME / EMAIL / CITY / CONTACT
    if (search && search.trim() !== "") {
      const q = new RegExp(search.trim(), "i"); // case-insensitive
      userFilter.$or = [
        { Username: q },
        { Email: q },
        { ContactNo: q },
      ];
    }

    // Get all members based on search filter
    let users = await User.find(userFilter).populate("City").lean();

    // If city name search needed → filter after populate
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      users = users.filter(u =>
        u.City?.cityName?.toLowerCase().includes(q)
      );
    }

    // 3️⃣ Get user skill data
    const usersWithSkills = await Promise.all(
      users.map(async (user) => {
        const userSkills = await UserSkill.find({ UserId: user._id }).lean();

        const skills = await Promise.all(
          userSkills.map(async (us) => {
            const skill = await Skill.findOne({ SkillId: us.SkillId }).lean();
            if (!skill) return null;

            return {
              SkillId: skill.SkillId,
              CategoryId: skill.CategoryId,
              Name: skill.Name,
              CertificateURL: us.CertificateURL,
              ContentFileURL: us.ContentFileURL,
              Source: us.Source,
              SkillAvailability: us.SkillAvailability,
              CertificateStatus: us.CertificateStatus,
              AddedDate: us.AddedDate,
            };
          })
        );

        return {
          ...user,
          Skills: skills.filter(Boolean),
        };
      })
    );

    let filteredMembers = [...usersWithSkills];

    // 4️⃣ CATEGORY FILTER
    if (categoryId) {
      filteredMembers = filteredMembers.filter(m =>
        m.Skills.some(s => String(s.CategoryId) === String(categoryId))
      );
    }

    // 5️⃣ SKILL FILTER
    if (skillId) {
      filteredMembers = filteredMembers.filter(m =>
        m.Skills.some(s => String(s.SkillId) === String(skillId))
      );
    }

    // 6️⃣ ADD SWAP COUNTS — Active & Completed
    for (const m of filteredMembers) {
      // Find all swap requests where this user is Sender or Receiver
      const requests = await Request.find({
        $or: [{ SenderId: m._id }, { ReceiverId: m._id }],
      }).select("_id");

      const requestIds = requests.map(r => r._id);

      // Count Active Swaps
      m.ActiveSwaps = await SkillSwap.countDocuments({
        RequestId: { $in: requestIds },
        Status: "Active",
      });

      // Count Completed Swaps
      m.CompletedSwaps = await SkillSwap.countDocuments({
        RequestId: { $in: requestIds },
        Status: "Completed",
      });
    }

    res.json({ success: true, data: filteredMembers });
  } catch (err) {
    console.error("Get members error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Change password
export const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.Password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Old password is incorrect" });

    const isSameAsOld = await bcrypt.compare(newPassword, user.Password);
    if (isSameAsOld) return res.status(400).json({ success: false, message: "New password cannot be same as old password" });

    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
