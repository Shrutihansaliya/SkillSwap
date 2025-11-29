import Skill from "../models/Skill.js";
import SkillCategory from "../models/SkillCategory.js";

// Add new skill
export const addSkill = async (req, res) => {
  try {
    const { CategoryId, Name } = req.body;
    if (!CategoryId || !Name) return res.status(400).json({ message: "All fields are required" });

    const skill = new Skill({ CategoryId, Name });
    await skill.save();
    res.status(201).json({ message: "Skill added successfully", skill });
  } catch (error) {
    res.status(500).json({ message: "Error adding skill", error });
  }
};

// Get all skills with category
export const getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.aggregate([
      {
        $lookup: {
          from: SkillCategory.collection.name,
          localField: "CategoryId",
          foreignField: "CategoryId",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ]);
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: "Error fetching skills", error });
  }
};

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = await SkillCategory.find().sort({ CategoryName: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error });
  }
};

// Update skill
export const updateSkill = async (req, res) => {
  try {
    const { CategoryId, Name } = req.body;
    if (!CategoryId || !Name) return res.status(400).json({ message: "All fields are required" });

    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { CategoryId, Name },
      { new: true }
    );

    if (!skill) return res.status(404).json({ message: "Skill not found" });
    res.json({ message: "Skill updated successfully", skill });
  } catch (error) {
    res.status(500).json({ message: "Error updating skill", error });
  }
};

// Toggle Active / Inactive
export const toggleSkillStatus = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    skill.Status = skill.Status === "Active" ? "Inactive" : "Active";
    await skill.save();
    res.json({ message: `Skill ${skill.Status} successfully`, data: skill });
  } catch (error) {
    res.status(500).json({ message: "Error toggling skill status", error });
  }
};
