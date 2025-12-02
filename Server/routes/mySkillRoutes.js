// import express from "express";
// import multer from "multer";
// import {
//   getUserSkills,
//   addUserSkill,
//   updateUserSkill,
//   deleteUserSkill,
// } from "../controllers/mySkillController.js";

// const router = express.Router();

// // ✔ Correct upload folder (matches your server.js static path)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/certificates"),
//   filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
// });

// const upload = multer({ storage });

// // 📌 Routes
// router.get("/:userId", getUserSkills);
// router.post("/", upload.single("Certificate"), addUserSkill);
// router.put("/:skillId", upload.single("Certificate"), updateUserSkill);
// router.delete("/:skillId", deleteUserSkill);

// export default router;
import express from "express";
import multer from "multer";

import {
  getUserSkills,
  addUserSkill,
  updateUserSkill,
  disableSkill,
  reactivateSkill,
  getPdfContent
} from "../controllers/mySkillController.js";

const router = express.Router();

/* -----------------------------------------------------------
   🟣 MULTER STORAGE — TWO FOLDERS
------------------------------------------------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "Certificate") {
      cb(null, "uploads/certificates");
    } else if (file.fieldname === "ContentFile") {
      cb(null, "uploads/contentfiles");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

/* -----------------------------------------------------------
   🔥 PDF ONLY VALIDATION
------------------------------------------------------------ */
// routes/mySkillRoutes.js  — replace current upload = multer({...}) block with:

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    try {
      if (file.fieldname === "Certificate" || file.fieldname === "ContentFile") {
        // allow PDFs for these fields
        if (file.mimetype !== "application/pdf") {
          return cb(new Error("Only PDF files are allowed for Certificate / ContentFile"), false);
        }
        return cb(null, true);
      }

      if (file.fieldname === "TemplateImage") {
        // allow images for template image field
        if (!file.mimetype.startsWith("image/")) {
          return cb(new Error("TemplateImage must be an image (png/jpg/jpeg/etc.)"), false);
        }
        return cb(null, true);
      }

      // default: reject unknown fields explicitly
      return cb(new Error("Unexpected file field"), false);
    } catch (e) {
      return cb(e, false);
    }
  },
});


/* -----------------------------------------------------------
   ROUTES
------------------------------------------------------------ */

// 📌 Get all user skills
router.get("/:userId", getUserSkills);

// 📌 Add new skill
router.post(
  "/",
  upload.fields([
    { name: "Certificate", maxCount: 1 },
    { name: "ContentFile", maxCount: 1 },
     { name: "TemplateImage", maxCount: 1 }, 
  ]),
  addUserSkill
);
router.get("/content/:skillId", getPdfContent);

// 📌 Update skill
router.put(
  "/:skillId",
  upload.fields([
    { name: "Certificate", maxCount: 1 },
    { name: "ContentFile", maxCount: 1 },
     { name: "TemplateImage", maxCount: 1 }, 
  ]),
  updateUserSkill
);

// 📌 Disable skill (soft delete)
router.put("/disable/:skillId", disableSkill);

// 📌 Reactivate skill
router.put("/reactivate/:skillId", reactivateSkill);

export default router;
