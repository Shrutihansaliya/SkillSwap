// routes/callRoutes.js
import express from "express";
import {
  startCall,
  endCall,
  getCallsBySwap,
  getCallsByUser,
} from "../controllers/callController.js";
// import authMiddleware from "../middleware/authMiddleware.js"; // jo tame use karta hoy to

const router = express.Router();

// ✅ Call start
// POST /api/calls/start
router.post("/start", /* authMiddleware, */ startCall);

// ✅ Call end
// PUT /api/calls/end/:callId
router.put("/end/:callId", /* authMiddleware, */ endCall);

// ✅ Particular swap ni call history
// GET /api/calls/by-swap/:swapId
router.get("/by-swap/:swapId", /* authMiddleware, */ getCallsBySwap);

// ✅ Particular user ni call history
// GET /api/calls/by-user/:userId
router.get("/by-user/:userId", /* authMiddleware, */ getCallsByUser);

export default router;
