// controllers/paymentController.js
import razorpay from "../config/razorpay.js";
import Payment from "../models/Payment.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Subscription from "../models/Subscription.js";
import crypto from "crypto";
import transporter from "../config/nodemailer.js";
import User from "../models/User.js";

/* ---------------------------------------------------------
   CREATE ORDER (FIXED AMOUNT FOR DECIMAL128)
--------------------------------------------------------- */
export const createOrder = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    const amountRupees = parseFloat(plan.Price.toString());
    const amountPaise = Math.round(amountRupees * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    await Payment.create({
      userId,
      planId,
      amount: amountRupees,
      currency: "INR",
      razorpay_order_id: order.id,
      status: "Created",
    });

    return res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: amountRupees,
      planName: plan.Name,
    });
  } catch (err) {
    console.log("Order Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Order creation failed" });
  }
};

/* ---------------------------------------------------------
   VERIFY PAYMENT
--------------------------------------------------------- */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planId,
    } = req.body;

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Signature – Payment Failed",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "Paid",
      },
      { new: true }
    );

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: "Payment record not found",
      });
    }

    const user = await User.findById(userId);
    const plan = await SubscriptionPlan.findById(planId);

    let subscription = await Subscription.findOne({ UserId: userId });

    const previousSwaps = subscription?.SwapsRemaining || 0;
    const newSwaps = plan.SwapLimit;
    const updatedSwaps = previousSwaps + newSwaps;

    subscription = await Subscription.findOneAndUpdate(
      { UserId: userId },
      {
        PlanId: planId,
        SwapsRemaining: updatedSwaps,
        PaymentStatus: "Success",
        RazorpayOrderId: razorpay_order_id,
        RazorpayPaymentId: razorpay_payment_id,
        RazorpaySignature: razorpay_signature,
        StartDate: new Date(),
      },
      { new: true, upsert: true }
    );

    const emailHTML = `
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 25px; font-family: Arial, sans-serif; border: 1px solid #e6e6e6;">
    <div style="text-align: center; padding-bottom: 10px;">
      <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="80" />
      <h2 style="color: #2d89ff; margin-top: 10px;">Payment Successful 🎉</h2>
    </div>

    <p style="font-size: 16px; color: #444;">
      Hello <strong>${user.Username}</strong>,  
      <br><br>
      Thank you for upgrading your <strong>SkillSwap Plan</strong>. Your payment has been successfully processed.
    </p>

    <div style="background: #f3f8ff; padding: 15px; border-radius: 10px; margin-top: 20px; border-left: 5px solid #2d89ff;">
      <h3 style="color: #2d89ff; margin: 0 0 10px 0;">📦 Plan Details</h3>
      <p style="margin: 5px 0;"><strong>Plan:</strong> ${plan.Name}</p>
      <p style="margin: 5px 0;"><strong>Swaps Added:</strong> ${newSwaps}</p>
      <p style="margin: 5px 0;"><strong>Total Swaps Now:</strong> ${updatedSwaps}</p>
    </div>

    <div style="background: #fff6e5; padding: 15px; border-radius: 10px; margin-top: 20px; border-left: 5px solid #ffb020;">
      <h3 style="color: #ff9800; margin: 0 0 10px 0;">💳 Payment Details</h3>
      <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${payment.amount}</p>
      <p style="margin: 5px 0;"><strong>Order ID:</strong> ${razorpay_order_id}</p>
      <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
    </div>

    <p style="margin-top: 25px; font-size: 14px; color: #666; text-align: center;">
      Need help? Contact us anytime: 
      <a href="mailto:${process.env.SENDER_EMAIL}" style="color: #2d89ff; text-decoration: none;">
        ${process.env.SENDER_EMAIL}
      </a>
    </p>

    <hr style="border: none; height: 1px; background: #eee; margin: 20px 0;" />

    <p style="text-align: center; font-size: 13px; color: #888;">
      © ${new Date().getFullYear()} SkillSwap. All rights reserved.
    </p>
  </div>
`;

    await transporter.sendMail({
      from: `"SkillSwap" <${process.env.SENDER_EMAIL}>`,
      to: user.Email,
      subject: "🎉 Payment Successful – SkillSwap Premium Activated!",
      html: emailHTML,
    });

    return res.json({
      success: true,
      message: "Subscription Activated & Email Sent!",
    });
  } catch (error) {
    console.log("Verify Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

/* ---------------------------------------------------------
   GET TOTAL REVENUE
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

    const total =
      typeof data.totalSum === "number"
        ? Math.round(data.totalSum)
        : Math.round(parseFloat(data.totalSum?.toString() || "0"));

    console.log("💰 Revenue aggregate:", data, " -> total:", total);

    return res.json({
      success: true,
      total,
      countPaid: data.countPaid || 0,
    });
  } catch (err) {
    console.error("Revenue Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue",
    });
  }
};


/* ---------------------------------------------------------
   ADMIN – GET ALL PAYMENTS WITH USER & PLAN
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
    console.error("Admin Payments Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};