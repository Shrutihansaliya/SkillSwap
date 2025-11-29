// controllers/profileController.js
import User from "../models/User.js";

// 🔹 Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-Password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
