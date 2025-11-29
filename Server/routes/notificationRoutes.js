// import express from "express";
// import {
//   createNotification,
//   getUserNotifications,
//   markAsRead,
//   deleteNotification,
// } from "../controllers/notificationController.js";

// const router = express.Router();

// // Create new notification
// router.post("/", createNotification);

// // Get all notifications of one user
// router.get("/:userId", getUserNotifications);

// // Mark single notification as read
// router.put("/read/:id", markAsRead);

// // Delete a notification
// router.delete("/:id", deleteNotification);

// export default router;
import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// Get all notifications for user
router.get("/:userId", async (req, res) => {
  try {
    const notify = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications: notify });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export default router;
