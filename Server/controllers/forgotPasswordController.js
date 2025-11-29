import bcrypt from "bcryptjs";
import User from "../models/User.js";
import transporter from "../config/nodemailer.js";

// Step 1: Request OTP
export const requestOtp = async (req, res) => {
  try {
    const { Email } = req.body;
    if (!Email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ Email });
    if (!user) return res.status(400).json({ message: "Email not found" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    req.session.forgotOtp = otp;
    req.session.forgotEmail = Email;
    req.session.forgotOtpExpire = Date.now() + 30 * 1000; // 30 seconds

    await transporter.sendMail({
  from: `"SkillSwap" <${process.env.SENDER_EMAIL}>`,
  to: Email,
  subject: "Password Reset OTP",
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #ffe6f0; padding: 40px 0;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">

        <!-- Header -->
        <h2 style="color: #d63384; margin-bottom: 20px;">SkillSwap Password Reset</h2>
        <p style="color: #333333; font-size: 16px; margin-bottom: 30px;">
          Hello <strong>${Email}</strong>,<br>
          Use the OTP below to reset your password.
        </p>

        <!-- OTP -->
        <div style="display: inline-block; padding: 15px 30px; background-color: #fbcfe8; color: #9d174d; font-size: 28px; font-weight: bold; border-radius: 8px; letter-spacing: 3px; margin-bottom: 30px;">
          ${otp}
        </div>

        <!-- Note -->
        <p style="color: #555555; font-size: 14px; margin-bottom: 0;">
          This OTP is valid for 30 seconds. If you did not request a password reset, please ignore this email.
        </p>

      </div>
    </div>
  `,
});


    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot Password OTP Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Step 2: Verify OTP
export const verifyOtp = (req, res) => {
  try {
    const { Email, otp } = req.body;

    if (!req.session.forgotOtp || req.session.forgotEmail !== Email) {
      return res.status(400).json({ message: "Invalid OTP or email mismatch" });
    }

    if (req.session.forgotOtpExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (req.session.forgotOtp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify Forgot OTP Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Step 3: Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { Email, newPassword } = req.body;

    if (!req.session.forgotEmail || req.session.forgotEmail !== Email) {
      return res.status(400).json({ message: "Session expired or invalid" });
    }

    const user = await User.findOne({ Email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    // Clear session
    req.session.forgotOtp = null;
    req.session.forgotEmail = null;
    req.session.forgotOtpExpire = null;

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
