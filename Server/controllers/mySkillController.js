// let pdfParse;
// (async () => {
//   const module = await import("pdf-parse");
//   pdfParse = module.default || module; 
// })();


import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import UserSkill from "../models/UserSkill.js";
import SkillSwap from "../models/SkillSwap.js";
import Skill from "../models/Skill.js";
import Category from "../models/SkillCategory.js";


import PDFDocument from "pdfkit";
/* ----------------------------------------------------------
   GET USER SKILLS
----------------------------------------------------------- */
export const getUserSkills = async (req, res) => {
  try {
    const { userId } = req.params;

    const skills = await UserSkill.find({ UserId: userId }).sort({
      AddedDate: -1,
    });

    const skillData = await Promise.all(
      skills.map(async (userSkill) => {
        const skill = await Skill.findOne({ SkillId: userSkill.SkillId });
        const category = skill
          ? await Category.findOne({ CategoryId: skill.CategoryId })
          : null;

        return {
          _id: userSkill._id,
          SkillId: userSkill.SkillId,
          SkillName: skill?.Name || "Unknown Skill",
          CategoryName: category?.CategoryName || "Unknown Category",
          CertificateURL: userSkill.CertificateURL,
          ContentFileURL: userSkill.ContentFileURL,
          Source: userSkill.Source,
          Status: userSkill.SkillAvailability, // ⭐ For disable/activate
          CertificateStatus: userSkill.CertificateStatus,
        };
      })
    );

    res.json({ success: true, data: skillData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ----------------------------------------------------------
   ADD SKILL
----------------------------------------------------------- */
export const addUserSkill = async (req, res) => {
  try {
    const { UserId, SkillId, Source } = req.body;

    const cert = req.files?.Certificate?.[0] || null;
    const content = req.files?.ContentFile?.[0] || null;

    const newSkill = new UserSkill({
      UserId,
      SkillId,
      Source: Source || null,
      CertificateURL: cert ? `/uploads/certificates/${cert.filename}` : null,
      ContentFileURL: content ? `/uploads/contentfiles/${content.filename}` : null,
    });

    await newSkill.save();

    res.json({ success: true, message: "Skill added", data: newSkill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getPdfContent = async (req, res) => {
  try {
    const { skillId } = req.params;

    const skill = await UserSkill.findById(skillId);
    if (!skill || !skill.ContentFileURL)
      return res.status(404).json({ success: false, message: "PDF not found" });

    const filePath = path.join(
      process.cwd(),
      skill.ContentFileURL.replace("/", "")
    );

    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: "PDF file missing" });

    const dataBuffer = fs.readFileSync(filePath);

    // 🔥 NOW pdfParse IS A FUNCTION
    const parsed = await pdfParse(dataBuffer);

    return res.json({
      success: true,
      text: parsed.text || "",
      templateType: "main",
    });
  } catch (err) {
    console.error("PDF read error:", err);
    res.status(500).json({ success: false, message: "Failed to read PDF" });
  }
};



/* ----------------------------------------------------------
   UPDATE SKILL
----------------------------------------------------------- */


export const updateUserSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { Source, EditedText } = req.body;

    const skill = await UserSkill.findById(skillId);
    if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });

    if (Source !== undefined) skill.Source = Source;

    // --- Certificate Update ---
    if (req.files?.Certificate?.[0]) {
      skill.CertificateURL = `/uploads/certificates/${req.files.Certificate[0].filename}`;
      skill.CertificateStatus = "Pending";
    }

    // --- PDF Content Editing ---
    if (EditedText && EditedText.trim()) {
      // Delete old PDF
      if (skill.ContentFileURL) {
        const rel = skill.ContentFileURL.replace(/^\//, "");
        const oldPath = path.join(process.cwd(), rel);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // Detect template on save
      let templateType = "main";
      const text = EditedText;

      if (text.includes("-") && text.includes(",")) templateType = "sub";
      if (text.includes("✓")) templateType = "main";
      if (!text.includes(",") && !text.includes("-")) templateType = "plain";

      // Fetch skill/category names
      const skillDoc = await Skill.findOne({ SkillId: skill.SkillId });
      const categoryDoc = await Category.findOne({ CategoryId: skillDoc.CategoryId });

      // Generate new PDF
      const fileName = `content_${skill.UserId}_${Date.now()}.pdf`;
      const outputPdfPath = path.join("uploads", "contentfiles", fileName);

      await generatePdfForSkill({
        outputPdfPath,
        logoPath: path.join(process.cwd(), "uploads/logo.png"),
        categoryName: categoryDoc?.CategoryName || "",
        skillName: skillDoc?.Name || "",
        templateType,
        templateData: text,
        templateImagePath: null,
      });

      skill.ContentFileURL = "/uploads/contentfiles/" + fileName;
    }

    await skill.save();
    res.json({ success: true, message: "Skill updated", data: skill });

  } catch (err) {
    console.error("UpdateSkill Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};




/* -----------------------------------------------------------
   DISABLE SKILL (Only if NO active swap exists)
----------------------------------------------------------- */
export const disableSkill = async (req, res) => {
  try {
    const { skillId } = req.params;

    const skill = await UserSkill.findById(skillId);
    if (!skill) {
      return res.json({ success: false, message: "Skill not found." });
    }

    // 🔍 Check Active Swap for this SkillId
    const activeSwap = await SkillSwap.findOne({
      SkillId: skill.SkillId,
      Status: "Active",
    });

    if (activeSwap) {
      return res.json({
        success: false,
        message: "Cannot disable skill until active swap is completed.",
      });
    }

    // 🔥 Update Availability
    skill.SkillAvailability = "Unavailable"; 
    await skill.save();

    return res.json({
      success: true,
      message: "Skill disabled successfully.",
    });
  } catch (err) {
    console.error("Disable Skill Error:", err);
    res.json({ success: false, message: "Server error" });
  }
};

/* -----------------------------------------------------------
   REACTIVATE SKILL
----------------------------------------------------------- */
export const reactivateSkill = async (req, res) => {
  try {
    const { skillId } = req.params;

    const skill = await UserSkill.findById(skillId);
    if (!skill) {
      return res.json({ success: false, message: "Skill not found." });
    }

    skill.SkillAvailability = "Available";
    await skill.save();

    return res.json({
      success: true,
      message: "Skill reactivated successfully.",
    });
  } catch (err) {
    console.error("Reactivate Skill Error:", err);
    res.json({ success: false, message: "Server error" });
  }
};
