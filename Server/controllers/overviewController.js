import mongoose from "mongoose";
import Request from "../models/Request.js";
import SkillSwap from "../models/SkillSwap.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Skill from "../models/Skill.js";
import UserSkill from "../models/UserSkill.js";

/*  
==============================================================================
⭐ FIXED ↓↓↓ — POPULATE Skill USING SkillId (number field) NOT ObjectId
==============================================================================
*/
const userSkillPopulate = {
  path: "SkillId",
  model: "Skill",
  localField: "SkillId",        // number inside UserSkill
  foreignField: "SkillId",      // number inside Skill
  select: "Name SkillId",
  options: { strictPopulate: false }
};


/*  
==============================================================================
⭐ 1. GET USER SWAPS — FULL POPULATION WORKING
==============================================================================
*/
export const getUserSwaps = async (req, res) => {
  try {
    const { userId } = req.params;

    const swaps = await SkillSwap.find()
      .populate({
        path: "RequestId",
        populate: [
          { path: "SenderId", select: "Username _id" },
          { path: "ReceiverId", select: "Username _id" },

          // ⭐ FIXED: Populate UserSkill → SkillId by number
          {
            path: "SkillToLearnId",
            model: "UserSkill",
            populate: userSkillPopulate,
          },
          {
            path: "SkillToTeachId",
            model: "UserSkill",
            populate: userSkillPopulate,
          }
        ]
      })
      .lean();

    // filter only user swaps
    const filtered = swaps.filter(
      (s) =>
        String(s?.RequestId?.SenderId?._id) === userId ||
        String(s?.RequestId?.ReceiverId?._id) === userId
    );

    // Attach readable SkillName
    filtered.forEach(s => {
      s.SkillName =
        s?.RequestId?.SkillToLearnId?.SkillId?.Name ||
        "Unknown Skill";
    });

    return res.json({ success: true, swaps: filtered });

  } catch (error) {
    console.error("Swap history API error:", error);
    return res.json({ success: false, swaps: [] });
  }
};


/*  
==============================================================================
⭐ 2. USER SWAP HISTORY — ALSO FIXED POPULATION
==============================================================================
*/
export const getUserSwapHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ success: false, swaps: [] });
    }

    const swaps = await SkillSwap.find()
      .populate({
        path: "RequestId",
        match: {
          $or: [
            { SenderId: userId },
            { ReceiverId: userId }
          ]
        },
        populate: [
          { path: "SenderId", select: "Username _id" },
          { path: "ReceiverId", select: "Username _id" },

          {
            path: "SkillToLearnId",
            model: "UserSkill",
            populate: userSkillPopulate,
          },
          {
            path: "SkillToTeachId",
            model: "UserSkill",
            populate: userSkillPopulate,
          }
        ]
      })
      .sort({ Status: 1, CreatedAt: -1 })
      .lean();

    // compute SkillName
    const filtered = swaps.filter(s => s.RequestId);
    filtered.forEach(s => {
      s.SkillName =
        s?.RequestId?.SkillToLearnId?.SkillId?.Name ||
        "Unknown Skill";
    });

    return res.json({ success: true, swaps: filtered });

  } catch (err) {
    console.log("Swap history error:", err);
    return res.json({ success: false, swaps: [] });
  }
};


/*  
==============================================================================
⭐ 3. OVERVIEW STATS (UNCHANGED)
==============================================================================
*/
export const getOverviewStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // ⭐ ALWAYS get the MOST RECENT active subscription
    const activeSub = await Subscription.findOne({
      UserId: userId,
      Status: "Active"
    })
      .sort({ StartDate: -1 })   // FIXED
      .lean();

    const swapsRemaining = activeSub ? activeSub.SwapsRemaining : 0;

    // pending requests
    const pendingRequests = await Request.countDocuments({
      ReceiverId: userId,
      Status: "Pending"
    });

    // active swaps
    const activeSwaps = await SkillSwap.countDocuments({
      Status: "Active"
    });

    // completed swaps
    const completedSwaps = await SkillSwap.countDocuments({
      Status: "Completed"
    });

    return res.json({
      success: true,
      stats: {
        swapsRemaining,
        pendingRequests,
        activeSwaps,
        completedSwaps,
      },
    });

  } catch (err) {
    console.error("Overview error:", err);
    return res.status(500).json({ success: false });
  }
};


