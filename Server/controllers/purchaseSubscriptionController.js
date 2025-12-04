// controllers/purchaseSubscriptionController.js
import Subscription from "../models/Subscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";

/*
  PURCHASE SUBSCRIPTION (NO PAYMENT route)
*/
export const purchaseSubscription = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId)
      return res.status(400).json({
        success: false,
        message: "userId and planId are required",
      });

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan)
      return res.status(404).json({
        success: false,
        message: "Invalid plan selected",
      });

    // Load all user subscriptions
    const subs = await Subscription.find({ UserId: userId }).sort({
      StartDate: 1,
      createdAt: 1,
    });

    const activeSub = subs.find((s) => s.Status === "Active");
    const upcomingSub = subs.find((s) => s.Status === "Upcoming");
    const expiredSub = subs.find((s) => s.Status === "Expired");

    /*
      ================================================================
      CASE 1:
      USER ALREADY HAS ACTIVE PLAN (free or paid)
      → Keep current active as Active
      → New plan = Upcoming
      → DO NOT expire anything
      ================================================================
    */
    if (activeSub) {
      const newUpcoming = new Subscription({
        UserId: userId,
        PlanId: planId,
        IsFreePlan: false,
        SwapsRemaining: plan.SwapLimit,
        Status: "Upcoming",
        PaymentStatus: "Success",
        StartDate: new Date(),
      });

      await newUpcoming.save();

      return res.json({
        success: true,
        message: "You already have an active plan. New plan added as Upcoming.",
      });
    }

    /*
      ================================================================
      CASE 2:
      NO ACTIVE PLAN (meaning only expired plan exists)
      → Remove expired plan
      → New plan becomes ACTIVE
      This will work with confirmSwap() auto-expire feature.
      ================================================================
    */
    if (expiredSub) {
      await Subscription.deleteOne({ _id: expiredSub._id });

      const newActive = new Subscription({
        UserId: userId,
        PlanId: planId,
        IsFreePlan: false,
        SwapsRemaining: plan.SwapLimit,
        Status: "Active",
        PaymentStatus: "Success",
        StartDate: new Date(),
      });

      await newActive.save();

      return res.json({
        success: true,
        message: "Expired plan removed. New plan activated.",
      });
    }

    /*
      ================================================================
      CASE 3:
      USER HAS NO PLAN AT ALL (first time buyer)
      → New plan becomes ACTIVE
      ================================================================
    */
    const newActive = new Subscription({
      UserId: userId,
      PlanId: planId,
      IsFreePlan: false,
      SwapsRemaining: plan.SwapLimit,
      Status: "Active",
      PaymentStatus: "Success",
      StartDate: new Date(),
    });

    await newActive.save();

    return res.json({
      success: true,
      message: "Plan activated successfully.",
    });
  } catch (err) {
    console.error("Purchase Subscription Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




// Get a user's active subscription
// export const getUserSubscription = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const subscription = await Subscription.findOne({ UserId: userId }).populate("PlanId");

//     if (!subscription) {
//       return res.status(200).json({
//         success: false,
//         message: "No active subscription found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       subscription: {
//         UserId: subscription.UserId,
//         PlanId: subscription.PlanId._id,
//         PlanName: subscription.PlanId.Name,
//         SwapLimit: subscription.PlanId.SwapLimit,
//         SwapsRemaining: subscription.SwapsRemaining,
//         StartDate: subscription.StartDate,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching subscription:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error fetching subscription",
//     });
//   }
// };
// GET ALL SUBSCRIPTIONS OF USER


// export const getUserSubscription = async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const subs = await Subscription.find({ UserId: userId })
//       .populate("PlanId")
//       .sort({ StartDate: -1 });

//    const active = subs.find((s) => s.Status?.toLowerCase() === "active") || null;
// const upcoming = subs.find((s) => s.Status?.toLowerCase() === "upcoming") || null;


//     console.log("📌 All Subs:", subs);
//     console.log("📌 Active:", active);
//     console.log("📌 Upcoming:", upcoming);

//     return res.json({
//       success: true,
//       activePlan: active,
//       upcomingPlan: upcoming,
//       allSubscriptions: subs,
//     });
//   } catch (err) {
//     console.log("getUserSubscription error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch user subscription",
//     });
//   }
// };

export const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subs = await Subscription.find({ UserId: userId })
      .populate("PlanId")
      .sort({ createdAt: 1 });

    // Return ALL active plans  
    const activePlans = subs.filter(s => s.Status === "Active");

    // Return ALL upcoming plans  
    const upcomingPlans = subs.filter(s => s.Status === "Upcoming");

    return res.json({
      success: true,
      activePlans,
      upcomingPlans
    });

  } catch (err) {
    console.error("Error loading subscription:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load subscription"
    });
  }
};


