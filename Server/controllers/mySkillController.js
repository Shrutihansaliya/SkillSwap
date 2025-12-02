// let pdfParse;
// (async () => {
//   const module = await import("pdf-parse");
//   pdfParse = module.default || module; 
// })();
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const _pdfParseModule = require("pdf-parse");
const pdfParse = (_pdfParseModule && _pdfParseModule.default) ? _pdfParseModule.default : _pdfParseModule;
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
           CategoryId: skill?.CategoryId || null, // <-- add this
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

    // normalize path (remove leading slash if present)
    const rel = String(skill.ContentFileURL || "").replace(/^\//, "");
    const filePath = path.join(process.cwd(), rel);

    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: "PDF file missing" });

    const dataBuffer = fs.readFileSync(filePath);

    // ==== DYNAMIC LOAD / NORMALIZE pdf-parse MODULE ====
    // dynamic import ensures we get the exact runtime export shape
    const pdfParseModule = await import("pdf-parse");
    // pdf-parse sometimes exports the function directly, sometimes under .default
    const pdfParse = (pdfParseModule && pdfParseModule.default) ? pdfParseModule.default : pdfParseModule;

    // DEBUG: log module shape once (remove after debugging)
    console.log("pdf-parse module type:", typeof pdfParse, "module keys:", Object.keys(pdfParseModule || {}));

    if (typeof pdfParse !== "function") {
      console.error("pdfParse is not a function after dynamic import. Module:", pdfParseModule);
      return res.status(500).json({ success: false, message: "PDF parser not available on server." });
    }

    const parsed = await pdfParse(dataBuffer);
    return res.json({
      success: true,
      text: parsed && parsed.text ? String(parsed.text) : "",
      templateType: "main",
    });
  } catch (err) {
    console.error("PDF read error:", err && (err.stack || err.message || err));
    res.status(500).json({ success: false, message: "Failed to read PDF" });
  }
};


/* ----------------------------------------------------------
   UPDATE SKILL
----------------------------------------------------------- */
export const updateUserSkill = async (req, res) => {
  try {
    console.log("updateUserSkill called:", {
      params: req.params,
      bodyKeys: Object.keys(req.body || {}),
      filesKeys: req.files ? Object.keys(req.files) : null,
    });

    const { skillId } = req.params;
    const { Source, EditedText, SkillId: incomingSkillId, UserId: incomingUserId } = req.body;

    const skill = await UserSkill.findById(skillId);
    if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });

    // Update simple fields
    if (Source !== undefined) skill.Source = Source === "" ? null : Source;

    // If frontend sent a new SkillId (user changed selected skill), update it
    if (incomingSkillId !== undefined && incomingSkillId !== "") {
      // try numeric then fallback
      const parsed = Number(incomingSkillId);
      skill.SkillId = Number.isFinite(parsed) ? parsed : incomingSkillId;
      console.log(" - updating SkillId to:", skill.SkillId);
    }

    // --- Certificate Update (single file) ---
    if (req.files?.Certificate?.[0]) {
      // delete old certificate if exists (best-effort)
      try {
        if (skill.CertificateURL) {
          const oldCertRel = skill.CertificateURL.replace(/^\//, "");
          const oldCertPath = path.join(process.cwd(), oldCertRel);
          if (fs.existsSync(oldCertPath)) fs.unlinkSync(oldCertPath);
        }
      } catch (e) { console.warn("Could not remove old certificate:", e.message); }

      const certFile = req.files.Certificate[0];
      skill.CertificateURL = `/uploads/certificates/${certFile.filename}`;
      skill.CertificateStatus = "Pending";
    }

    // --- ContentFile Update (replace if a file uploaded) ---
    if (req.files?.ContentFile?.[0]) {
      // delete old content pdf if exists
      try {
        if (skill.ContentFileURL) {
          const oldRel = skill.ContentFileURL.replace(/^\//, "");
          const oldPath = path.join(process.cwd(), oldRel);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (e) { console.warn("Could not remove old content file:", e.message); }

      const contentFile = req.files.ContentFile[0];
      skill.ContentFileURL = `/uploads/contentfiles/${contentFile.filename}`;
      // Optionally set a status field if you have one
    }

    // --- EditedText: regenerate PDF if provided (textarea edits) ---
    if (EditedText && String(EditedText).trim()) {
      const text = String(EditedText);
      // determine template type heuristics
      let templateType = "main";
      if (text.includes("-") && text.includes(",")) templateType = "sub";
      if (text.includes("✓")) templateType = "main";
      if (!text.includes(",") && !text.includes("-")) templateType = "plain";

      // fetch skill/category names for PDF header
      const skillDoc = await Skill.findOne({ SkillId: skill.SkillId });
      const categoryDoc = skillDoc ? await Category.findOne({ CategoryId: skillDoc.CategoryId }) : null;

      // delete old content file (already done above if ContentFile uploaded). do again safe-guard:
      try {
        if (skill.ContentFileURL) {
          const oldRel = skill.ContentFileURL.replace(/^\//, "");
          const oldPath = path.join(process.cwd(), oldRel);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (e) { /* ignore */ }

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

      skill.ContentFileURL = `/uploads/contentfiles/${fileName}`;
    }

    await skill.save();

    console.log("updateUserSkill finished for:", skillId);
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
