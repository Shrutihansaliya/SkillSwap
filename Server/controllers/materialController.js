import Material from "../models/Material.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import SkillSwap from "../models/SkillSwap.js";
import Notification from "../models/Notification.js";


// 🟢 Upload Material — Prevent duplicate by original filename
// export const uploadMaterial = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded.",
//       });
//     }

//     const { swapId } = req.params;
//     const { userId } = req.body;

//     // ✅ Get the original file name (not the renamed one)
//     const originalName = req.file.originalname.replace(/\s+/g, "_").toLowerCase();

//     // ✅ Check if the same user has already uploaded this exact file name for the same swap
//     const existingFile = await Material.find({
//       SwapId: swapId,
//       UserId: userId,
//     });

//     const isDuplicate = existingFile.some((mat) => {
//       // Extract the original filename back from the stored FileURL
//       const storedName = path.basename(mat.FileURL).toLowerCase();
//       // Compare only the base name (ignoring unique suffix Multer adds)
//       const storedBase = storedName.split("-")[0]; // before first dash
//       const newBase = path.basename(originalName, path.extname(originalName));
//       return storedBase === newBase;
//     });

//     if (isDuplicate) {
//       // Delete the newly uploaded duplicate
//       const uploadedFilePath = path.join("uploads", "materials", req.file.filename);
//       if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);

//       return res.status(400).json({
//         success: false,
//         message: `❌ You have already uploaded a file named "${originalName}".`,
//       });
//     }

//     // ✅ Save new file if it's not duplicate
//     const filePath = path.join("uploads", "materials", req.file.filename);
//     const newMaterial = new Material({
//       SwapId: swapId,
//       UserId: userId,
//       FileURL: filePath.replace(/\\/g, "/"), // normalize slashes
//     });

//     await newMaterial.save();

//     res.json({
//       success: true,
//       message: "✅ File uploaded successfully.",
//       material: newMaterial,
//     });
//   } catch (err) {
//     console.error("❌ Upload Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later.",
//     });
//   }
// };

export const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const { swapId } = req.params;
    const { userId } = req.body;

    const originalName = req.file.originalname.replace(/\s+/g, "_").toLowerCase();

    const existingFile = await Material.find({
      SwapId: swapId,
      UserId: userId,
    });

    const isDuplicate = existingFile.some((mat) => {
      const storedName = path.basename(mat.FileURL).toLowerCase();
      const storedBase = storedName.split("-")[0];
      const newBase = path.basename(originalName, path.extname(originalName));
      return storedBase === newBase;
    });

    if (isDuplicate) {
      const uploadedFilePath = path.join("uploads", "materials", req.file.filename);
      if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);

      return res.status(400).json({
        success: false,
        message: `❌ You have already uploaded a file named "${originalName}".`,
      });
    }

    // Save new file
    const filePath = path.join("uploads", "materials", req.file.filename);
    const newMaterial = new Material({
      SwapId: swapId,
      UserId: userId,
      FileURL: filePath.replace(/\\/g, "/"),
    });

    await newMaterial.save();

    // -----------------------------------------------------
    // ⭐ ADD NOTIFICATION FUNCTIONALITY HERE
    // -----------------------------------------------------

    const swap = await SkillSwap.findById(swapId).populate({
      path: "RequestId",
      populate: [
        { path: "SenderId", select: "_id Username" },
        { path: "ReceiverId", select: "_id Username" }
      ]
    });

    if (swap && swap.RequestId) {
      const sender = swap.RequestId.SenderId;
      const receiver = swap.RequestId.ReceiverId;

      // Who uploaded?
      const uploadingUser =
        userId.toString() === sender._id.toString() ? sender : receiver;

      // Who should be notified?
      const otherUser =
        userId.toString() === sender._id.toString() ? receiver : sender;

      const message = `${uploadingUser.Username} has uploaded new material for your Skill Swap session.`;

      await Notification.create({
        userId: otherUser._id,
        message,
        type: "material_uploaded",
        link: "/dashboard?tab=swapactivity",
      });
    } else {
      console.log("❌ Swap or RequestId missing — cannot send notification.");
    }

    // -----------------------------------------------------

    res.json({
      success: true,
      message: "✅ File uploaded successfully.",
      material: newMaterial,
    });

  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// export const uploadMaterial = async (req, res) => {
//   try {
//     if (!req.file)
//       return res.status(400).json({ success: false, message: "No file uploaded" });

//     const { swapId } = req.params;
//     const { userId } = req.body;

//     const filePath = path.join("uploads", "materials", req.file.filename);

//     const newMaterial = new Material({
//       SwapId: swapId,
//       UserId: userId,
//       FileURL: filePath.replace(/\\/g, "/"), // normalize slashes
//     });

//     await newMaterial.save();

//     res.json({
//       success: true,
//       message: "File uploaded successfully",
//       material: newMaterial,
//     });
//   } catch (err) {
//     console.error("❌ Upload Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// 🟢 Fetch Materials by Swap
export const getMaterialsBySwap = async (req, res) => {
  try {
    const { swapId } = req.params;
    const materials = await Material.find({ SwapId: swapId })
      .populate("UserId", "Username")
      .sort({ UploadedAt: -1 });

    res.json({ success: true, materials });
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🗑️ Secure Delete Material
// export const deleteMaterial = async (req, res) => {
//   try {
//     const { materialId } = req.params;
//     const { userId } = req.body;

//     console.log("🟡 Delete Request:", { materialId, userId }); // Debug log

//     const material = await Material.findById(materialId);
//     if (!material)
//       return res.status(404).json({ success: false, message: "Material not found" });

//     if (material.UserId.toString() !== userId) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Not authorized to delete this file" });
//     }

//     const filePath = path.join(process.cwd(), material.FileURL);
//     console.log("📁 File Path:", filePath);

//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

//     await Material.findByIdAndDelete(materialId);
//     res.json({ success: true, message: "Material deleted successfully" });
//   } catch (err) {
//     console.error("❌ Delete Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { userId } = req.body;

    const material = await Material.findById(materialId);
    if (!material)
      return res.status(404).json({ success: false, message: "Material not found" });

    if (material.UserId.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to delete this file" });
    }

    // ✅ Make correct absolute path
    const filePath = path.join(
      process.cwd(),
      material.FileURL.replace(/\\/g, "/")
    );

    console.log("🗑️ Deleting file:", filePath);

    // ✅ Delete file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("💾 File deleted from uploads folder");
    } else {
      console.log("⚠️ File not found on server, skipping deletion");
    }

    // ✅ Delete DB record
    await Material.findByIdAndDelete(materialId);

    res.json({ success: true, message: "Material deleted successfully" });

  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// 🟢 Download Material (Final working version)
export const downloadMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid material ID format" });
    }

    const material = await Material.findById(materialId);
    if (!material)
      return res
        .status(404)
        .json({ success: false, message: "Material not found" });

    // ✅ Ensure file exists
    const filePath = path.join(process.cwd(), material.FileURL);
    console.log("📂 Downloading file from:", filePath);

    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found on disk:", filePath);
      return res
        .status(404)
        .json({ success: false, message: "File not found on server" });
    }

    // ✅ Set correct headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");

    // ✅ Stream file (no “Cannot GET” issues)
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      console.error("❌ Stream Error:", err);
      res.status(500).json({ success: false, message: "Error reading file" });
    });
  } catch (err) {
    console.error("❌ Download Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
