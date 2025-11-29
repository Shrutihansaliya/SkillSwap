// controllers/skillSwapController.js
import SkillSwap from "../models/SkillSwap.js";
import Request from "../models/Request.js";
import User from "../models/User.js";
import UserSkill from "../models/UserSkill.js";
import Skill from "../models/Skill.js"
import Notification from "../models/Notification.js";
;

// export const getSwapsByUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Find swaps where this user is either sender or receiver
//     const swaps = await SkillSwap.find()
//       .populate({
//         path: "RequestId",
//         populate: [
//           { path: "SenderId", select: "Username Email" },
//           { path: "ReceiverId", select: "Username Email" },
//           { path: "SkillToLearnId" },
//           { path: "SkillToTeachId" },
//         ],
//       })
//       .lean();

//     // Filter swaps for this user only
//     const userSwaps = swaps.filter(
//       (s) =>
//         s.RequestId?.SenderId?._id?.toString() === userId ||
//         s.RequestId?.ReceiverId?._id?.toString() === userId
//     );

//     // Build display-ready data
//     const formattedSwaps = await Promise.all(
//       userSwaps.map(async (swap) => {
//         const learnSkill =
//           swap.RequestId?.SkillToLearnId &&
//           (await Skill.findOne({ SkillId: swap.RequestId.SkillToLearnId.SkillId }).lean());
//         const teachSkill =
//           swap.RequestId?.SkillToTeachId &&
//           (await Skill.findOne({ SkillId: swap.RequestId.SkillToTeachId.SkillId }).lean());

//         return {
//           _id: swap._id,
//           Status: swap.Status,
//           CreatedAt: swap.CreatedAt,
//           Sender: swap.RequestId?.SenderId,
//           Receiver: swap.RequestId?.ReceiverId,
//           SkillToLearn: learnSkill,
//           SkillToTeach: teachSkill,
//         };
//       })
//     );

//     res.json({ success: true, swaps: formattedSwaps });
//   } catch (err) {
//     console.error("❌ Error fetching swaps:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
// ✅ Mark swap as completed only after both users confirm
export const getSwapsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🟢 Fetching swaps for user:", userId);

    // 1️⃣ Fetch all swaps (with populated details)
    const swaps = await SkillSwap.find()
      .populate({
        path: "RequestId",
        populate: [
          { path: "SenderId", select: "Username Email" },
          { path: "ReceiverId", select: "Username Email" },
          { path: "SkillToLearnId" },
          { path: "SkillToTeachId" },
        ],
      })
      .lean();

    // 2️⃣ Filter only swaps where the user is involved (sender or receiver)
    const userSwaps = swaps.filter(
      (s) =>
        s.RequestId?.SenderId?._id?.toString() === userId ||
        s.RequestId?.ReceiverId?._id?.toString() === userId
    );

    // 3️⃣ Further filter — keep only active swaps
    const activeSwaps = userSwaps.filter((s) => {
      const c = s.Confirmations || {};
      const bothConfirmed = c.SenderConfirmed && c.ReceiverConfirmed;
      return s.Status === "Active" && !bothConfirmed; // ✅ Only active + not both confirmed
    });

    // 4️⃣ Build display-ready data
    const formattedSwaps = await Promise.all(
      activeSwaps.map(async (swap) => {
        const learnSkill =
          swap.RequestId?.SkillToLearnId &&
          (await Skill.findOne({ SkillId: swap.RequestId.SkillToLearnId.SkillId }).lean());
        const teachSkill =
          swap.RequestId?.SkillToTeachId &&
          (await Skill.findOne({ SkillId: swap.RequestId.SkillToTeachId.SkillId }).lean());

        return {
          _id: swap._id,
          Status: swap.Status,
          CreatedAt: swap.CreatedAt,
          Sender: swap.RequestId?.SenderId,
          Receiver: swap.RequestId?.ReceiverId,
          Confirmations: swap.Confirmations,
          SkillToLearn: learnSkill,
          SkillToTeach: teachSkill,
        };
      })
    );

    console.log(`✅ Found ${formattedSwaps.length} active swaps for user ${userId}`);
    res.json({ success: true, swaps: formattedSwaps });
  } catch (err) {
    console.error("❌ Error fetching swaps:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// export const confirmCompletion = async (req, res) => {
//   try {
//     const { swapId } = req.params;
//     const { userId } = req.body;

//     console.log("🟢 Incoming Confirm Request ----------------------------");
//     console.log("Swap ID:", swapId);
//     console.log("User ID from frontend:", userId);

//     // ✅ Fetch the swap and populate nested Request details
//     const swap = await SkillSwap.findById(swapId).populate({
//       path: "RequestId",
//       populate: [
//         { path: "SenderId", select: "Username Email" },
//         { path: "ReceiverId", select: "Username Email" },
//       ],
//     });

//     if (!swap) {
//       console.log("❌ Swap not found for ID:", swapId);
//       return res.status(404).json({ success: false, message: "Swap not found" });
//     }

//     // ✅ Extract and normalize IDs
//     const senderId = swap.RequestId?.SenderId?._id?.toString();
//     const receiverId = swap.RequestId?.ReceiverId?._id?.toString();
//     const currentId = userId?.toString();

//     console.log("📦 Populated Swap Request Details:");
//     console.log("Sender:", swap.RequestId?.SenderId);
//     console.log("Receiver:", swap.RequestId?.ReceiverId);
//     console.log("Normalized IDs:");
//     console.log("→ SenderId:", senderId);
//     console.log("→ ReceiverId:", receiverId);
//     console.log("→ CurrentUserId:", currentId);

//     if (!senderId || !receiverId) {
//       console.log("⚠️ Missing SenderId or ReceiverId in swap.RequestId");
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid swap data (missing sender/receiver)" });
//     }

//     if (!swap.Confirmations) swap.Confirmations = {};

//     // ✅ Compare cleanly
//     if (currentId === senderId) {
//       console.log("✅ Match found: Current user is the SENDER");
//       swap.Confirmations.SenderConfirmed = true;
//     } else if (currentId === receiverId) {
//       console.log("✅ Match found: Current user is the RECEIVER");
//       swap.Confirmations.ReceiverConfirmed = true;
//     } else {
//       console.log("🚫 User not part of this swap:");
//       console.log({
//         currentId,
//         senderId,
//         receiverId,
//         swapId,
//       });
//       return res
//         .status(403)
//         .json({ success: false, message: "User not part of this swap" });
//     }

//     // ✅ Check if both confirmed
//     if (swap.Confirmations.SenderConfirmed && swap.Confirmations.ReceiverConfirmed) {
//       swap.Status = "Completed";
//       swap.CompletedAt = new Date();
//       console.log("🎉 Both users confirmed → Marking swap as Completed");
//     } else {
//       console.log("⌛ Only one user confirmed so far → Waiting for partner");
//     }

//     await swap.save();

//     console.log("💾 Swap saved successfully with status:", swap.Status);
//     console.log("Current Confirmations:", swap.Confirmations);
//     console.log("---------------------------------------------------------");

//     const msg =
//       swap.Status === "Completed"
//         ? "🎉 Both users confirmed. Swap marked as completed!"
//         : "👍 Your confirmation is saved. Waiting for your partner to confirm.";

//     res.json({ success: true, message: msg, swap });
//   } catch (err) {
//     console.error("❌ Confirm Completion Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
// ✅ Get Completed Swaps (Activity History)
export const confirmCompletion = async (req, res) => {
  try {
    const { swapId } = req.params;
    const { userId } = req.body;

    const swap = await SkillSwap.findById(swapId).populate({
      path: "RequestId",
      populate: [
        { path: "SenderId", select: "Username Email" },
        { path: "ReceiverId", select: "Username Email" },
      ],
    });

    if (!swap) {
      return res.status(404).json({ success: false, message: "Swap not found" });
    }

    const senderId = swap.RequestId?.SenderId?._id?.toString();
    const receiverId = swap.RequestId?.ReceiverId?._id?.toString();
    const currentId = userId?.toString();

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid swap data (missing sender/receiver)" });
    }

    if (!swap.Confirmations) swap.Confirmations = {};

    let currentUser, otherUser;

    if (currentId === senderId) {
      swap.Confirmations.SenderConfirmed = true;
      currentUser = swap.RequestId.SenderId;
      otherUser = swap.RequestId.ReceiverId;
    } else if (currentId === receiverId) {
      swap.Confirmations.ReceiverConfirmed = true;
      currentUser = swap.RequestId.ReceiverId;
      otherUser = swap.RequestId.SenderId;
    } else {
      return res
        .status(403)
        .json({ success: false, message: "User not part of this swap" });
    }

    // ------------------------------------------------------------------
    // ⭐ NOTIFICATION LOGIC
    // ------------------------------------------------------------------

    // Case 1 — Only ONE has confirmed
    if (
      (swap.Confirmations.SenderConfirmed && !swap.Confirmations.ReceiverConfirmed) ||
      (!swap.Confirmations.SenderConfirmed && swap.Confirmations.ReceiverConfirmed)
    ) {
      const message = `${currentUser.Username} has confirmed the swap. Please confirm to complete the swap.`;

      await Notification.create({
        userId: otherUser._id,
        message,
        type: "request_confirmed",
        link: "/dashboard?tab=swapactivity",
      });

      console.log("📩 Notification sent to partner: waiting for other user.");
    }

    // Case 2 — BOTH confirmed
    if (swap.Confirmations.SenderConfirmed && swap.Confirmations.ReceiverConfirmed) {
      swap.Status = "Completed";
      swap.CompletedAt = new Date();

      const completeMsg = `🎉 Both participants have confirmed. Your Skill Swap is successfully completed!`;

      // Notify both users
      await Notification.create({
        userId: senderId,
        message: completeMsg,
        type: "request_confirmed",
        link: "/dashboard?tab=activityhistory",

      });

      await Notification.create({
        userId: receiverId,
        message: completeMsg,
        type: "request_confirmed",
       link: "/dashboard?tab=activityhistory",

      });

      console.log("📩 Notifications sent to BOTH users — Swap Completed.");
    }

    // Save changes
    await swap.save();

    const msg =
      swap.Status === "Completed"
        ? "🎉 Both users confirmed. Swap marked as completed!"
        : "👍 Your confirmation is saved. Waiting for your partner to confirm.";

    res.json({ success: true, message: msg, swap });

  } catch (err) {
    console.error("❌ Confirm Completion Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ✅ Get Completed Swaps (Activity History)
export const getCompletedSwapsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("📜 Fetching completed swaps for user:", userId);

    // Fetch all swaps with related data
    const swaps = await SkillSwap.find()
      .populate({
        path: "RequestId",
        populate: [
          { path: "SenderId", select: "Username Email" },
          { path: "ReceiverId", select: "Username Email" },
          { path: "SkillToLearnId" },
          { path: "SkillToTeachId" },
        ],
      })
      .lean();

    // Filter swaps involving this user
    const userSwaps = swaps.filter(
      (s) =>
        s?.RequestId?.SenderId?._id?.toString() === userId ||
        s?.RequestId?.ReceiverId?._id?.toString() === userId
    );

    // ✅ Improved completion logic
    const completedSwaps = userSwaps.filter((s) => {
      const c = s.Confirmations || {};
      const senderConfirmed = !!c.SenderConfirmed;
      const receiverConfirmed = !!c.ReceiverConfirmed;
      const bothConfirmed = senderConfirmed && receiverConfirmed;

      return (
        s.Status?.toLowerCase() === "completed" || bothConfirmed
      );
    });

    console.log(
      `🧩 Found ${completedSwaps.length} completed swaps for user ${userId}`
    );

    // Build formatted result
    const formattedSwaps = await Promise.all(
      completedSwaps.map(async (swap) => {
        const learnSkill =
          swap.RequestId?.SkillToLearnId &&
          (await Skill.findOne({
            SkillId: swap.RequestId.SkillToLearnId.SkillId,
          }).lean());
        const teachSkill =
          swap.RequestId?.SkillToTeachId &&
          (await Skill.findOne({
            SkillId: swap.RequestId.SkillToTeachId.SkillId,
          }).lean());

        return {
          _id: swap._id,
          Status: swap.Status || "Completed",
          CreatedAt: swap.CreatedAt,
          CompletedAt: swap.CompletedAt || swap.UpdatedAt || null,
          Sender: swap.RequestId?.SenderId,
          Receiver: swap.RequestId?.ReceiverId,
          Confirmations: swap.Confirmations,
          SkillToLearn: learnSkill,
          SkillToTeach: teachSkill,
        };
      })
    );

    return res.json({
      success: true,
      swaps: formattedSwaps,
    });
  } catch (err) {
    console.error("❌ Error fetching completed swaps:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching completed swaps" });
  }
};
