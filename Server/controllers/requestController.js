// Server/controllers/requestController.js
import mongoose from "mongoose";
import Request from "../models/Request.js";
import UserSkill from "../models/UserSkill.js";
import Skill from "../models/Skill.js";
import User from "../models/User.js";
import SkillSwap from "../models/SkillSwap.js";
import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";
import Category from "../models/SkillCategory.js";


/*
  SEND REQUEST (small change: check receiver active subscription & swaps)
*/
export const sendRequest = async (req, res) => {
  try {
    const { SenderId, ReceiverId, SkillToLearnId } = req.body;

    if (!SenderId || !ReceiverId || !SkillToLearnId)
      return res.status(400).json({ success: false, message: "Missing required fields." });

    const [senderUser, receiverUser] = await Promise.all([
      User.findById(SenderId).lean(),
      User.findById(ReceiverId).lean(),
    ]);

    if (!receiverUser)
      return res.status(404).json({ success: false, message: "Selected member not found." });

    if (receiverUser.isSuspended || receiverUser.Status === "Inactive")
      return res.status(400).json({ success: false, message: "This member is not available for swaps." });

    if (senderUser?.isSuspended || senderUser?.Status === "Inactive")
      return res.status(400).json({ success: false, message: "Your account is not allowed to send requests." });

    // Check active plan for both users
    const [senderSub, receiverSub] = await Promise.all([
      Subscription.findOne({ UserId: SenderId, Status: "Active", SwapsRemaining: { $gt: 0 } }),
      Subscription.findOne({ UserId: ReceiverId, Status: "Active", SwapsRemaining: { $gt: 0 } }),
    ]);

    if (!senderSub)
      return res.status(400).json({ success: false, message: "You have no active plan with swaps remaining. Please purchase a plan." });

    if (!receiverSub)
      return res.status(400).json({ success: false, message: "Receiver does not have an active plan with swaps remaining." });

    const userSkillToLearn = await UserSkill.findById(SkillToLearnId).lean();
    if (!userSkillToLearn)
      return res.status(404).json({ success: false, message: "Skill not found." });

    const learnSkill = await Skill.findOne({ SkillId: userSkillToLearn.SkillId }).lean();
    const learningSkillId = learnSkill?.SkillId;

    // Load all swaps safely
    const swaps = await SkillSwap.find({})
      .populate({
        path: "RequestId",
        select: "SenderId ReceiverId SkillToLearnId SkillToTeachId",
      })
      .lean();

   let duplicateFound = false;

for (const swap of swaps) {
  const reqData = swap?.RequestId;
  if (!reqData) continue;

  // -------------------------
  // LOAD LEARN SKILL (SAFE)
  // -------------------------
  let learnSkillIdExisting = null;

  if (
    reqData.SkillToLearnId &&
    mongoose.Types.ObjectId.isValid(reqData.SkillToLearnId)
  ) {
    const learnDoc = await UserSkill.findById(reqData.SkillToLearnId).lean();
    if (learnDoc) {
      const learnSkill = await Skill.findOne({ SkillId: learnDoc.SkillId }).lean();
      learnSkillIdExisting = learnSkill?.SkillId || null;
    }
  }

  // -------------------------
  // LOAD TEACH SKILL (SAFE)
  // -------------------------
  let teachSkillIdExisting = null;

  if (
    reqData.SkillToTeachId &&
    mongoose.Types.ObjectId.isValid(reqData.SkillToTeachId)
  ) {
    const teachDoc = await UserSkill.findById(reqData.SkillToTeachId).lean();
    if (teachDoc) {
      const teachSkill = await Skill.findOne({ SkillId: teachDoc.SkillId }).lean();
      teachSkillIdExisting = teachSkill?.SkillId || null;
    }
  }

  // -------------------------
  // DUPLICATE CHECK LOGIC
  // -------------------------
  const sameDirection =
    String(reqData.SenderId) === String(SenderId) &&
    String(reqData.ReceiverId) === String(ReceiverId) &&
    (learnSkillIdExisting === learningSkillId ||
     teachSkillIdExisting === learningSkillId);

  const reverseDirection =
    String(reqData.SenderId) === String(ReceiverId) &&
    String(reqData.ReceiverId) === String(SenderId) &&
    (learnSkillIdExisting === learningSkillId ||
     teachSkillIdExisting === learningSkillId);

  if (sameDirection || reverseDirection) {
    duplicateFound = true;
    break;
  }
}


    // If duplicate, return custom message
    if (duplicateFound)
      return res.status(400).json({
        success: false,
        message: "A swap between you and this user for this skill already exists.",
      });

    // Prevent duplicate pending requests
    const existingPending = await Request.findOne({
      $or: [
        { SenderId, ReceiverId, SkillToLearnId, Status: "Pending" },
        { SenderId: ReceiverId, ReceiverId: SenderId, SkillToLearnId, Status: "Pending" },
      ],
    });

    if (existingPending)
      return res.status(400).json({
        success: false,
        message: "A pending request already exists between you and this user for this skill.",
      });

    // CREATE request
    const newReq = await Request.create({
      SenderId,
      ReceiverId,
      SkillToLearnId,
      Status: "Pending",
    });

    await Notification.create({
      userId: ReceiverId,
      message: `${senderUser.Username} sent you a new skill swap request.`,
      type: "request_sent",
      link: `/dashboard?tab=requestinfo&view=received`,
    });

    return res.status(201).json({
      success: true,
      message: "Request sent successfully!",
      request: newReq,
    });

  } catch (err) {
    console.error("Error sending request:", err);
     console.error("🔥🔥 FULL SEND REQUEST ERROR ↓↓↓");
  console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error while sending request.",
      error: err.message,
    });
  }
};




/*
  CONFIRM SWAP — final fixed version:
  - Requires Request.Status === "Accepted"
  - Ensures both participants have Active plan with SwapsRemaining > 0
  - Deducts 1 from both, expires plan if SwapsRemaining reaches 0, promotes earliest Upcoming plan
  - Creates SkillSwap and notifications
*/
export const confirmSwap = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid requestId" });
    }

    const request = await Request.findById(requestId)
      .populate("SenderId", "_id Username")
      .populate("ReceiverId", "_id Username");

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.Status !== "Accepted") {
      return res.status(400).json({ success: false, message: "Request must be accepted before confirming." });
    }

    const senderId = request.SenderId._id;
    const receiverId = request.ReceiverId._id;

    // Fetch ACTIVE subscription with swaps remaining
    const senderSub = await Subscription.findOne({
      UserId: senderId,
      Status: "Active",
      SwapsRemaining: { $gt: 0 }
    });

    const receiverSub = await Subscription.findOne({
      UserId: receiverId,
      Status: "Active",
      SwapsRemaining: { $gt: 0 }
    });

    if (!senderSub || !receiverSub) {
      return res.status(400).json({ success: false, message: "Both users must have an active plan with available swaps." });
    }

    // Deduct swap from both users
    senderSub.SwapsRemaining = Math.max(0, senderSub.SwapsRemaining - 1);
    receiverSub.SwapsRemaining = Math.max(0, receiverSub.SwapsRemaining - 1);

    await senderSub.save();
    await receiverSub.save();

    /*
      ------------------------------------------------------
      EXPIRES plan when swapRemaining = 0
      And activates next upcoming plan
      ------------------------------------------------------
    */
    const expireAndPromote = async (sub) => {
      if (sub.SwapsRemaining === 0) {
        sub.Status = "Expired";
        await sub.save();

        const nextUpcoming = await Subscription.findOne({
          UserId: sub.UserId,
          Status: "Upcoming"
        }).sort({ StartDate: 1 });

        if (nextUpcoming) {
          nextUpcoming.Status = "Active";
          nextUpcoming.StartDate = new Date();
          await nextUpcoming.save();

          await Notification.create({
            userId: sub.UserId,
            message: `Your upcoming subscription has been activated.`,
            type: "subscription_promoted",
            link: "/dashboard?tab=purchase",
          });
        } else {
          await Notification.create({
            userId: sub.UserId,
            message: "You have used all your swap credits. Please purchase a plan to continue swapping.",
            type: "swap_limit_reached",
            link: "/dashboard?tab=purchase",
          });
        }
      }
    };

    // Expire/promote logic for both
    await Promise.all([
      expireAndPromote(senderSub),
      expireAndPromote(receiverSub)
    ]);

    // Create Skill Swap session
    const skillSwap = await SkillSwap.create({
      RequestId: request._id,
      Status: "Active",
      Confirmations: {
        SenderConfirmed: false,
        ReceiverConfirmed: false,
      },
    });

    const notifyMessage = `${request.SenderId.Username} and ${request.ReceiverId.Username} have started a Skill Swap session.`;

    // Notify sender
    await Notification.create({
      userId: senderId,
      message: notifyMessage,
      type: "swap_started",
      link: "/dashboard?tab=swapactivity",
    });

    // Notify receiver
    await Notification.create({
      userId: receiverId,
      message: notifyMessage,
      type: "swap_started",
      link: "/dashboard?tab=swapactivity",
    });

    return res.json({
      success: true,
      message: "Swap confirmed successfully.",
      skillSwap,
    });

  } catch (err) {
    console.error("Confirm Swap Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
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




export const getAllMembersWithSkills = async (req, res) => {
  try {
    // 1️⃣ Fetch all users (except admin)
    const users = await User.find({
      Role: { $ne: "Admin" },
      $or: [
        { isSuspended: { $ne: true } },
        { isSuspended: { $exists: false } },
      ],
      Status: { $ne: "Inactive" },
    })
      .populate("City", "cityName")         // ⭐ Populate cityName
      .lean();

    const userIds = users.map((u) => u._id);

    // 2️⃣ Fetch all user-skills for these users
    const allUserSkills = await UserSkill.find({
      UserId: { $in: userIds },
      SkillAvailability: "Available",
    }).lean();

    const skillIds = allUserSkills.map((s) => s.SkillId);

    // 3️⃣ Fetch skills only once
    const allSkills = await Skill.find({ SkillId: { $in: skillIds } }).lean();

    // Map SkillId → Skill Object
    const skillMap = {};
    allSkills.forEach((s) => {
      skillMap[s.SkillId] = s;
    });

    // 4️⃣ Fetch subscriptions only once
    const subscriptions = await Subscription.find({
      UserId: { $in: userIds },
    }).lean();

    const subMap = {};
    subscriptions.forEach((s) => {
      subMap[s.UserId] = s;
    });

    // 5️⃣ Merge everything
    const finalMembers = users.map((user) => {
      const skills = allUserSkills
        .filter((s) => String(s.UserId) === String(user._id))
        .map((s) => ({
          ...s,
          Skill: skillMap[s.SkillId] || null, // attach full skill
        }));

      return {
        ...user,
        Skills: skills,
        SwapsRemaining: subMap[user._id]?.SwapsRemaining ?? 0,
      };
    });

    res.json({ success: true, members: finalMembers });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ GET ALL CATEGORIES


// ===============================
// GET ALL CATEGORIES + THEIR SKILLS
// ===============================


export const getAllCategoriesWithSkills = async (req, res) => {
  try {
    // 1️⃣ Get all categories
    const categories = await Category.find({ status: "Active" })
      .sort({ CategoryName: 1 })
      .lean();

    // 2️⃣ For each category, load its skills
    const finalData = await Promise.all(
      categories.map(async (cat) => {
        const skills = await Skill.find({
          CategoryId: cat.CategoryId,
          Status: "Active",
        })
          .sort({ Name: 1 })
          .lean();

        return {
          ...cat,
          Skills: skills, // Add skills under this category
        };
      })
    );

    return res.json({
      success: true,
      categories: finalData,
    });
  } catch (err) {
    console.error("Error fetching categories with skills:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching categories & skills",
    });
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
