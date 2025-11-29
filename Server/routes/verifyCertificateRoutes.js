import express from "express";
import {
  getAllCertificates,
  approveCertificate,
  rejectCertificate,
} from "../controllers/verifyCertificateController.js";

const router = express.Router();

router.get("/", getAllCertificates);
router.put("/approve/:id", approveCertificate);
router.put("/reject/:id", rejectCertificate);

export default router;
