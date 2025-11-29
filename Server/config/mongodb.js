// import mongoose from "mongoose";
// const connectDB=async ()=>{
//     mongoose.connection.on('connected',()=>console.log("DB connected"));
//     await mongoose.connect(`${process.env.MONGO_URL}/skillswap`);
// }

// export default connectDB;


import mongoose from "mongoose";
// import User from "../models/User.js"; // ✅ correct relative path
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: "skillswap",  // ✅ makes sure DB name is correct
    });
    console.log("✅ MongoDB connected successfully:", process.env.MONGO_URL);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
};
// // 2️⃣ Delete users with null email
// const deleteNullEmails = async () => {
//   try {
//     await connectDB(); // make sure DB is connected first
//     const result = await User.deleteMany({ email: null });
//     console.log(`Deleted ${result.deletedCount} users with null email.`);
//   } catch (err) {
//     console.error("❌ Error deleting users:", err);
//   } finally {
//     mongoose.connection.close();
//   }
// };

// // 3️⃣ Run the deletion script
// deleteNullEmails();

export default connectDB;
