import SubscriptionPlan from "../models/SubscriptionPlan.js";

// Get all active plans (for users)
export const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ status: "Active" }).lean();
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all plans (admin)
export const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().lean();
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add plan
export const addPlan = async (req, res) => {
  try {
    const { Name, SwapLimit, Price } = req.body;
    if (!Name) return res.status(400).json({ success: false, message: "Plan Name required" });

    const existing = await SubscriptionPlan.findOne({ Name });
    if (existing) return res.status(400).json({ success: false, message: "Plan already exists" });

    const newPlan = new SubscriptionPlan({ Name, SwapLimit, Price });
    await newPlan.save();
    res.json({ success: true, message: "Plan added", data: newPlan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, SwapLimit, Price, status } = req.body;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    if (Name) plan.Name = Name;
    if (SwapLimit !== undefined) plan.SwapLimit = SwapLimit;
    if (Price !== undefined) plan.Price = Price;
    if (status) plan.status = status;

    await plan.save();
    res.json({ success: true, message: "Plan updated", data: plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete plan (optional)
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, message: "Plan deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
