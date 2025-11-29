// controllers/authController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import transporter from "../config/nodemailer.js";

// In-memory OTP store (optional; session can also work)
const otpStore = {};

// Step 1: Register → Send OTP
export const registerUser = async (req, res) => {
  try {
    const { Username, Email, Password, Age, DateOfBirth, Gender, Address, ContactNo, Bio } = req.body;

    const existingUser = await User.findOne({ $or: [{ Email }, { ContactNo }] });
    if (existingUser) return res.status(400).json({ message: "Email or Contact already exists" });

    const hashedPassword = await bcrypt.hash(Password, 10);

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Save in session
    req.session.otp = otp;
    req.session.email = Email;
    req.session.otpExpire = Date.now() + 30 * 1000; // 30 seconds
    req.session.userData = {
      Username,
      Email,
      Password: hashedPassword,
      Age,
      DateOfBirth,
      Gender,
      Address,
      ContactNo,
      Bio: Bio || null,
    };

    // Send OTP email
    await transporter.sendMail({
      from: `"SkillSwap" <${process.env.SENDER_EMAIL}>`,
      to: Email,
      subject: "OTP Verification",
      text: `Your OTP is: ${otp}. It will expire in 30 seconds.`,
    });

    res.json({ success: true, message: "OTP sent. Please verify.", email: Email });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Step 2: Verify OTP & Save User
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore[email];
    if (!record && (!req.session.otp || req.session.email !== email)) 
      return res.status(400).json({ message: "No OTP found. Please register again." });

    if (req.session.otpExpire < Date.now()) {
      req.session.otp = null;
      req.session.email = null;
      req.session.userData = null;
      return res.status(400).json({ message: "OTP expired. Please resend." });
    }

    if (req.session.otp !== String(otp)) return res.status(400).json({ message: "Invalid OTP" });

    const userData = req.session.userData;
    if (!userData || userData.Email !== email) return res.status(400).json({ message: "User data not found in session" });

    const newUser = new User(userData);
    newUser.IsVerified = true;
    await newUser.save();

    // Clear session
    req.session.otp = null;
    req.session.email = null;
    req.session.otpExpire = null;
    req.session.userData = null;

    res.json({ success: true, message: "User registered successfully", userId: newUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Step 3: Resend OTP
// export const resendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!req.session.userData || req.session.userData.Email !== email) {
//       return res.status(400).json({ message: "User data not found. Please register again." });
//     }

//     const otp = String(Math.floor(100000 + Math.random() * 900000));
//     req.session.otp = otp;
//     req.session.otpExpire = Date.now() + 30 * 1000; // reset 30s

//     await transporter.sendMail({
//       from: `"SkillSwap" <${process.env.SENDER_EMAIL}>`,
//       to: email,
//       subject: "Resent OTP Verification",
//       text: `Your new OTP is: ${otp}. It will expire in 30 seconds.`,
//     });

//     res.json({ success: true, message: "New OTP sent" });
//   } catch (err) {
//     console.error("Resend OTP Error:", err.message);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
// Step 3: Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!req.session.userData || req.session.userData.Email !== email) {
      return res.status(400).json({ message: "User data not found. Please register again." });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    req.session.otp = otp;
    req.session.otpExpire = Date.now() + 30 * 1000; // reset 30s

    await transporter.sendMail({
  from: `"SkillSwap" <${process.env.SENDER_EMAIL}>`,
  to: email,
  subject: "OTP Verification - Resend",
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #fff0f6; padding: 40px 0;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); text-align: center;">
        
        <!-- Header -->
        <h2 style="color: #d63384; margin-bottom: 20px;">SkillSwap OTP Verification</h2>
        <p style="color: #333333; font-size: 16px; margin-bottom: 30px;">
          Hello, <br>
          Your new OTP for verification is:
        </p>

        <!-- OTP -->
        <div style="display: inline-block; padding: 15px 30px; background-color: #fbcfe8; color: #9d174d; font-size: 28px; font-weight: bold; border-radius: 8px; letter-spacing: 3px; margin-bottom: 30px;">
          ${otp}
        </div>

        <!-- Note -->
        <p style="color: #555555; font-size: 14px; margin-bottom: 0;">
          This OTP is valid for 30 seconds. If you did not request this, please ignore this email.
        </p>

      </div>
    </div>
  `,
});


    res.json({ success: true, message: "New OTP sent" });
  } catch (err) {
    console.error("Resend OTP Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};