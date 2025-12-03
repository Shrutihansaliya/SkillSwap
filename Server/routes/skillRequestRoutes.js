// routes/skillRequestRoutes.js
import express from "express";
import {
  createSkillRequest,
  getRequestsByUser,
  getAllRequests,
  getRequestById,
  replyToRequest,
  markRequestAsRead,
} from "../controllers/skillRequestController.js";

const router = express.Router();

/**
 * Simple admin-check middleware.
 *
 * Preferred: if you already have authentication that sets req.user,
 * the middleware uses req.user.Role === "Admin".
 *
 * Quick dev option: send header `x-admin: true` to simulate admin (only for testing).
 *
 * IMPORTANT: remove or replace header-check in production and rely on proper auth JWT/session.
 */
const requireAdmin = (req, res, next) => {
  // If you have req.user from your auth middleware, use it:
  if (req.user && req.user.Role === "Admin") return next();

  // Development fallback: allow if header x-admin: "true"
  const isAdminHeader = (req.headers["x-admin"] || "").toString().toLowerCase() === "true";
  if (isAdminHeader) return next();

  return res.status(403).json({ success: false, message: "Admin privileges required" });
};

// Public user route to create a request
// POST /api/skill-requests
router.post("/", createSkillRequest);

// Get requests for a specific user
// GET /api/skill-requests/user/:userId
router.get("/user/:userId", getRequestsByUser);

// Admin routes
// GET all requests
router.get("/", requireAdmin, getAllRequests);

// GET one request
router.get("/:id", requireAdmin, getRequestById);

// Admin reply/update
router.put("/:id/reply", requireAdmin, replyToRequest);

// Optional mark-read route (can be admin or user depending on logic)
// route kept admin for simplicity; change as needed
router.put("/:id/mark-read", requireAdmin, markRequestAsRead);

export default router;
