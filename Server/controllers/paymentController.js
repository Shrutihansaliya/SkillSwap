// controllers/paymentController.js
import razorpay from "../config/razorpay.js";
import Payment from "../models/Payment.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Subscription from "../models/Subscription.js";
import crypto from "crypto";
import transporter from "../config/nodemailer.js";
import User from "../models/User.js";
// controllers/paymentController.js


/*
---------------------------------------------------------
 CREATE RAZORPAY ORDER
---------------------------------------------------------
*/
export const createOrder = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    const amount = parseFloat(plan.Price.toString());
    const amountPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: "order_" + Date.now(),
    });

    await Payment.create({
      userId,
      planId,
      amount,
      currency: "INR",
      razorpay_order_id: order.id,
      status: "Created",
    });
    const user = await User.findById(userId);

res.json({
  success: true,
  key: process.env.RAZORPAY_KEY_ID,
  orderId: order.id,
  amount,
  contact: user.ContactNo,   // 👈 send user mobile
  email: user.Email          // 👈 optional but useful
});

    // res.json({
    //   success: true,
    //   key: process.env.RAZORPAY_KEY_ID,
    //   orderId: order.id,
    //   amount,
    // });
  } catch (err) {
    console.log("Order Error:", err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
};

/*
---------------------------------------------------------
 VERIFY PAYMENT & ACTIVATE PLAN
---------------------------------------------------------
*/
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planId,
    } = req.body;

    // Validate signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Update payment record
    await Payment.findOneAndUpdate(
      { razorpay_order_id },
      { razorpay_payment_id, razorpay_signature, status: "Paid" }
    );

    const plan = await SubscriptionPlan.findById(planId);
    const user = await User.findById(userId);

    // Fetch user's all subscriptions
    const subs = await Subscription.find({ UserId: userId });

    const activeSub = subs.find((s) => s.Status === "Active");
    const expiredSub = subs.find((s) => s.Status === "Expired");
    const upcomingSub = subs.find((s) => s.Status === "Upcoming");

    // -------------------------------------------------------------------
    // 1) USER HAS ACTIVE PLAN → Handle Free User, Zero-Swap, Normal Case
    // -------------------------------------------------------------------
    if (activeSub) {
      // ⭐ If Active is Free Plan → Expire & Activate Paid Plan Immediately
      if (activeSub.IsFreePlan === true) {
        activeSub.Status = "Expired";
        await activeSub.save();

        const newActive = new Subscription({
          UserId: userId,
          PlanId: planId,
          SwapsRemaining: plan.SwapLimit,
          IsFreePlan: false,
          Status: "Active",
          PaymentStatus: "Success",
          StartDate: new Date(),
        });

        await newActive.save();

        return res.json({
          success: true,
          message: "Payment verified — Free plan expired and new plan activated",
        });
      }

      // ⭐ If Active Plan has ZERO swaps → Expire it & Promote Upcoming
      if (Number(activeSub.SwapsRemaining) === 0) {
        activeSub.Status = "Expired";
        await activeSub.save();

        // Promote upcoming → Active
        if (upcomingSub) {
          upcomingSub.Status = "Active";
          upcomingSub.StartDate = new Date();
          await upcomingSub.save();
        }
      }

      // ⭐ Normal Case: Active exists → New becomes UPCOMING
      const newUpcoming = new Subscription({
        UserId: userId,
        PlanId: planId,
        SwapsRemaining: plan.SwapLimit,
        IsFreePlan: false,
        Status: "Upcoming",
        PaymentStatus: "Success",
        StartDate: new Date(),
      });

      await newUpcoming.save();

      return res.json({
        success: true,
        message: "Payment verified — New plan added as Upcoming",
      });
    }

    // -------------------------------------------------------------------
    // 2) ONLY EXPIRED PLAN EXISTS → REMOVE IT & ACTIVATE NEW PLAN
    // -------------------------------------------------------------------
    if (expiredSub) {
      await Subscription.deleteOne({ _id: expiredSub._id });

      const newActive = new Subscription({
        UserId: userId,
        PlanId: planId,
        SwapsRemaining: plan.SwapLimit,
        IsFreePlan: false,
        Status: "Active",
        PaymentStatus: "Success",
        StartDate: new Date(),
      });

      await newActive.save();

      return res.json({
        success: true,
        message: "Payment verified — New plan activated",
      });
    }

    // -------------------------------------------------------------------
    // 3) NO PLAN EXISTS → CREATE ACTIVE PLAN
    // -------------------------------------------------------------------
    const newActive = new Subscription({
      UserId: userId,
      PlanId: planId,
      SwapsRemaining: plan.SwapLimit,
      IsFreePlan: false,
      Status: "Active",
      PaymentStatus: "Success",
      StartDate: new Date(),
    });

    await newActive.save();

    // Send email
    await transporter.sendMail({
      from: `SkillSwap <${process.env.SENDER_EMAIL}>`,
      to: user.Email,
      subject: "Payment Successful",
      html: `<h3>Your subscription has been activated!</h3>`,
    });

    return res.json({
      success: true,
      message: "Payment verified — Active plan created",
    });

  } catch (err) {
    console.log("Verify Error:", err);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};




/* ---------------------------------------------------------
   ADMIN — TOTAL REVENUE
--------------------------------------------------------- */
export const getTotalRevenue = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: null,
          countPaid: { $sum: 1 },
          totalSum: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    const data = result[0] || { countPaid: 0, totalSum: 0 };

    return res.json({
      success: true,
      total: Math.round(data.totalSum),
      countPaid: data.countPaid,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue",
    });
  }
};

/* ---------------------------------------------------------
   ADMIN — ALL PAYMENTS
--------------------------------------------------------- */
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate("userId", "Username Email")
      .populate("planId", "Name Price SwapLimit");

    return res.json({
      success: true,
      payments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};
