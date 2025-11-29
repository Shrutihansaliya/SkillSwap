import UserSkill from "../models/UserSkill.js";
import User from "../models/User.js";
import Skill from "../models/Skill.js";


// 🔵 Get all certificates (with user + skill details)
export const getAllCertificates = async (req, res) => {
  try {
    const data = await UserSkill.find()
      .sort({ AddedDate: -1 })
      .lean();

    const result = await Promise.all(
      data.map(async (item) => {
        const user = await User.findById(item.UserId).lean();
        const skill = await Skill.findOne({ SkillId: item.SkillId }).lean();

        return {
          _id: item._id,
          Username: user?.Username || "Unknown User",
          Email: user?.Email || "N/A",
          SkillName: skill?.Name || "Unknown Skill",
          Source: item.Source,
          CertificateURL: item.CertificateURL,
          AddedDate: item.AddedDate,
          CertificateStatus: item.CertificateStatus,
        };
      })
    );

    res.json({ success: true, data: result });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// 🟢 Approve certificate
export const approveCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await UserSkill.findById(id);
    if (!skill) return res.status(404).json({ success: false, message: "Record not found" });

    skill.CertificateStatus = "Verified";
    await skill.save();

    res.json({ success: true, message: "Certificate Approved" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// 🔴 Reject certificate
export const rejectCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await UserSkill.findById(id);
    if (!skill) return res.status(404).json({ success: false, message: "Record not found" });

    skill.CertificateStatus = "Rejected";
    await skill.save();

    res.json({ success: true, message: "Certificate Rejected" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
