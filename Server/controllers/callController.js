// controllers/callController.js
import Call from "../models/Call.js";
import SkillSwap from "../models/SkillSwap.js";
import User from "../models/User.js";

// ✅ Call start karo (record create)
export const startCall = async (req, res) => {
  try {
    const { swapId, callerId, receiverId } = req.body;

    if (!swapId || !callerId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "swapId, callerId ane receiverId compulsory che",
      });
    }

    // Swap exist che ke nai e basic check
    const swap = await SkillSwap.findById(swapId);
    if (!swap) {
      return res.status(404).json({
        success: false,
        message: "SkillSwap not found",
      });
    }

    // Optionally: jo swap already completed hoy to call allow nai karvi
    if (swap.Status && swap.Status.toLowerCase() === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed swap par navi call start nai kari shakai",
      });
    }

    const call = await Call.create({
      swapId,
      callerId,
      receiverId,
      status: "ongoing",
      startedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Call started",
      call,
    });
  } catch (err) {
    console.error("❌ startCall error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while starting call" });
  }
};

// ✅ Call end karo (duration calculate)
export const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status } = req.body; // optional: "completed" / "missed" / "cancelled"

    const call = await Call.findById(callId);
    if (!call) {
      return res
        .status(404)
        .json({ success: false, message: "Call not found" });
    }

    const now = new Date();
    call.endedAt = now;

    // agar startedAt hoy to duration calculate karo
    if (call.startedAt) {
      const diffMs = now.getTime() - call.startedAt.getTime();
      call.durationSeconds = Math.floor(diffMs / 1000);
    }

    if (status) {
      call.status = status; // frontend thi "completed" / "missed" etc mokli sakay
    } else if (call.status === "ongoing") {
      call.status = "completed";
    }

    await call.save();

    return res.json({
      success: true,
      message: "Call ended",
      call,
    });
  } catch (err) {
    console.error("❌ endCall error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while ending call" });
  }
};

// ✅ Particular swap ni call history (swap details page)
export const getCallsBySwap = async (req, res) => {
  try {
    const { swapId } = req.params;

    const calls = await Call.find({ swapId })
      .populate({ path: "callerId", select: "Username Email" })
      .populate({ path: "receiverId", select: "Username Email" })
      .sort({ createdAt: -1 }); // latest first

    return res.json({
      success: true,
      calls,
    });
  } catch (err) {
    console.error("❌ getCallsBySwap error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching calls by swap",
    });
  }
};

// ✅ Particular user ni total call history
export const getCallsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
      .populate({ path: "callerId", select: "Username Email" })
      .populate({ path: "receiverId", select: "Username Email" })
      .populate({
        path: "swapId",
        populate: {
          path: "RequestId",
          populate: [
            { path: "SenderId", select: "Username Email" },
            { path: "ReceiverId", select: "Username Email" },
          ],
        },
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      calls,
    });
  } catch (err) {
    console.error("❌ getCallsByUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching calls by user",
    });
  }
};
