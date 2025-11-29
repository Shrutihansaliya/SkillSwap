// models/Feedback.js
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  SwapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SkillSwap",
    required: true,
  },
  SenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ReceiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  Rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  Comments: {
    type: String,
    default: "",
  },
  Date: {
    type: Date,
    default: () => new Date(),
  },
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);
