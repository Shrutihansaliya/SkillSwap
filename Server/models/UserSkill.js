// import mongoose from "mongoose";
// import AutoIncrementFactory from "mongoose-sequence";

// const AutoIncrement = AutoIncrementFactory(mongoose);

// const userSkillSchema = new mongoose.Schema({
//   UserSkillId: { type: Number, unique: true },
//   // UserId: { type: Number, required: true, ref: "User" },
//   UserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   SkillId: { type: Number, required: true, ref: "Skill" },
//   CertificateURL: { type: String, default: null }, // ✅ Certificate upload
//   Source: { type: String, maxlength: 150, default: null },
//   AddedDate: { type: Date, default: Date.now },
//   CertificateStatus: { 
//     type: String, 
//     enum: ["Pending", "Verified", "Rejected"], 
//     default: "Pending" 
//   }
// });

// userSkillSchema.plugin(AutoIncrement, { inc_field: "UserSkillId" });

// export default mongoose.model("UserSkill", userSkillSchema);
import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const userSkillSchema = new mongoose.Schema({
  UserSkillId: { type: Number, unique: true },

  UserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  SkillId: { type: Number, required: true, ref: "Skill" },

  CertificateURL: { type: String, default: null },

  ContentFileURL: { type: String, default: null }, // ⭐ NEW FIELD

  Source: { type: String, maxlength: 150, default: null },

  SkillAvailability: {
    type: String,
    enum: ["Available", "Unavailable"], // ⭐ NEW ENUM
    default: "Available",              // ⭐ DEFAULT (NO UI INPUT)
  },

  AddedDate: { type: Date, default: Date.now },

  CertificateStatus: {
    type: String,
    enum: ["Pending", "Verified", "Rejected"],
    default: "Pending",
  },
});

userSkillSchema.plugin(AutoIncrement, { inc_field: "UserSkillId" });

export default mongoose.model("UserSkill", userSkillSchema);
