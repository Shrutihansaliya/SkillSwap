// backend/controllers/chatController.js
import Chat from "../models/Chat.js";

/**
 * GET /api/chat/:swapId?userId=<currentUserId>
 * - returns messages (populated)
 * - marks messages Delivered for the receiver (if they were Sent)
 */
export const getChatMessages = async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.query.userId;

    // Mark sent -> delivered for messages where current user is the receiver
    if (userId) {
      await Chat.updateMany(
        { SwapId: swapId, ReceiverId: userId, Status: "Sent" },
        { $set: { Status: "Delivered" } }
      );
    }

    const messages = await Chat.find({ SwapId: swapId })
      .populate("SenderId", "Username Email")
      .populate("ReceiverId", "Username Email")
      .sort({ SentAt: 1 })
      .lean();

    // Normalize populated fields to 'Sender'/'Receiver' for frontend convenience
    const normalized = messages.map((m) => ({
      ...m,
      Sender: m.SenderId ? { _id: m.SenderId._id, Username: m.SenderId.Username } : null,
      Receiver: m.ReceiverId
        ? { _id: m.ReceiverId._id, Username: m.ReceiverId.Username }
        : null,
    }));

    res.json({ success: true, messages: normalized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /api/chat
 * body: { swapId, senderId, receiverId, message }
 * creates new Chat document with Status: "Sent"
 */
export const sendMessage = async (req, res) => {
  try {
    const { swapId, senderId, receiverId, message } = req.body;

    const newMessage = await Chat.create({
      SwapId: swapId,
      SenderId: senderId,
      ReceiverId: receiverId,
      Message: message,
      Status: "Sent",
    });

    const populatedMessage = await Chat.findById(newMessage._id)
      .populate("SenderId", "Username Email")
      .populate("ReceiverId", "Username Email")
      .lean();

    const normalized = {
      ...populatedMessage,
      Sender: populatedMessage.SenderId
        ? { _id: populatedMessage.SenderId._id, Username: populatedMessage.SenderId.Username }
        : null,
      Receiver: populatedMessage.ReceiverId
        ? { _id: populatedMessage.ReceiverId._id, Username: populatedMessage.ReceiverId.Username }
        : null,
    };

    res.json({ success: true, message: normalized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PUT /api/chat/read
 * body: { swapId, userId }  -> mark messages as Read for receiver userId
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { swapId, userId } = req.body;
    await Chat.updateMany(
      { SwapId: swapId, ReceiverId: userId, Status: { $ne: "Read" } },
      { $set: { Status: "Read" } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
