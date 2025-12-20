// backend/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectDB from "./config/mongodb.js";
import path from "path";
import { fileURLToPath } from "url";

// 🔹 NEW: HTTP + Socket.io for realtime (video call signaling)
import http from "http";
import { Server as SocketIOServer } from "socket.io";

// routes
import userRoutes from "./routes/userRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import skillCategoryRoutes from "./routes/skillCategoryRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import subscriptionPlanRoutes from "./routes/subscriptionPlanRoutes.js";
import purchaseSubscriptionRoutes from "./routes/purchaseSubscriptionRoutes.js";
import skillSwapRoutes from "./routes/skillSwapRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import mySkillRoutes from "./routes/mySkillRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import overviewRoutes from "./routes/overviewRoutes.js";
import verifyCertificateRoutes from "./routes/verifyCertificateRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminSwapRoutes from "./routes/adminSwapRoutes.js";
// 🔹 NEW: Call routes (video call history)
import callRoutes from "./routes/callRoutes.js";
import skillRequestRoutes from "./routes/skillRequestRoutes.js";
// report controllers + middlewares (inlined route below)
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
} from "./controllers/reportController.js";
import userAuth from "./middleware/userAuth.js";
import adminAuth from "./middleware/adminAuth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// --- Connect DB
connectDB();

// --- Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// CORS: use env OR default localhost:5173
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Session (ensure SESSION_SECRET set in .env)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 15 * 60 * 1000 }, // 15 minutes
  })
);

// Serve uploads & public assets (single place)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/uploads/materials",
  express.static(path.join(__dirname, "uploads", "materials"))
);
app.use("/icons", express.static("icons"));

// ------------------------
// Route registrations
// ------------------------
app.use("/api/users", userRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/categories", skillCategoryRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/swaps", adminSwapRoutes);
app.use("/api/city", cityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/subscription-plans", subscriptionPlanRoutes);
app.use("/api/purchase-subscription", purchaseSubscriptionRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/swaps", skillSwapRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/myskills", mySkillRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/verify-certificate", verifyCertificateRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/skill-requests", skillRequestRoutes);
// 🔹 NEW: Call routes (video call history APIs)
app.use("/api/calls", callRoutes);

// ------------------------
// REPORT ROUTES (mounted here)
// ------------------------
import { Router } from "express";
const reportsRouter = Router();

// create report (logged-in users)
reportsRouter.post("/", userAuth, createReport);

// admin-only endpoints
reportsRouter.get("/", userAuth, adminAuth, getReports);
reportsRouter.get("/:id", userAuth, adminAuth, getReportById);
reportsRouter.put("/:id", userAuth, adminAuth, updateReportStatus);
reportsRouter.delete("/:id", userAuth, adminAuth, deleteReport);

app.use("/api/reports", reportsRouter);

// ------------------------
// Health check
// ------------------------
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "API is running 🚀" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global unhandled rejection / exception logging (helpful during dev)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// ------------------------
// 🔹 Socket.io setup (Video call signaling)
// ------------------------
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // User joins a room (roomId = swapId)
  socket.on("join-room", ({ roomId, userId }) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log(`👥 User ${userId} joined room ${roomId}`);

    // inform others in room that new user joined
    socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
  });

  // WebRTC offer
  socket.on("offer", ({ roomId, offer }) => {
    if (!roomId || !offer) return;
    socket.to(roomId).emit("offer", { offer });
  });

  // WebRTC answer
  socket.on("answer", ({ roomId, answer }) => {
    if (!roomId || !answer) return;
    socket.to(roomId).emit("answer", { answer });
  });

  // ICE candidates
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    if (!roomId || !candidate) return;
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  // Leave room manually
  socket.on("leave-room", ({ roomId, userId }) => {
    if (roomId) {
      socket.leave(roomId);
      socket.to(roomId).emit("user-left", { userId, socketId: socket.id });
      console.log(`👋 User ${userId} left room ${roomId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// Start server (NOTE: use server.listen, not app.listen)
server.listen(port, () => console.log(`🚀 Server running on PORT: ${port}`));
