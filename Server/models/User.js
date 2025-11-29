
import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";
import City from "./City.js"; // Import the City model

// Pass mongoose connection to AutoIncrementFactory
const AutoIncrement = AutoIncrementFactory(mongoose);

const UserSchema = new mongoose.Schema({
  UserID: { type: Number, unique: true }, // Auto-increment

  // 🔹 Username: allow letters, numbers, underscores, 3-30 characters
  Username: { 
    type: String, 
    required: true, 
    maxlength: 100,
    minlength: 3,
    match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"] 
  },

  Email: { type: String, required: true, unique: true, maxlength: 255 },

  // 🔹 Password: min 6 chars, at least 1 digit, 1 special char
  Password: { 
    type: String, 
    required: true, 
    minlength: 6,
    match: [/(?=.*[0-9])(?=.*[!@#$%^&*])/, "Password must contain at least one digit and one special character"] 
  },

  GoogleID: { type: String, default: null },

  // 🔹 DateOfBirth: must be at least 21, cannot be future
  DateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        const today = new Date();
        const minDOB = new Date(today.setFullYear(today.getFullYear() - 21));
        return value <= minDOB; // must be older than 21
      },
      message: "User must be at least 21 years old",
    },
  },

  Gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

  // 🔹 StreetNo and Area: allow digits, letters, spaces, commas
  StreetNo: { 
    type: String, 
    required: true,
    match: [/^[a-zA-Z0-9\s,]+$/, "StreetNo can only contain letters, numbers, spaces, and commas"] 
  },
  Area: { 
    type: String, 
    required: true,
    match: [/^[a-zA-Z0-9\s,]+$/, "Area can only contain letters, numbers, spaces, and commas"] 
  },

  // 🔹 Reference to City collection
  City: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },

  ContactNo: { type: String, required: true, unique: true, maxlength: 10, minlength: 10 },
  Bio: { type: String, default: null },

  // 🔹 Profile image: only jpg, jpeg, png
  ProfileImageURL: { 
    type: String,
    default: null,
    validate: {
      validator: function (value) {
        if (!value) return true; // allow null
        return /\.(jpe?g|png)$/i.test(value);
      },
      message: "Profile image must be a jpg, jpeg, or png file",
    },
  },

  RegisteredDate: { type: Date, default: Date.now },
  Status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  IsVerified: { type: Boolean, default: false },
  Role: { type: String, enum: ["member", "Admin"], default: "member" },
});

// ✅ Auto-increment UserID starting from 1
UserSchema.plugin(AutoIncrement, { inc_field: "UserID", start_seq: 1 });

export default mongoose.model("User", UserSchema);
