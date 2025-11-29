// Server/controllers/loginController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// In-memory store for login attempts (replace with DB/Redis in production)
const loginAttempts = {};

export const loginUser = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ Email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    // -------------------------
    // BLOCK / SUSPENSION CHECKS
    // -------------------------
    // If Status explicitly Inactive -> blocked
    if (user.Status && String(user.Status).toLowerCase() === "inactive") {
      return res.status(403).json({ success: false, message: "Your account is blocked. Please contact support." });
    }

    // If suspended -> check expiry
    if (user.isSuspended) {
      if (user.suspensionUntil) {
        const now = new Date();
        const until = new Date(user.suspensionUntil);
        if (until.getTime() > now.getTime()) {
          // still suspended
          return res.status(403).json({
            success: false,
            message: `Your account is suspended until ${until.toLocaleString()}`,
          });
        } else {
          // suspension expired -> auto-unsuspend and continue
          user.isSuspended = false;
          user.suspensionUntil = null;
          user.Status = "Active";
          await user.save().catch((e) => console.warn("Auto-unsuspend save failed:", e));
        }
      } else {
        // indefinite suspension
        return res.status(403).json({ success: false, message: "Your account is suspended. Please contact support." });
      }
    }

    // -------------------------
    // RATE LIMIT / BRUTE-FORCE
    // -------------------------
    if (!loginAttempts[Email]) loginAttempts[Email] = { count: 0, blockUntil: null, delay: 0 };
    const attemptData = loginAttempts[Email];

    if (attemptData.blockUntil && Date.now() < attemptData.blockUntil) {
      const remaining = Math.ceil((attemptData.blockUntil - Date.now()) / 1000);
      return res.status(403).json({
        success: false,
        message: `Too many failed attempts. Try again in ${remaining} seconds.`,
      });
    }

    // -------------------------
    // PASSWORD CHECK
    // -------------------------
    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      attemptData.count += 1;

      if (attemptData.count >= 3) {
        attemptData.delay = attemptData.delay ? attemptData.delay + 30000 : 30000;
        attemptData.blockUntil = Date.now() + attemptData.delay;
        attemptData.count = 0;
        return res.status(403).json({
          success: false,
          message: `Too many failed attempts. Login blocked for ${attemptData.delay / 1000} seconds.`,
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid password. You have ${3 - attemptData.count} attempts left.`,
      });
    }

    // Reset attempts on successful login
    loginAttempts[Email] = { count: 0, blockUntil: null, delay: 0 };

    // -------------------------
    // ISSUE JWT + COOKIE
    // -------------------------
    const token = jwt.sign({ id: user._id, role: user.Role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // return minimal user object (avoid sending password)
    const safeUser = {
      _id: user._id,
      Username: user.Username,
      Email: user.Email,
      Role: user.Role,
      Status: user.Status,
      isSuspended: user.isSuspended || false,
      suspensionUntil: user.suspensionUntil || null,
    };

    res.json({
      success: true,
      message: "Logged in successfully!",
      token,
      role: user.Role,
      user: safeUser,
    });
  } catch (err) {
    console.error("loginUser error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { Email, newPassword } = req.body;
    if (!Email || !newPassword) {
      return res.status(400).json({ success: false, message: "Email and new password required" });
    }

    const user = await User.findOne({ Email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.Password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
