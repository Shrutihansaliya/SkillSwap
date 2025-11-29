// Server/controllers/requestController.js
import mongoose from "mongoose";
import Request from "../models/Request.js";
import UserSkill from "../models/UserSkill.js";
import Skill from "../models/Skill.js";
import User from "../models/User.js";
import SkillSwap from "../models/SkillSwap.js";
import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";

// ✅ SEND REQUEST
export const sendRequest = async (req, res) => {
  try {
    const { SenderId, ReceiverId, SkillToLearnId } = req.body;

    console.log("🟢 Incoming Request:", { SenderId, ReceiverId, SkillToLearnId });

    if (!SenderId || !ReceiverId || !SkillToLearnId)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });

    // 1️⃣ Fetch sender & receiver
    const [senderUser, receiverUser] = await Promise.all([
      User.findById(SenderId).lean(),
      User.findById(ReceiverId).lean(),
    ]);

    const senderName = senderUser?.Username || "Unknown";
    const receiverName = receiverUser?.Username || "Unknown";

    // 🚫 Block if receiver is suspended / inactive
    if (!receiverUser) {
      return res
        .status(404)
        .json({ success: false, message: "Selected member not found." });
    }

    if (receiverUser.isSuspended || receiverUser.Status === "Inactive") {
      return res.status(400).json({
        success: false,
        message:
          "You cannot start a skill swap with this member because their account is currently suspended or inactive.",
      });
    }

    // (Optional safety) – block if sender himself is suspended
    if (senderUser?.isSuspended || senderUser?.Status === "Inactive") {
      return res.status(400).json({
        success: false,
        message:
          "Your account is currently suspended or inactive. You cannot send new skill swap requests.",
      });
    }

    // 2️⃣ Check subscription
    const senderSub = await Subscription.findOne({ UserId: SenderId });
    if (!senderSub)
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found." });

    if (senderSub.SwapsRemaining <= 0)
      return res.status(400).json({
        success: false,
        message: "You have no swaps remaining. Please purchase a plan.",
      });

    // 3️⃣ Get learning skill (UserSkill → Skill)
    const userSkillToLearn = await UserSkill.findById(SkillToLearnId).lean();
    if (!userSkillToLearn)
      return res
        .status(404)
        .json({ success: false, message: "Skill not found." });

    const learnSkill = await Skill.findOne({
      SkillId: userSkillToLearn.SkillId,
    }).lean();
    const learningSkillId = learnSkill?.SkillId;
    const learningSkillName = learnSkill?.Name || "Unknown";

    // 4️⃣ Check existing Active/Completed swaps to avoid duplicates
    const swaps = await SkillSwap.find({
      Status: { $in: ["Active", "Completed"] },
    })
      .populate({
        path: "RequestId",
        select: "SenderId ReceiverId SkillToLearnId SkillToTeachId",
      })
      .lean();

    let duplicateFound = false;

    for (const swap of swaps) {
      const reqData = swap.RequestId;
      if (!reqData) continue;

      const [learn, teach] = await Promise.all([
        UserSkill.findById(reqData.SkillToLearnId).lean(),
        reqData.SkillToTeachId
          ? UserSkill.findById(reqData.SkillToTeachId).lean()
          : null,
      ]);

      const existingLearnSkill = learn
        ? await Skill.findOne({ SkillId: learn.SkillId }).lean()
        : null;
      const existingTeachSkill = teach
        ? await Skill.findOne({ SkillId: teach.SkillId }).lean()
        : null;

      const existingLearnSkillId = existingLearnSkill?.SkillId || null;
      const existingTeachSkillId = existingTeachSkill?.SkillId || null;

      // ✅ Same direction
      const sameDirection =
        String(reqData.SenderId) === String(SenderId) &&
        String(reqData.ReceiverId) === String(ReceiverId) &&
        (existingLearnSkillId === learningSkillId ||
          existingTeachSkillId === learningSkillId);

      // ✅ Reverse direction
      const reverseDirection =
        String(reqData.SenderId) === String(ReceiverId) &&
        String(reqData.ReceiverId) === String(SenderId) &&
        (existingLearnSkillId === learningSkillId ||
          existingTeachSkillId === learningSkillId);

      if (sameDirection || reverseDirection) {
        duplicateFound = true;
        break;
      }
    }

    if (duplicateFound) {
      return res.status(400).json({
        success: false,
        message:
          "A swap between you and this user for these skills already exists (Active or Completed).",
      });
    }

    // 5️⃣ Prevent duplicate pending requests (both directions)
    const existingPending = await Request.findOne({
      $or: [
        { SenderId, ReceiverId, SkillToLearnId, Status: "Pending" },
        {
          SenderId: ReceiverId,
          ReceiverId: SenderId,
          SkillToLearnId,
          Status: "Pending",
        },
      ],
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message:
          "A pending request already exists between you and this user for this skill.",
      });
    }

    // 6️⃣ Create new request + notification
    const newReq = new Request({
      SenderId,
      ReceiverId,
      SkillToLearnId,
      Status: "Pending",
    });
    await newReq.save();

    await Notification.create({
      userId: ReceiverId,
      message: `${senderName} sent you a new skill swap request.`,
      type: "request_sent",
      link: `/dashboard?tab=requestinfo&view=received`,
    });

    return res.status(201).json({
      success: true,
      message: "Request sent successfully!",
      request: newReq,
    });
  } catch (err) {
    console.error("❌ Error sending request:", err);
    res.status(500).json({
      success: false,
      message: "Server error while sending request.",
      error: err.message,
    });
  }
};

// ✅ CANCEL REQUEST (Pending/Accepted/Rejected)
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID." });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found." });
    }

    if (["Pending", "Accepted", "Rejected"].includes(request.Status)) {
      await Request.deleteOne({ _id: id });
      return res.status(200).json({
        success: true,
        message: `${request.Status} request deleted successfully.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: `Cannot cancel a ${request.Status} request.`,
    });
  } catch (err) {
    console.error("❌ Error cancelling request:", err);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling request.",
      error: err.message,
    });
  }
};

// ✅ CONFIRM SWAP (Request → SkillSwap + deduct swaps)
export const confirmSwap = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId)
      .populate("SenderId", "_id Username")
      .populate("ReceiverId", "_id Username");

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (request.Status !== "Accepted") {
      return res
        .status(400)
        .json({ success: false, message: "Request not accepted yet." });
    }

    const senderSub = await Subscription.findOne({
      UserId: request.SenderId._id,
    });
    const receiverSub = await Subscription.findOne({
      UserId: request.ReceiverId._id,
    });

    if (!senderSub || !receiverSub) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found." });
    }

    senderSub.SwapsRemaining = Math.max(senderSub.SwapsRemaining - 1, 0);
    receiverSub.SwapsRemaining = Math.max(receiverSub.SwapsRemaining - 1, 0);

    await senderSub.save();
    await receiverSub.save();

    const skillSwap = await SkillSwap.create({
      RequestId: request._id,
      Status: "Active",
      Confirmations: {
        SenderConfirmed: false,
        ReceiverConfirmed: false,
      },
    });

    const alertMessage =
      "⚠️ You have no remaining swap credits. Please purchase a plan to continue swapping.";

    if (senderSub.SwapsRemaining === 0) {
      await Notification.create({
        userId: request.SenderId._id,
        message: alertMessage,
        type: "swap_limit_reached",
        link: "/dashboard?tab=purchase",
      });
    }

    if (receiverSub.SwapsRemaining === 0) {
      await Notification.create({
        userId: request.ReceiverId._id,
        message: alertMessage,
        type: "swap_limit_reached",
        link: "/dashboard?tab=purchase",
      });
    }

    const senderName = request.SenderId.Username;
    const receiverName = request.ReceiverId.Username;
    const message = `${senderName} and ${receiverName} have started a Skill Swap session.`;

    await Notification.create({
      userId: request.SenderId._id,
      message,
      type: "request_confirmed",
      link: "/dashboard?tab=swapactivity",
    });

    await Notification.create({
      userId: request.ReceiverId._id,
      message,
      type: "request_confirmed",
      link: "/dashboard?tab=swapactivity",
    });

    return res.json({
      success: true,
      message: "Swap confirmed successfully.",
      skillSwap,
    });
  } catch (err) {
    console.error("❌ Error confirming swap:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error." });
  }
};

// ✅ GET ALL MEMBERS WITH AVAILABLE SKILLS
//    (🔴 Suspended / inactive users are filtered out)
export const getAllMembersWithSkills = async (req, res) => {
  try {
    const users = await User.find({
      Role: { $ne: "Admin" },
      $or: [
        { isSuspended: { $ne: true } },
        { isSuspended: { $exists: false } },
      ],
      Status: { $ne: "Inactive" },
    }).lean();

    const membersWithSkills = await Promise.all(
      users.map(async (u) => {
        const [userSkills, subscription] = await Promise.all([
          UserSkill.find({
            UserId: u._id,
            SkillAvailability: "Available",
          }).lean(),
          Subscription.findOne({ UserId: u._id }).lean(),
        ]);

        const skillsWithNames = await Promise.all(
          userSkills.map(async (us) => {
            const skill = await Skill.findOne({ SkillId: us.SkillId }).lean();
            return { ...us, Skill: skill };
          })
        );

        return {
          ...u,
          Skills: skillsWithNames,
          SwapsRemaining: subscription?.SwapsRemaining ?? 0,
        };
      })
    );

    res.json({ success: true, members: membersWithSkills });
  } catch (err) {
    console.error("Error fetching users with skills:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ SENT REQUESTS
export const getSentRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    let requests = await Request.find({
      SenderId: new mongoose.Types.ObjectId(userId),
    })
      .populate("ReceiverId", "Username Email")
      .populate("SkillToLearnId")
      .lean();

    const confirmedSwaps = await SkillSwap.find({}).select("RequestId").lean();
    const confirmedIds = confirmedSwaps.map((s) => String(s.RequestId));

    requests = requests.filter((r) => !confirmedIds.includes(String(r._id)));

    for (const req of requests) {
      if (req.SkillToLearnId?.SkillId) {
        const skill = await Skill.findOne({
          SkillId: req.SkillToLearnId.SkillId,
        });
        req.SkillToLearnId.SkillName = skill?.Name || "N/A";
      }
    }

    res.json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching sent requests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ RECEIVED REQUESTS
export const getReceivedRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    let requests = await Request.find({
      ReceiverId: new mongoose.Types.ObjectId(userId),
    })
      .populate("SenderId", "Username Email")
      .populate("SkillToLearnId")
      .lean();

    const confirmedSwaps = await SkillSwap.find({}).select("RequestId").lean();
    const confirmedIds = confirmedSwaps.map((s) => String(s.RequestId));

    requests = requests.filter((r) => !confirmedIds.includes(String(r._id)));

    for (const req of requests) {
      if (req.SkillToLearnId?.SkillId) {
        const skill = await Skill.findOne({
          SkillId: req.SkillToLearnId.SkillId,
        });
        req.SkillToLearnId.SkillName = skill?.Name || "N/A";
      }
    }

    res.json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching received requests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ UPDATE REQUEST STATUS (REJECT only – with notification)
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID" });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (status !== "Rejected") {
      return res
        .status(400)
        .json({ success: false, message: "Only Rejected status is allowed" });
    }

    request.Status = "Rejected";
    await request.save();

    const receiverUser = await User.findById(request.ReceiverId).lean();

    await Notification.create({
      userId: request.SenderId,
      message: `${receiverUser?.Username} rejected your skill swap request.`,
      type: "request_rejected",
      link: `/dashboard?tab=requestinfo&view=sent`,
    });

    return res.json({
      success: true,
      message: "Request rejected successfully.",
    });
  } catch (err) {
    console.error("❌ ERROR in updateRequestStatus:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// ✅ GET SENDER SKILLS
export const getSenderSkills = async (req, res) => {
  try {
    const { senderId } = req.params;

    const senderSkills = await UserSkill.find({ UserId: senderId }).lean();

    if (!senderSkills.length) {
      return res.status(404).json({
        success: false,
        message: "No skills found for this sender.",
      });
    }

    const skillsWithNames = await Promise.all(
      senderSkills.map(async (us) => {
        const skill = await Skill.findOne({ SkillId: us.SkillId }).lean();
        return {
          ...us,
          SkillName: skill ? skill.Name : "Unknown Skill",
        };
      })
    );

    res.json({ success: true, skills: skillsWithNames });
  } catch (err) {
    console.error("❌ Error fetching sender skills:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sender skills.",
      error: err.message,
    });
  }
};

// ✅ ACCEPT REQUEST  🔥
export const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { SkillToTeachId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID." });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found." });
    }

    if (!SkillToTeachId) {
      return res.status(400).json({
        success: false,
        message: "SkillToTeachId is required to accept.",
      });
    }

    const skill = await UserSkill.findById(SkillToTeachId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Selected teaching skill not found.",
      });
    }

    request.Status = "Accepted";
    request.SkillToTeachId = SkillToTeachId;
    await request.save();

    const receiverUser = await User.findById(request.ReceiverId).lean();

    await Notification.create({
      userId: request.SenderId,
      message: `${receiverUser?.Username} accepted your skill swap request.`,
      type: "request_accepted",
      link: `/dashboard?tab=requestinfo&view=sent`,
    });

    return res.json({
      success: true,
      message: "Request accepted successfully.",
      request,
    });
  } catch (err) {
    console.error("❌ ERROR in acceptRequest:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};
