// Server/models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: [
      "request_sent",
      "request_accepted",
      "request_rejected",
      "request_confirmed",
      "material_uploaded",
      "schedule_generated",
      "feedback_given",
      "general",
      "video_upload",
      "swap_limit_reached",
      "partner_suspended", 
      "swap_started",              // ⭐ NEW
      "subscription_promoted",     // ⭐ NEW              // 👈 important
    ],
    default: "general",
  },

  link: {
    type: String,
    default: null,
  },

  isRead: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Notification", NotificationSchema);
