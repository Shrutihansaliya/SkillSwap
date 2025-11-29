// import mongoose from "mongoose";

// const materialSchema = new mongoose.Schema({
//   SwapId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "SkillSwap",
//     required: true,
//   },
//   UserId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   FileURL: {
//     type: String,
//     required: true,
//   },
//   UploadedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// export default mongoose.model("Material", materialSchema);
import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  SwapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SkillSwap",
    required: true,
  },
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  FileURL: {
    type: String,
    required: true,
  },
  UploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Material", materialSchema);
