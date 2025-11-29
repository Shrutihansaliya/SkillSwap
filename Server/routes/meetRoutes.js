// server/routes/meetRoutes.js
import express from "express";
import { createMeet, getMeetsForUser } from "../controllers/meetController.js";

const router = express.Router();

// create meet
router.post("/create", createMeet);

// list meets for user
router.get("/user/:userId", getMeetsForUser);

export default router;
