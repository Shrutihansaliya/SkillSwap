// controllers/adminStats.js
import SkillSwap from '../models/SkillSwap.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import SkillCategory from '../models/SkillCategory.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import mongoose from 'mongoose';

/** debug helper */
function debugModel(name, model) {
  console.log(`${name} model =>`, typeof model, model && model.modelName ? model.modelName : '(no modelName)');
}

/**
 * swapsPerMonth
 * returns: { success: true, data: [{ month: 'YYYY-MM', count: 0 }, ...] }
 */
export async function swapsPerMonth(req, res) {
  try {
    debugModel('SkillSwap', SkillSwap);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const agg = await SkillSwap.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const countsByMonth = {};
    agg.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      countsByMonth[key] = item.count;
    });

    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: key, count: countsByMonth[key] || 0 });
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('swapsPerMonth error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * swapsPerMonthDetailed
 * returns [{ month: 'YYYY-MM', active, completed }]
 */
export async function swapsPerMonthDetailed(req, res) {
  try {
    debugModel('SkillSwap', SkillSwap);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 12 months window

    const agg = await SkillSwap.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$Status", "Active"] }, 1, 0] }
          },
          completedCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$Status", "Completed"] },
                    {
                      $and: [
                        { $eq: ["$Confirmations.SenderConfirmed", true] },
                        { $eq: ["$Confirmations.ReceiverConfirmed", true] }
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const countsByMonth = {};
    agg.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      countsByMonth[key] = {
        active: item.activeCount || 0,
        completed: item.completedCount || 0
      };
    });

    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = countsByMonth[key] || { active: 0, completed: 0 };
      result.push({ month: key, active: entry.active, completed: entry.completed });
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("swapsPerMonthDetailed error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

/**
 * swapsCounts
 * returns counts for Active / Completed / Pending / Cancelled and total
 */
export async function swapsCounts(req, res) {
  try {
    debugModel('SkillSwap', SkillSwap);

    const agg = await SkillSwap.aggregate([
      {
        $group: {
          _id: null,
          active: { $sum: { $cond: [{ $eq: ["$Status", "Active"] }, 1, 0] } },
          completed: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$Status", "Completed"] },
                    {
                      $and: [
                        { $eq: ["$Confirmations.SenderConfirmed", true] },
                        { $eq: ["$Confirmations.ReceiverConfirmed", true] }
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          pending: { $sum: { $cond: [{ $eq: ["$Status", "Pending"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $or: [{ $eq: ["$Status", "Cancelled"] }, { $eq: ["$Status", "Canceled"] }] }, 1, 0] } }
        }
      }
    ]);

    const row = agg && agg[0] ? agg[0] : { active: 0, completed: 0, pending: 0, cancelled: 0 };
    const counts = {
      active: Number(row.active || 0),
      completed: Number(row.completed || 0),
      pending: Number(row.pending || 0),
      cancelled: Number(row.cancelled || 0),
    };
    counts.total = counts.active + counts.completed + counts.pending + counts.cancelled;

    return res.json({ success: true, counts });
  } catch (err) {
    console.error('swapsCounts error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * revenueAggregate using Payment model
 * returns: { success:true, data: { countPaid, totalSum } }
 */
export async function revenueAggregate(req, res) {
  try {
    debugModel('Payment', Payment);

    const agg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          countPaid: { $sum: 1 },
          totalSum: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const result = agg[0] || { _id: null, countPaid: 0, totalSum: 0 };
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('revenueAggregate error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * totalUsersCount
 * returns: { success: true, totalUsers: number }
 */
export async function totalUsersCount(req, res) {
  try {
    debugModel('User', User);

    // EXCLUDE ADMIN USERS:
    const filter = {
      $nor: [
        { isAdmin: true },
        { role: { $regex: '^admin$', $options: 'i' } },
        { Role: { $regex: '^admin$', $options: 'i' } },
        { userType: { $regex: '^admin$', $options: 'i' } }
      ]
    };

    const count = await User.countDocuments(filter);

    return res.json({ success: true, totalUsers: count });
  } catch (err) {
    console.error('totalUsersCount error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * usersPerCity
 * checks several fields for city and returns [{ city, count }]
 */
export async function usersPerCity(req, res) {
  try {
    debugModel('User', User);

    const agg = await User.aggregate([
      {
        $addFields: {
          _city: {
            $ifNull: ['$city', { $ifNull: ['$address.city', { $ifNull: ['$location.city', null] }] }]
          }
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$_city', 'Unknown'] },
          count: { $sum: 1 }
        }
      },
      { $project: { _id: 0, city: '$_id', count: 1 } },
      { $sort: { count: -1, city: 1 } }
    ]);

    return res.json({ success: true, data: agg });
  } catch (err) {
    console.error('usersPerCity error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * skillsPerCategory
 */
export async function skillsPerCategory(req, res) {
  try {
    debugModel('Skill', Skill);
    debugModel('SkillCategory', SkillCategory);

    const agg = await Skill.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'skillcategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          category: { $ifNull: ['$category.name', 'Uncategorized'] },
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    return res.json({ success: true, data: agg });
  } catch (err) {
    console.error('skillsPerCategory error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * subscriptionsSummary
 */
export async function subscriptionsSummary(req, res) {
  try {
    debugModel('Subscription', Subscription);
    debugModel('SubscriptionPlan', SubscriptionPlan);

    const totalSubscriptions = await Subscription.countDocuments({});
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const cancelledSubscriptions = await Subscription.countDocuments({ status: 'cancelled' });

    const agg = await Subscription.aggregate([
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'plan',
          foreignField: '_id',
          as: 'plan'
        }
      },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          planId: { $ifNull: ['$plan._id', null] },
          planName: { $ifNull: ['$plan.name', 'Unknown Plan'] },
          revenueAmount: { $ifNull: ['$amount', { $ifNull: ['$plan.price', 0] }] },
          status: 1
        }
      },
      {
        $group: {
          _id: '$planId',
          planName: { $first: '$planName' },
          count: { $sum: 1 },
          revenue: { $sum: '$revenueAmount' }
        }
      },
      { $project: { _id: 0, planId: '$_id', planName: 1, count: 1, revenue: 1 } },
      { $sort: { revenue: -1, count: -1 } }
    ]);

    const totalRevenue = agg.reduce((s, item) => s + (item.revenue || 0), 0);

    const result = {
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      totalRevenue,
      breakdownPerPlan: agg
    };

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('subscriptionsSummary error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * adminStats (combined)
 * returns: { success: true, data: { swapsPerMonth, revenue, totalUsers, activeSwaps, completedSwaps, pendingRequests, cancelledSwaps, totalSwaps } }
 */
export async function adminStats(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // swaps per month
    const swapsAgg = await SkillSwap.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const swapsByMonth = {};
    swapsAgg.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      swapsByMonth[key] = item.count;
    });
    const swapsResult = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      swapsResult.push({ month: key, count: swapsByMonth[key] || 0 });
    }

    // revenue summary
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          countPaid: { $sum: 1 },
          totalSum: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);
    const revenue = revenueAgg[0] || { _id: null, countPaid: 0, totalSum: 0 };

    // total users
    const userCount = await User.countDocuments({});

    // compute counts (active/completed/pending/cancelled) in one aggregation
    const countsAgg = await SkillSwap.aggregate([
      {
        $group: {
          _id: null,
          active: { $sum: { $cond: [{ $eq: ["$Status", "Active"] }, 1, 0] } },
          completed: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$Status", "Completed"] },
                    {
                      $and: [
                        { $eq: ["$Confirmations.SenderConfirmed", true] },
                        { $eq: ["$Confirmations.ReceiverConfirmed", true] }
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          pending: { $sum: { $cond: [{ $eq: ["$Status", "Pending"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $or: [{ $eq: ["$Status", "Cancelled"] }, { $eq: ["$Status", "Canceled"] }] }, 1, 0] } }
        }
      }
    ]);

    const crow = countsAgg && countsAgg[0] ? countsAgg[0] : { active: 0, completed: 0, pending: 0, cancelled: 0 };
    const counts = {
      activeSwaps: Number(crow.active || 0),
      completedSwaps: Number(crow.completed || 0),
      pendingRequests: Number(crow.pending || 0),
      cancelledSwaps: Number(crow.cancelled || 0),
    };
    counts.totalSwaps = counts.activeSwaps + counts.completedSwaps + counts.pendingRequests + counts.cancelledSwaps;

    const payload = {
      swapsPerMonth: swapsResult,
      revenue,
      totalUsers: userCount,
      ...counts
    };

    return res.json({ success: true, data: payload });
  } catch (err) {
    console.error('adminStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * Default export
 */
export default {
  swapsPerMonth,
  swapsPerMonthDetailed,
  swapsCounts,
  revenueAggregate,
  totalUsersCount,
  usersPerCity,
  skillsPerCategory,
  subscriptionsSummary,
  adminStats
};
