import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
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
  Message: {
    type: String,
    required: true,
  },
  SentAt: {
    type: Date,
    default: Date.now,
  },
  Status: {
    type: String,
    enum: ["Sent", "Delivered", "Read"],
    default: "Sent",
  },
});

chatSchema.index({ SwapId: 1, SentAt: 1 });

chatSchema.virtual("Sender", {
  ref: "User",
  localField: "SenderId",
  foreignField: "_id",
  justOne: true,
});

chatSchema.virtual("Receiver", {
  ref: "User",
  localField: "ReceiverId",
  foreignField: "_id",
  justOne: true,
});

chatSchema.set("toJSON", { virtuals: true });
chatSchema.set("toObject", { virtuals: true });

export default mongoose.model("Chat", chatSchema);
