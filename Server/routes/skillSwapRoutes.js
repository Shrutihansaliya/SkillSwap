
  // routes/skillSwapRoutes
  import express from "express";
  import multer from "multer";
  import {
    getSwapsByUser,
  confirmCompletion,
   getCompletedSwapsByUser,
  
  } from "../controllers/skillSwapController.js";

  const router = express.Router();

  // 🛣️ Routes
  router.get("/user/:userId", getSwapsByUser);
  router.get("/user/:userId/history", getCompletedSwapsByUser);
  router.put("/:swapId/confirm", confirmCompletion);
  export default router; // ✅ THIS is required
