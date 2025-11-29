// server/models/Meet.js
import mongoose from "mongoose";

const MeetSchema = new mongoose.Schema(
  {
    link: { type: String, required: true },
    scheduledAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    swapId: { type: mongoose.Schema.Types.ObjectId, ref: "Swap", default: null },
    status: { type: String, enum: ["Scheduled", "Done", "Cancelled"], default: "Scheduled" },
  },
  { timestamps: true }
);

export default mongoose.model("Meet", MeetSchema);
