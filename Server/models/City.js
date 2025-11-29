import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
});

const City = mongoose.model("City", citySchema);
export default City;
