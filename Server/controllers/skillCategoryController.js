


// controllers/skillCategoryController.js
import SkillCategory from "../models/SkillCategory.js";
import fs from "fs";
import path from "path";

const iconsDir = "icons";

// -----------------------------
// ADD CATEGORY
// -----------------------------
export const addCategory = async (req, res) => {
  try {
    const { CategoryName } = req.body;

    // Duplicate category validation
    const exists = await SkillCategory.findOne({ CategoryName });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // Image uploaded?
    let imageName = "";
    if (req.file) {
      const fileName = req.file.filename;

      // Duplicate image validation
      const imageExists = await SkillCategory.findOne({ image: fileName });
      if (imageExists) {
        fs.unlinkSync(path.join(iconsDir, fileName)); // delete uploaded duplicate
        return res.status(400).json({ message: "Image already used by another category" });
      }

      imageName = fileName;
    }

    const category = await SkillCategory.create({
      CategoryName,
      image: imageName,
      status: "Active",
    });

    res.json({ success: true, message: "Category added", data: category });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error adding category" });
  }
};

// -----------------------------
// UPDATE CATEGORY
// -----------------------------
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { CategoryName } = req.body;

    const category = await SkillCategory.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // If a new image is uploaded
    if (req.file) {
      const newFile = req.file.filename;

      // Prevent duplicate image name
      const duplicate = await SkillCategory.findOne({ image: newFile, _id: { $ne: id } });
      if (duplicate) {
        fs.unlinkSync(path.join(iconsDir, newFile)); // delete uploaded duplicate
        return res.status(400).json({ message: "Image already in use" });
      }

      // Delete old image if exists
      if (category.image && fs.existsSync(path.join(iconsDir, category.image))) {
        fs.unlinkSync(path.join(iconsDir, category.image));
      }

      category.image = newFile;
    }

    category.CategoryName = CategoryName;
    await category.save();

    res.json({ success: true, message: "Category updated", data: category });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating category" });
  }
};

// -----------------------------
// TOGGLE ACTIVE/INACTIVE
// -----------------------------
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await SkillCategory.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.status = category.status === "Active" ? "Inactive" : "Active";
    await category.save();

    res.json({ success: true, message: "Status updated", data: category });

  } catch (err) {
    res.status(500).json({ message: "Error toggling status" });
  }
};

// -----------------------------
// GET ALL CATEGORIES
// -----------------------------

// ➤ Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await SkillCategory.find().sort({ CategoryId: 1 });

    const updated = categories.map((cat) => ({
      ...cat._doc,
      image: cat.image ? cat.image : "/icons/default.png"
    }));

    res.json(updated);

  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};