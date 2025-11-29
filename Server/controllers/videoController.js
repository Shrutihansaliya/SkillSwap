import Video from "../models/Video.js";
import Notification from "../models/Notification.js";
import path from "path";
import fs from "fs";

// ------------------- UPLOAD VIDEO -------------------
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const newVideo = new Video({
      swapId: req.params.swapId,
      userId: req.body.userId,
      fileUrl: `uploads/videos/${req.file.filename}`,
      originalName: req.file.originalname,
      description: req.body.description || "",
    });

    await newVideo.save();
 const notification = new Notification({
      userId: req.body.userId,
      message: `You have successfully uploaded a new video: "${req.file.originalname}"`,
      type: "video_upload",
      link: `/swap/${req.params.swapId}`, // optional link to redirect
    });
    await notification.save();

    res.json({ success: true, message: "Video uploaded successfully!" });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// ------------------- GET ALL VIDEOS -------------------
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find({ swapId: req.params.swapId })
      .sort({ createdAt: -1 });

    res.json({ success: true, videos });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ success: false, message: "Could not fetch videos" });
  }
};

// ------------------- DELETE VIDEO -------------------
export const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const video = await Video.findById(videoId);
    if (!video)
      return res.status(404).json({ success: false, message: "Video not found" });

    // Check permission
    if (String(video.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this video.",
      });
    }

    // Delete video file
    const filePath = path.join(process.cwd(), video.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await video.deleteOne();

    res.json({ success: true, message: "Video deleted successfully!" });
  } catch (err) {
    console.error("Delete Video Error:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
