import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const skillSchema = new mongoose.Schema({
  SkillId: Number, // auto increment
  CategoryId: {
    type: Number,
    required: true,
    ref: "SkillCategory", // foreign key reference
  },
  Name: {
    type: String,
    required: true,
    maxlength: 150,
  },
  Status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
});

// Auto-increment SkillId
skillSchema.plugin(AutoIncrement, { inc_field: "SkillId" });

export default mongoose.model("Skill", skillSchema);
