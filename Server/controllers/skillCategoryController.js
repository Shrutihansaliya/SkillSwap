import SkillCategory from "../models/SkillCategory.js";

// ➤ Add new category
export const addCategory = async (req, res) => {
  try {
    const { CategoryName } = req.body;
    if (!CategoryName) {
      return res.status(400).json({ message: "CategoryName is required" });
    }

    const existing = await SkillCategory.findOne({ CategoryName });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const newCategory = new SkillCategory({ CategoryName });
    await newCategory.save();

    res.status(201).json({
      message: "Category added successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("❌ Error adding category:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ➤ Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await SkillCategory.find().sort({ CategoryId: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ➤ Update category name
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { CategoryName } = req.body;
    if (!CategoryName) {
      return res.status(400).json({ message: "CategoryName is required" });
    }

    const updatedCategory = await SkillCategory.findByIdAndUpdate(
      id,
      { CategoryName },
      { new: true }
    );

    if (!updatedCategory) return res.status(404).json({ message: "Category not found" });

    res.json({
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("❌ Error updating category:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ➤ Toggle status Active/Inactive
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await SkillCategory.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.status = category.status === "Active" ? "Inactive" : "Active";
    await category.save();

    res.json({
      message: "Category status updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("❌ Error toggling category status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
