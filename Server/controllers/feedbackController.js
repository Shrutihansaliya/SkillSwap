import Feedback from "../models/Feedback.js";
import Notification from "../models/Notification.js";
import SkillSwap from "../models/SkillSwap.js"; // optional validation
import User from "../models/User.js"; // To get sender username for notification

// Create a feedback and send notification to partner
export const createFeedback = async (req, res) => {
  try {
    const { SwapId, SenderId, ReceiverId, Rating, Comments } = req.body;

    // Validate required fields
    if (!SwapId || !SenderId || !ReceiverId || !Rating)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    // Validate rating
    if (!(Number.isInteger(Rating) || typeof Rating === "number") || Rating < 1 || Rating > 5)
      return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5" });

    // Save feedback
    const feedback = await Feedback.create({
      SwapId,
      SenderId,
      ReceiverId,
      Rating: Math.round(Rating),
      Comments: Comments || "",
    });

    // Get sender's username for notification
    const sender = await User.findById(SenderId).lean();
    const senderName = sender?.Username || "Your partner";

    // Create notification for receiver with correct link
    await Notification.create({
      userId: ReceiverId,
      message: `You received a new feedback from ${senderName}`,
      type: "feedback_given",
      link: "/dashboard?tab=activityhistory",
    });

    return res.status(201).json({
      success: true,
      feedback,
      message: "Feedback saved and notification sent",
    });
  } catch (err) {
    console.error("createFeedback error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// List feedbacks by swap
export const getFeedbacksBySwap = async (req, res) => {
  try {
    const { swapId } = req.params;
    if (!swapId) return res.status(400).json({ success: false, message: "Missing swapId" });

    const feedbacks = await Feedback.find({ SwapId: swapId })
      .sort({ Date: -1 })
      .populate("SenderId", "Username _id")
      .populate("ReceiverId", "Username _id")
      .lean();

    return res.json({ success: true, feedbacks });
  } catch (err) {
    console.error("getFeedbacksBySwap error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get feedbacks received by a user
export const getFeedbacksForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const feedbacks = await Feedback.find({ ReceiverId: userId })
      .sort({ Date: -1 })
      .populate("SenderId", "Username _id")
      .populate("SwapId")
      .lean();

    return res.json({ success: true, feedbacks });
  } catch (err) {
    console.error("getFeedbacksForUser error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { Rating, Comments } = req.body;

    const fb = await Feedback.findById(id);
    if (!fb) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    fb.Rating = Rating;
    fb.Comments = Comments;
    await fb.save();

    return res.json({
      success: true,
      feedback: fb,
      message: "Feedback updated successfully",
    });
  } catch (err) {
    console.error("❌ Update feedback error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

