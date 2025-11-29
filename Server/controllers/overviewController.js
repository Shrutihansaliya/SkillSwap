import mongoose from "mongoose";
import Request from "../models/Request.js";
import SkillSwap from "../models/SkillSwap.js";
import Subscription from "../models/Subscription.js";

export const getOverviewStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({
        success: false,
        message: "Invalid userId",
        stats: {}
      });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    // ---------------------------
    // ⭐ 1. PENDING REQUESTS
    // ---------------------------
    const pendingRequests = await Request.countDocuments({
      Status: "Pending",
      $or: [{ SenderId: userObjId }, { ReceiverId: userObjId }],
    });

    // ---------------------------
    // ⭐ 2. ACTIVE SWAPS
    // ---------------------------
    const activeSwapsAgg = await SkillSwap.aggregate([
      { $match: { Status: "Active" } },

      // Join with Request collection
      {
        $lookup: {
          from: "requests",
          localField: "RequestId",
          foreignField: "_id",
          as: "reqData",
        },
      },

      { $unwind: "$reqData" },

      {
        $match: {
          $or: [
            { "reqData.SenderId": userObjId },
            { "reqData.ReceiverId": userObjId },
          ],
        },
      },

      { $count: "count" },
    ]);

    const activeSwaps = activeSwapsAgg[0]?.count || 0;

    // ---------------------------
    // ⭐ 3. COMPLETED SWAPS
    // ---------------------------
    const completedSwapsAgg = await SkillSwap.aggregate([
      { $match: { Status: "Completed" } },

      {
        $lookup: {
          from: "requests",
          localField: "RequestId",
          foreignField: "_id",
          as: "reqData",
        },
      },

      { $unwind: "$reqData" },

      {
        $match: {
          $or: [
            { "reqData.SenderId": userObjId },
            { "reqData.ReceiverId": userObjId },
          ],
        },
      },

      { $count: "count" },
    ]);

    const completedSwaps = completedSwapsAgg[0]?.count || 0;

    // ---------------------------
    // ⭐ 4. SWAPS REMAINING
    // ---------------------------
    const subscription = await Subscription.findOne({ UserId: userObjId });
    const swapsRemaining = subscription?.SwapsRemaining ?? 0;

    // ---------------------------
    // ⭐ RETURN RESPONSE
    // ---------------------------
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
    console.error("Overview Error:", err);
    return res.status(500).json({
      success: false,
      stats: {
        swapsRemaining: 0,
        pendingRequests: 0,
        activeSwaps: 0,
        completedSwaps: 0,
      },
    });
  }
};
