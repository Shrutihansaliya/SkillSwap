// import express from "express";
// import upload from "../middleware/uploadMaterial.js";
// import {
//   uploadMaterial,
//   getMaterialsBySwap,
//   deleteMaterial,
// } from "../controllers/materialController.js";

// const router = express.Router();

// // parse JSON body for DELETE requests
// router.use(express.json());

// router.post("/:swapId/upload", upload.single("file"), uploadMaterial);
// router.get("/:swapId", getMaterialsBySwap);
// router.delete("/:materialId", deleteMaterial);

// export default router;
// backend/routes/materialRoutes.js
import express from "express";
import upload from "../middleware/uploadMaterial.js";
import {
  uploadMaterial,
  getMaterialsBySwap,
  deleteMaterial,
  downloadMaterial,
} from "../controllers/materialController.js";

const router = express.Router();

router.use(express.json());

// ✅ Download route must come BEFORE swapId
router.get("/download/:materialId", downloadMaterial);

router.post("/:swapId/upload", upload, uploadMaterial);
router.get("/:swapId", getMaterialsBySwap);
router.delete("/:materialId", deleteMaterial);

export default router;
