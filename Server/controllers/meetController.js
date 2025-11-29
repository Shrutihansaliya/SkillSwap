// server/controllers/meetController.js
import Meet from "../models/Meet.js";

/**
 * Create a new meet
 * POST /api/meets/create
 */
export const createMeet = async (req, res) => {
  try {
    const { link, scheduledAt, createdBy, participants = [], swapId = null } = req.body;

    if (!link || !createdBy) {
      return res.status(400).json({ success: false, message: "link and createdBy are required" });
    }

    const meet = await Meet.create({
      link,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdBy,
      participants,
      swapId,
    });

    return res.status(201).json({ success: true, message: "Meet created", meet });
  } catch (err) {
    console.error("createMeet error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * Get meets for a user
 * GET /api/meets/user/:userId
 */
export const getMeetsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });

    // fetch meets where user is creator or participant
    const meets = await Meet.find({
      $or: [{ createdBy: userId }, { participants: userId }],
    })
      .sort({ scheduledAt: 1 })
      .lean();

    return res.json({ success: true, meets });
  } catch (err) {
    console.error("getMeetsForUser error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
