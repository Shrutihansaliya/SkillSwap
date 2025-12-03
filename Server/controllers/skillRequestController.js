// controllers/skillRequestController.js
import SkillRequest from "../models/SkillRequest.js";
import User from "../models/User.js"; // optional: used for validation

/**
 * Create a new skill request (user)
 * POST /api/skill-requests
 * body: { userId, username, skillName, message }
 */
export const createSkillRequest = async (req, res) => {
  try {
    const { userId, username, skillName, message } = req.body;

    if (!userId || !skillName) {
      return res.status(400).json({ success: false, message: "userId and skillName are required" });
    }

    // Optional: verify user exists (helps prevent bogus userId)
    // If you don't want this query, you can remove it.
    const userExists = await User.findById(userId).select("_id Username");
    if (!userExists) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const reqDoc = new SkillRequest({
      UserId: userId,
      Username: username || userExists.Username || "Unknown",
      SkillName: skillName.trim(),
      Message: message ? message.trim() : null,
      Status: "Pending",
    });

    await reqDoc.save();

    // NOTE: no email is sent — as requested.
    // If you want to notify admins in future, you can add notification logic here.

    res.status(201).json({ success: true, message: "Request sent to admin", request: reqDoc });
  } catch (err) {
    console.error("createSkillRequest error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all requests of a user
 * GET /api/skill-requests/user/:userId
 */
export const getRequestsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const requests = await SkillRequest.find({ UserId: userId }).sort({ CreatedAt: -1 }).lean();
    res.json({ success: true, requests });
  } catch (err) {
    console.error("getRequestsByUser error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all requests (admin)
 * GET /api/skill-requests
 * - Admin-only
 */
export const getAllRequests = async (req, res) => {
  try {
    const requests = await SkillRequest.find().sort({ CreatedAt: -1 }).lean();
    res.json({ success: true, requests });
  } catch (err) {
    console.error("getAllRequests error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get single request by id
 * GET /api/skill-requests/:id
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const reqDoc = await SkillRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, request: reqDoc });
  } catch (err) {
    console.error("getRequestById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Admin reply/update
 * PUT /api/skill-requests/:id/reply
 * body: { status, adminReply }
 * Admin-only
 */
export const replyToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status || "")) {
      return res.status(400).json({ success: false, message: "Invalid status. Use Pending, Approved or Rejected" });
    }

    const reqDoc = await SkillRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });

    reqDoc.Status = status;
    reqDoc.AdminReply = adminReply ? adminReply.trim() : null;
    reqDoc.ReadByAdmin = true;
    reqDoc.UpdatedAt = Date.now();

    await reqDoc.save();

    // Optional: you can add a notification for user here (not email) — omitted per request.

    res.json({ success: true, message: "Request updated", request: reqDoc });
  } catch (err) {
    console.error("replyToRequest error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Optional: mark a request as read by the user (if you want)
 * PUT /api/skill-requests/:id/mark-read
 */
export const markRequestAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const reqDoc = await SkillRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });

    reqDoc.ReadByAdmin = true; // or another flag if you track userReads
    await reqDoc.save();
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("markRequestAsRead error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
