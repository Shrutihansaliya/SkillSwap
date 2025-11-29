import express from "express";
import multer from "multer";
import {
  uploadVideo,
  getVideos,
  deleteVideo
} from "../controllers/videoController.js";

const router = express.Router();

// ---------------- MULTER STORAGE ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/videos");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ---------------- ROUTES ----------------

// Upload video
router.post("/:swapId/upload", upload.single("video"), uploadVideo);

// Get all videos for swap
router.get("/:swapId", getVideos);

// ❗ IMPORTANT — DELETE ROUTE
router.delete("/:videoId", deleteVideo);

export default router;
