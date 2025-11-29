import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
 planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",   // <--- important
      required: true,
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,

    amount: Number,
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["Created", "Paid", "Failed"],
      default: "Created",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
