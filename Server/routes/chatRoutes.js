// import express from "express";
// import { getChatMessages, sendMessage } from "../controllers/chatController.js";

// const router = express.Router();

// // Get all messages for a swap
// router.get("/:swapId", getChatMessages);

// // Send a message
// router.post("/", sendMessage);

// export default router;
// backend/routes/chatRoutes.js
import express from "express";
import {
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/:swapId", getChatMessages);
router.post("/", sendMessage);
router.put("/read", markMessagesAsRead);

export default router;

