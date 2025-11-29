// routes/profileRoutes.js
import express from "express";
import { getProfile } from "../controllers/profileController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

// GET /api/profile
router.get("/", userAuth, getProfile);

export default router;
