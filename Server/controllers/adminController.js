import User from "../models/User.js";
import UserSkill from "../models/UserSkill.js";
import Skill from "../models/Skill.js";
import bcrypt from "bcryptjs";

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
export const getMembers = async (req, res) => {
  try {
    // all members with city populated
    const users = await User.find({ Role: "member" })
      .populate("City") // City collection
      .lean();

    const usersWithSkills = await Promise.all(
      users.map(async (user) => {
        const userSkills = await UserSkill.find({ UserId: user._id }).lean();

        const skills = await Promise.all(
          userSkills.map(async (us) => {
            const skill = await Skill.findOne({ SkillId: us.SkillId }).lean();
            if (!skill) return null;

            return {
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

    res.json({ success: true, data: usersWithSkills });
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
