// import mongoose from "mongoose";

// const videoSchema = new mongoose.Schema({
//   swapId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Swap",
//     required: true,
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   fileUrl: {
//     type: String,
//     required: true,
//   },
//   originalName: {
//     type: String,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// export default mongoose.model("Video", videoSchema);
import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  swapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Swap",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
  },

  // ⭐ NEW FIELD
  description: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Video", videoSchema);
