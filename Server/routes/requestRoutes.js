// Server/routes/requestRoutes.js
import express from "express";
import {
  sendRequest,
  cancelRequest,
  getAllMembersWithSkills,
  getSentRequests,
  getReceivedRequests,
  updateRequestStatus,
  getSenderSkills,
  acceptRequest,
  confirmSwap,
 getAllCategoriesWithSkills, 
} from "../controllers/requestController.js";




const router = express.Router();

router.post("/send", sendRequest);
router.delete("/cancel/:id", cancelRequest);
router.get("/users/all", getAllMembersWithSkills);
router.get("/sent/:userId", getSentRequests);
router.get("/received/:userId", getReceivedRequests);
router.put("/status/:id", updateRequestStatus);
router.get("/sender-skills/:senderId", getSenderSkills);
router.put("/accept/:id", acceptRequest);
router.post("/swap/confirm/:requestId", confirmSwap);
router.get("/categories", getAllCategoriesWithSkills);

export default router;
