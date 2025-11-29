// Server/middleware/adminAuth.js
import User from "../models/User.js";

const adminAuth = async (req, res, next) => {
  try {
    console.log("➡️ adminAuth called. req.userId:", req.userId);

    if (!req.userId) {
      console.log("❌ adminAuth: no req.userId");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.userId).select("email Username isAdmin role Role");
    console.log("👤 adminAuth: found user =>", user);

    if (!user) {
      console.log("❌ adminAuth: user not found");
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Robust checks: isAdmin boolean OR role / Role field (case-insensitive)
    const roleValue = (user.role || user.Role || "").toString().toLowerCase();
    const isAdminFlag = Boolean(user.isAdmin) || roleValue === "admin";

    if (isAdminFlag) {
      console.log("✅ adminAuth: user is admin — allow");
      return next();
    }

    console.log("❌ adminAuth: user is NOT admin", { isAdmin: user.isAdmin, role: user.role, Role: user.Role });
    return res.status(403).json({ success: false, message: "Access denied: Admins only" });
  } catch (err) {
    console.log("❌ adminAuth error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default adminAuth;
