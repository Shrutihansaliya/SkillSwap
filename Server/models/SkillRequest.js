// models/SkillRequest.js
import mongoose from "mongoose";

const SkillRequestSchema = new mongoose.Schema({
  UserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  Username: { type: String, required: true },

  SkillName: { type: String, required: true, trim: true, maxlength: 200 },
  Message: { type: String, default: null, maxlength: 2000 },

  // Status: Pending (default), Approved, Rejected
  Status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },

  // Reply from admin (optional)
  AdminReply: { type: String, default: null, maxlength: 2000 },

  // Was the admin notified/seen? optional helpful flag
  ReadByAdmin: { type: Boolean, default: false },

  CreatedAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now },
});

SkillRequestSchema.pre("save", function (next) {
  this.UpdatedAt = Date.now();
  next();
});

export default mongoose.model("SkillRequest", SkillRequestSchema);
