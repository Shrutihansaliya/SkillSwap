import express from "express";
import { getMembers, changePassword } from "../controllers/adminController.js";

const router = express.Router();

router.get("/members", getMembers);
router.put("/change-password", changePassword);

export default router;
