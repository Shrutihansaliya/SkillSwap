import mongoose from "mongoose";

// Counter schema for auto-increment PlanID
const counterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

const subscriptionPlanSchema = new mongoose.Schema({
  PlanID: { type: Number, unique: true },
  Name: { type: String, required: true, trim: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  SwapLimit: { type: Number, default: 0 },
  Price: { type: mongoose.Decimal128, default: 0.0 },
}, { timestamps: true });

// Auto-increment PlanID before saving
subscriptionPlanSchema.pre("save", async function (next) {
  if (!this.PlanID) {
    const counter = await Counter.findOneAndUpdate(
      { id: "planid" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.PlanID = counter.seq;
  }
  next();
});

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
