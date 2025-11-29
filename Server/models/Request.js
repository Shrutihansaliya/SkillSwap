import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    SenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ReceiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    SkillToLearnId: { type: mongoose.Schema.Types.ObjectId, ref: "UserSkill", required: true },
    SkillToTeachId: { type: mongoose.Schema.Types.ObjectId, ref: "UserSkill", default: null },
    Status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Request", requestSchema);
