// Server/models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    evidence: [
      {
        url: String,
        mimeType: String,
      },
    ],

    // Added "suspended" to the enum so status = "suspended" is valid
    type: { type: String }, // (if you use a `type` field elsewhere ignore/remove)
    status: {
      type: String,
      enum: ["pending", "in_review", "resolved", "rejected", "suspended"],
      default: "pending",
    },

    adminNote: {
      type: String,
      default: "",
    },

    actionTaken: {
      type: String,
      enum: ["none", "warned", "suspended", "deleted"],
      default: "none",
    },

    // Added suspendUntil field to store suspension expiration (nullable)
    suspendUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
