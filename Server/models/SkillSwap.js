// import mongoose from "mongoose";

// const skillSwapSchema = new mongoose.Schema({
//   RequestId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Request",
//     required: true,
//   },
//   Status: {
//     type: String,
//     enum: ["Active", "Completed", "Cancelled"],
//     default: "Active",
//   },
//   CreatedAt: {
//     type: Date,
//     default: Date.now,
//   },
//   CompletedAt: {
//     type: Date,
//     default: null,
//   },
// });

// export default mongoose.model("SkillSwap", skillSwapSchema);
import mongoose from "mongoose";

const skillSwapSchema = new mongoose.Schema({
  RequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: true,
  },
  Status: {
    type: String,
    enum: ["Active", "Completed", "Cancelled"],
    default: "Active",
  },
  Confirmations: {
    SenderConfirmed: { type: Boolean, default: false },
    ReceiverConfirmed: { type: Boolean, default: false },
  },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
  CompletedAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("SkillSwap", skillSwapSchema);
