// Server/controllers/reportController.js
import mongoose from "mongoose";
import Report from "../models/Report.js";
import User from "../models/User.js";
import SkillSwap from "../models/SkillSwap.js";
import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";
import transporter from "../config/nodemailer.js";

const ALLOWED_STATUSES = ["pending", "in_review", "resolved", "rejected", "suspended"];
const ALLOWED_ACTIONS = ["none", "warned", "suspended", "deleted"];

// Simple HTML escaping helper for safe email output
function escapeHtml(input) {
  if (input === undefined || input === null) return "";
  return String(input).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return ch;
    }
  });
}

/**
 * When a user is suspended:
 *  - find all ACTIVE swaps where he is sender/receiver
 *  - mark swap as Cancelled + CompletedAt
 *  - refund 1 swap credit to OTHER user
 *  - send notification to other user in clear English
 */
// async function handleUserSuspensionSwaps(suspendedUser) {
//   try {
//     const suspendedId = String(suspendedUser._id);
//     const suspendedName =
//       suspendedUser.Username || suspendedUser.Email || "this user";

//     // All ACTIVE swaps with Request populated
//     const activeSwaps = await SkillSwap.find({ Status: "Active" })
//       .populate({
//         path: "RequestId",
//         select: "SenderId ReceiverId",
//       })
//       .lean();

//     for (const swap of activeSwaps) {
//       const req = swap.RequestId;
//       if (!req) continue;

//       const senderId = req.SenderId ? String(req.SenderId) : null;
//       const receiverId = req.ReceiverId ? String(req.ReceiverId) : null;

//       let otherUserId = null;

//       if (senderId === suspendedId) otherUserId = receiverId;
//       else if (receiverId === suspendedId) otherUserId = senderId;

//       if (!otherUserId) continue; // swap not related to this suspended user

//       // 1️⃣ Cancel swap
//       try {
//         await SkillSwap.findByIdAndUpdate(
//           swap._id,
//           {
//             Status: "Cancelled",
//             CompletedAt: new Date(),
//           },
//           { new: true }
//         );
//       } catch (err) {
//         console.error("handleUserSuspensionSwaps: failed to cancel swap:", err);
//       }

//       // 2️⃣ Refund +1 swap credit to other user
//       try {
//         const sub = await Subscription.findOne({ UserId: otherUserId });
//         if (sub) {
//           sub.SwapsRemaining = (sub.SwapsRemaining || 0) + 1;
//           await sub.save();
//         }
//       } catch (err) {
//         console.error("handleUserSuspensionSwaps: refund error:", err);
//       }

//       // 3️⃣ Send notification
//       try {
//         await Notification.create({
//           userId: otherUserId,
//           type: "partner_suspended",
//           message: `Your skill swap with ${suspendedName} was cancelled because their account has been suspended. One swap credit has been added back to your account.`,
//           link: "/dashboard?tab=swapactivity",
//         });
//       } catch (err) {
//         console.error("handleUserSuspensionSwaps: notification error:", err);
//       }
//     }
//   } catch (err) {
//     console.error("handleUserSuspensionSwaps: fatal error:", err);
//   }
// }

// ----------------------
// create report (any logged-in user)
// ----------------------
async function handleUserSuspensionSwaps(suspendedUser) {
  try {
    const suspendedId = String(suspendedUser._id);
    const suspendedName =
      suspendedUser.Username || suspendedUser.Email || "this user";

    // Find ALL active swaps
    const activeSwaps = await SkillSwap.find({ Status: "Active" })
      .populate({
        path: "RequestId",
        select: "SenderId ReceiverId",
      })
      .lean();

    for (const swap of activeSwaps) {
      const req = swap.RequestId;
      if (!req) continue;

      const senderId = req.SenderId ? String(req.SenderId) : null;
      const receiverId = req.ReceiverId ? String(req.ReceiverId) : null;

      let otherUserId = null;

      if (senderId === suspendedId) otherUserId = receiverId;
      else if (receiverId === suspendedId) otherUserId = senderId;

      if (!otherUserId) continue;

      // ------------------------------
      // 1️⃣ Cancel the swap
      // ------------------------------
      try {
        await SkillSwap.findByIdAndUpdate(
          swap._id,
          {
            Status: "Cancelled",
            CompletedAt: new Date(),
          },
          { new: true }
        );
      } catch (err) {
        console.error("handleUserSuspensionSwaps: failed cancel:", err);
      }

      // ------------------------------
      // 2️⃣ REFUND LOGIC (3 cases)
      // ------------------------------
      try {
        // CASE A: If user has ACTIVE plan → refund there
        let activePlan = await Subscription.findOne({
          UserId: otherUserId,
          Status: "Active",
        });

        if (activePlan) {
          activePlan.SwapsRemaining += 1;
          await activePlan.save();
        } else {
          // CASE B: No Active plan → check if upcoming exists
          const upcomingPlan = await Subscription.findOne({
            UserId: otherUserId,
            Status: "Upcoming",
          });

          if (upcomingPlan) {
            // Promote upcoming → Active
            upcomingPlan.Status = "Active";
            upcomingPlan.StartDate = new Date();
            await upcomingPlan.save();

            // Refund goes into this new active plan
            upcomingPlan.SwapsRemaining += 1;
            await upcomingPlan.save();
          } else {
            // CASE C: No active & no upcoming → create new free plan
            await Subscription.create({
              UserId: otherUserId,
              PlanId: null,
              IsFreePlan: true,
              SwapsRemaining: 1,
              Status: "Active",
              PaymentStatus: "Refund",
              StartDate: new Date(),
            });
          }
        }
      } catch (err) {
        console.error("handleUserSuspensionSwaps: refund error:", err);
      }

      // ------------------------------
      // 3️⃣ Send notification
      // ------------------------------
      try {
        await Notification.create({
          userId: otherUserId,
          type: "partner_suspended",
          message: `Your skill swap with ${suspendedName} was cancelled because their account has been suspended. One swap credit has been added back to your account.`,
          link: "/dashboard?tab=swapactivity",
        });
      } catch (err) {
        console.error("handleUserSuspensionSwaps: notification error:", err);
      }
    }
  } catch (err) {
    console.error("handleUserSuspensionSwaps: fatal error:", err);
  }
}



export const createReport = async (req, res) => {
  try {
    const reporterId = req.userId;
    const { reportedUser, reason, description, evidence } = req.body;

    if (!reportedUser || !reason) {
      return res
        .status(400)
        .json({ success: false, message: "reportedUser and reason are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(reportedUser)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reportedUser id" });
    }

    if (String(reporterId) === String(reportedUser)) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot report yourself" });
    }

    const reported = await User.findById(reportedUser).select("_id Username Email");
    if (!reported) {
      return res
        .status(404)
        .json({ success: false, message: "Reported user not found" });
    }

    const report = await Report.create({
      reporter: reporterId,
      reportedUser,
      reason,
      description,
      evidence: Array.isArray(evidence)
        ? evidence
        : evidence
        ? [evidence]
        : [],
    });

    await User.findByIdAndUpdate(reportedUser, { $inc: { reportsCount: 1 } }).catch(
      () => {}
    );

    const populated = await Report.findById(report._id)
      .populate("reporter", "Username Email")
      .populate("reportedUser", "Username Email isSuspended");

    return res
      .status(201)
      .json({ success: true, message: "Report submitted", report: populated });
  } catch (err) {
    console.error("createReport error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------
// get all reports (admin only)
// ----------------------
export const getReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 200);
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { reason: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reporter", "Username Email")
        .populate("reportedUser", "Username Email isSuspended"),
      Report.countDocuments(query),
    ]);

    return res.json({
      success: true,
      reports,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("getReports error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// ----------------------
// get single report (admin)
// ----------------------
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid report id" });
    }

    const report = await Report.findById(id)
      .populate("reporter", "Username Email")
      .populate("reportedUser", "Username Email isSuspended");

    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });

    return res.json({ success: true, report });
  } catch (err) {
    console.error("getReportById error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// ----------------------
// update report + take action
// ----------------------
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid report id" });
    }

    const {
      status,
      adminNote,
      actionTaken,
      suspendUntil,
      sendEmail,
      emailSubject,
      emailBody,
    } = req.body;

    if (status !== undefined && status !== null && String(status).length > 0) {
      const s = String(status);
      if (!ALLOWED_STATUSES.includes(s)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status value. Allowed: ${ALLOWED_STATUSES.join(
            ", "
          )}`,
        });
      }
    }

    if (
      actionTaken !== undefined &&
      actionTaken !== null &&
      String(actionTaken).length > 0
    ) {
      const a = String(actionTaken);
      if (!ALLOWED_ACTIONS.includes(a)) {
        return res.status(400).json({
          success: false,
          message: `Invalid actionTaken value. Allowed: ${ALLOWED_ACTIONS.join(
            ", "
          )}`,
        });
      }
    }

    let report = await Report.findById(id);
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });

    if (status) report.status = status;
    if (adminNote !== undefined) report.adminNote = adminNote;
    if (actionTaken) report.actionTaken = actionTaken;

    if (suspendUntil !== undefined) {
      if (
        suspendUntil === null ||
        suspendUntil === "" ||
        suspendUntil === "null"
      ) {
        report.suspendUntil = null;
      } else {
        const dt = new Date(suspendUntil);
        if (isNaN(dt.getTime())) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid suspendUntil date" });
        }
        report.suspendUntil = dt;
      }
    }

    await report.save();

    // --- apply action on user ---
    const reportedId =
      report.reportedUser && report.reportedUser._id
        ? report.reportedUser._id
        : report.reportedUser;

    // 🔁 NEW: keep all reports for this reported user in sync
    if (reportedId && mongoose.Types.ObjectId.isValid(String(reportedId))) {
      const bulkUpdate = {};
      if (status) bulkUpdate.status = status;
      if (actionTaken) bulkUpdate.actionTaken = actionTaken;
      if (suspendUntil !== undefined) {
        bulkUpdate.suspendUntil = report.suspendUntil ?? null;
      }
      if (Object.keys(bulkUpdate).length > 0) {
        try {
          await Report.updateMany(
            { reportedUser: reportedId },
            { $set: bulkUpdate }
          );
        } catch (syncErr) {
          console.error(
            "updateReportStatus: failed to sync other reports:",
            syncErr
          );
        }
      }
    }

    if (reportedId && mongoose.Types.ObjectId.isValid(String(reportedId))) {
      try {
        const user = await User.findById(reportedId);
        if (user) {
          if (actionTaken === "suspended") {
            user.isSuspended = true;
            user.suspensionUntil = report.suspendUntil ?? null;
            user.Status = "Inactive";
            await user.save();

            // 🔥 cancel active swaps, refund +1, send notifications
            await handleUserSuspensionSwaps(user);
          } else if (actionTaken === "warned") {
            user.warnings = (user.warnings || 0) + 1;
            await user.save();
          } else if (actionTaken === "deleted") {
            await User.findByIdAndDelete(reportedId);
          } else if (actionTaken === "none") {
            if (!report.suspendUntil) {
              user.isSuspended = false;
              user.suspensionUntil = null;
              user.Status = "Active";
              await user.save();
            }
          }
        } else {
          console.warn(
            "updateReportStatus: reported user not found when attempting to apply action:",
            reportedId
          );
        }
      } catch (userErr) {
        console.error("updateReportStatus: user action failed:", userErr);
      }
    } else {
      console.warn(
        "updateReportStatus: reportedUser id invalid or missing:",
        report.reportedUser
      );
    }

    // Optional email (HTML template)
    if (sendEmail) {
      try {
        let reported = report.reportedUser;
        if (!reported || !reported.Email || !reported.Username) {
          reported = await User.findById(reportedId).select("Email Username");
        }

        if (reported && reported.Email) {
          const reportedName = reported.Username || reported.Email || "User";
          const subject =
            emailSubject ||
            `Account action notification for ${reportedName}`;

          // Plain text fallback body
          const body =
            emailBody ||
            `Hello ${reportedName},

An administrative action has been taken regarding a report related to your account.

Action: ${report.actionTaken || "none"}
Status: ${report.status || "N/A"}
Admin note: ${report.adminNote || "No details provided."}
${
  report.suspendUntil
    ? `Suspension until: ${report.suspendUntil.toISOString()}`
    : ""
}

If you believe this is a mistake, please contact support.
`;

          const isSuspendedStatus = report.status === "suspended";
          let statusDisplay = "No active action";
          if (isSuspendedStatus) {
            statusDisplay = "Suspended";
          } else if (report.status) {
            statusDisplay = report.status.replace(/_/g, " ");
          }

          const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Helvetica,Arial,sans-serif;color:#333;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.06);">
            
            <tr>
              <td style="background:linear-gradient(90deg,#4f46e5,#06b6d4);padding:20px 24px;color:#fff;">
                <h1 style="margin:0;font-size:20px;font-weight:700;">Account Action Notice</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.95;">
                  We wanted to inform you about an administrative action on your account.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px;">
                <p style="margin:0 0 12px;font-size:15px;">
                  Hello <strong>${escapeHtml(reportedName)}</strong>,
                </p>

                <div style="padding:20px;border-radius:8px;background:#f8fafc;border:1px solid #e6eefb;text-align:center;">
                  <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Current Status</div>
                  <div style="font-size:26px;font-weight:700;color:${isSuspendedStatus ? "#dc2626" : "#111"};">
                    ${escapeHtml(statusDisplay)}
                  </div>
                </div>

                <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">
                  If you believe this action is a mistake or have questions, feel free to contact our support team.
                </p>

                <div style="margin-top:16px;">
                  <a href="${process.env.SUPPORT_URL || "#"}"
                    style="display:inline-block;padding:10px 14px;border-radius:6px;
                    background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">
                    Contact Support
                  </a>
                </div>

                <p style="margin:18px 0 0;font-size:12px;color:#9ca3af;">
                  This message was sent to <strong>${escapeHtml(
                    reported.Email
                  )}</strong>. 
                  Please do not reply to this automated email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 24px;background:#f8fafc;font-size:12px;color:#9ca3af;text-align:center;">
                © ${new Date().getFullYear()} ${escapeHtml(
            process.env.SENDER_NAME || "Your Company"
          )} — All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

          await transporter.sendMail({
            from: `"SkillSwap" <${process.env.SENDER_EMAIL}>`,
            to: reported.Email,
            subject,
            text: body,
            html,
          });
        }
      } catch (mailErr) {
        console.error("updateReportStatus: failed to send email:", mailErr);
      }
    }

    const populated = await Report.findById(report._id)
      .populate("reporter", "Username Email")
      .populate("reportedUser", "Username Email isSuspended");

    return res.json({
      success: true,
      message: "Report updated",
      report: populated,
    });
  } catch (err) {
    console.error("updateReportStatus error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// ----------------------
// delete report (admin)
// ----------------------
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid report id" });
    }

    await Report.findByIdAndDelete(id);
    return res.json({ success: true, message: "Report deleted" });
  } catch (err) {
    console.error("deleteReport error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};
