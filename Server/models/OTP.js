// models/OTP.js
import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema({
  Email: { type: String, required: true },
  OTP: { type: String, required: true },
  ExpiresAt: { type: Date, required: true },
});

export default mongoose.model("OTP", OTPSchema);
