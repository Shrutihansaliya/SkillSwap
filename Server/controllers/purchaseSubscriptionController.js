import Subscription from "../models/Subscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";

// Purchase or update a user subscription
export const purchaseSubscription = async (req, res) => {
  try {
    const { UserId, PlanId } = req.body;

    if (!UserId || !PlanId) {
      return res.status(400).json({
        success: false,
        message: "UserId and PlanId are required",
      });
    }

    const plan = await SubscriptionPlan.findById(PlanId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    let subscription = await Subscription.findOne({ UserId });

    if (subscription) {
      subscription.PlanId = plan._id;
      subscription.SwapsRemaining = plan.SwapLimit;
      subscription.StartDate = new Date();
      await subscription.save();

      return res.status(200).json({
        success: true,
        message: "Subscription updated successfully!",
        subscription,
      });
    }

    subscription = new Subscription({
      UserId,
      PlanId: plan._id,
      SwapsRemaining: plan.SwapLimit,
      StartDate: new Date(),
    });

    await subscription.save();

    return res.status(201).json({
      success: true,
      message: "Subscription purchased successfully!",
      subscription,
    });
  } catch (error) {
    console.error("Error purchasing subscription:", error);
    res.status(500).json({
      success: false,
      message: "Server error while purchasing subscription",
    });
  }
};

// Get a user's active subscription
export const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const subscription = await Subscription.findOne({ UserId: userId }).populate("PlanId");

    if (!subscription) {
      return res.status(200).json({
        success: false,
        message: "No active subscription found",
      });
    }

    return res.status(200).json({
      success: true,
      subscription: {
        UserId: subscription.UserId,
        PlanId: subscription.PlanId._id,
        PlanName: subscription.PlanId.Name,
        SwapLimit: subscription.PlanId.SwapLimit,
        SwapsRemaining: subscription.SwapsRemaining,
        StartDate: subscription.StartDate,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching subscription",
    });
  }
};
