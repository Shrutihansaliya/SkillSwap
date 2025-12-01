// // import mongoose from "mongoose";

// // const subscriptionSchema = new mongoose.Schema({
// //   UserId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "User",
// //     required: true,
// //     unique: true, // ✅ Each user can have only one subscription
// //   },
// //   PlanId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "Plan",
// //     default: null,
// //   },
// //   SwapsRemaining: {
// //     type: Number,
// //     default: null,
// //   },
// //   StartDate: {
// //     type: Date,
// //     default: Date.now,
// //   },
// // });

// // export default mongoose.model("Subscription", subscriptionSchema);
// import mongoose from "mongoose";

// const subscriptionSchema = new mongoose.Schema({
//   UserId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//     unique: true,
//   },

//   PlanId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Plan",
//     default: null,
//   },

//   SwapsRemaining: {
//     type: Number,
//     default: null,
//   },

//   StartDate: {
//     type: Date,
//     default: Date.now,
//   },

//   PaymentStatus: {
//     type: String,
//     enum: ["Pending", "Success", "Failed"],
//     default: "Pending",
//   },

//   RazorpayOrderId: { type: String,
//      default: null,
//    },
//   RazorpayPaymentId: { type: String,
//      default: null,
//    },
//   RazorpaySignature: { type: String ,
//      default: null,
//   },
// });

// export default mongoose.model("Subscription", subscriptionSchema);
import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  PlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    default: null,
  },

  // For free 2-swaps plan
  IsFreePlan: {
    type: Boolean,
    default: false,
  },

  SwapsRemaining: {
    type: Number,
    required: true,
  },

  StartDate: {
    type: Date,
    default: Date.now,
  },

  ExpiryDate: {
    type: Date,
    default: null,
  },

  // Active / Upcoming / Expired
  Status: {
    type: String,
    enum: ["Active", "Upcoming", "Expired"],
    default: "Active",
  },

  PaymentStatus: {
    type: String,
    enum: ["Pending", "Success", "Failed"],
    default: "Pending",
  },

  RazorpayOrderId: { type: String, default: null },
  RazorpayPaymentId: { type: String, default: null },
  RazorpaySignature: { type: String, default: null },
});

export default mongoose.model("Subscription", subscriptionSchema);
