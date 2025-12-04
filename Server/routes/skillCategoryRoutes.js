// import express from "express";
// import {
//   addCategory,
//   getAllCategories,
//   updateCategory,
//   toggleCategoryStatus,
// } from "../controllers/skillCategoryController.js";

// const router = express.Router();

// // Routes
// router.post("/add", addCategory);
// router.get("/", getAllCategories);
// router.put("/:id", updateCategory);
// router.put("/toggle/:id", toggleCategoryStatus);

// export default router;
// routes/skillCategoryRoutes.js
// routes/skillCategoryRoutes.js
import express from "express";
import multer from "multer";
import path from "path";

import {
  addCategory,
  getAllCategories,
  updateCategory,
  toggleCategoryStatus,
} from "../controllers/skillCategoryController.js";

const router = express.Router();

// -----------------------------
// STORAGE: Save images to /icons
// -----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "icons"); // ⭐ STORE IN icons FOLDER
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, name + ext);
  },
});

// -----------------------------
// VALIDATION: Allowed file types
// -----------------------------
const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG, JPEG are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// -----------------------------
// ROUTES
// -----------------------------

router.post("/add", upload.single("image"), addCategory);
router.get("/", getAllCategories);
router.put("/:id", upload.single("image"), updateCategory);
router.put("/toggle/:id", toggleCategoryStatus);

export default router;
