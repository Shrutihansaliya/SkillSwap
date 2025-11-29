// Server/middleware/userAuth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const userAuth = async (req, res, next) => {
  try {
    // support cookie token or Authorization header Bearer
    const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const userId = decoded.id || decoded.userId || decoded._id;
    if (!userId) return res.status(401).json({ success: false, message: "Invalid token payload" });

    const user = await User.findById(userId).select("-Password");
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    // If Status is explicitly "Inactive" -> treat as blocked
    if (user.Status && user.Status.toLowerCase() === "inactive") {
      return res.status(403).json({ success: false, message: "Your account is blocked. Please contact support." });
    }

    // If suspended -> check expiry
    if (user.isSuspended) {
      if (user.suspensionUntil) {
        const now = new Date();
        if (new Date(user.suspensionUntil).getTime() <= now.getTime()) {
          // automatic unsuspend: clear fields and continue
          user.isSuspended = false;
          user.suspensionUntil = null;
          user.Status = "Active";
          await user.save().catch((e) => console.warn("Auto-unsuspend save failed:", e));
        } else {
          // still suspended
          return res.status(403).json({
            success: false,
            message: `Your account is suspended until ${new Date(user.suspensionUntil).toLocaleString()}`,
          });
        }
      } else {
        // suspended indefinitely
        return res.status(403).json({ success: false, message: "Your account is suspended. Contact support to reactivate." });
      }
    }

    // Attach user & id
    req.userId = user._id;
    req.user = user;
    next();
  } catch (err) {
    console.error("userAuth error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default userAuth;
