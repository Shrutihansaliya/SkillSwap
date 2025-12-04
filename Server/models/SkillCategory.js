// import mongoose from "mongoose"; 
// import AutoIncrementFactory from "mongoose-sequence";

// const AutoIncrement = AutoIncrementFactory(mongoose);

// const skillCategorySchema = new mongoose.Schema({
//   CategoryId: Number, // auto-incremented
//   CategoryName: {
//     type: String,
//     required: true,
//     maxlength: 100
//   },
//   status: {
//     type: String,
//     enum: ["Active", "Inactive"],
//     default: "Active",
//   },
// });

// // Auto-increment CategoryId
// skillCategorySchema.plugin(AutoIncrement, { inc_field: "CategoryId" });

// export default mongoose.model("SkillCategory", skillCategorySchema);
// models/SkillCategory.js
import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const skillCategorySchema = new mongoose.Schema({
  CategoryId: Number, // auto-incremented
  CategoryName: {
    type: String,
    required: true,
    maxlength: 100,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
  // 🔹 NEW: one or multiple image paths
 image: { type: String }
});

// Auto-increment CategoryId
skillCategorySchema.plugin(AutoIncrement, { inc_field: "CategoryId" });

export default mongoose.model("SkillCategory", skillCategorySchema);
