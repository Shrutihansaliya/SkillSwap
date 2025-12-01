// controllers/userController.js

import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import transporter from "../config/nodemailer.js";
import User from "../models/User.js";
import City from "../models/City.js";
import Category from "../models/SkillCategory.js";
import Skill from "../models/Skill.js";
import UserSkill from "../models/UserSkill.js";
import Subscription from "../models/Subscription.js";
import PDFDocument from "pdfkit";

// ======================
// ✅ GET ACTIVE CITIES
// ======================
export const getActiveCities = async (req, res) => {
  try {
    // Case-insensitive, so "active" or "Active" both work
    const activeCities = await City.find({
      status: { $regex: /^active$/i },
    }).sort({ cityName: 1 });

    if (!activeCities.length)
      return res
        .status(404)
        .json({ success: false, message: "No active cities found." });

    res.status(200).json({ success: true, cities: activeCities });
  } catch (err) {
    console.error("Error fetching active cities:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching cities." });
  }
};
// ======================
// REGISTER USER
// ======================
export const registerUser = async (req, res) => {
  try {
    const { Username, Email, Password, DateOfBirth, Gender, StreetNo, Area, City: cityId, ContactNo, Bio } = req.body;

    const hashedPassword = await bcrypt.hash(Password, 10);

    const city = await City.findById(cityId);
    if (!city) return res.status(400).json({ success: false, message: "Invalid city selected" });

    const tempUser = new User({
      Username,
      Email,
      Password: hashedPassword,
      DateOfBirth,
      Gender,
      StreetNo,
      Area,
      City: city._id,
      ContactNo,
      Bio: Bio || null,
      ProfileImageURL: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await tempUser.validate();

    const existingEmail = await User.findOne({ Email });
    if (existingEmail) return res.status(400).json({ error: "Email is already registered" });

    const existingContact = await User.findOne({ ContactNo });
    if (existingContact) return res.status(400).json({ error: "Contact number is already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.otp = otp;
    req.session.email = Email;
    req.session.otpExpire = Date.now() + 10 * 60 * 1000;
    req.session.userData = tempUser.toObject();
await transporter.sendMail({
  from: `SkillSwap <${process.env.SENDER_EMAIL}>`,
  to: Email,
  subject: "SkillSwap OTP Verification",
  html: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkillSwap OTP Verification</title>
  </head>
  <body style="margin:0;padding:0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f4f4f7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(90deg, #4f46e5, #a78bfa, #f472b6); padding: 40px; text-align:center;">
                <h1 style="color:#fff; font-size:32px; margin:0;">Welcome to SkillSwap!</h1>
                <p style="color:#e0e7ff; font-size:16px; margin-top:8px;">Your gateway to learning and teaching skills</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px 30px; text-align:center;">
                <p style="font-size:18px; color:#374151; margin-bottom:30px;">
                  Hi there! To complete your registration on <strong>SkillSwap</strong>, please use the OTP below:
                </p>

              <div style="display:inline-block; 
            padding: 20px 40px; 
            background-color:#fbcfe8; /* light pink */
            color:#7f1d9c;           /* dark pink/purple for contrast */
            font-size:32px; 
            font-weight:bold; 
            border-radius:12px; 
            letter-spacing:4px; 
            margin-bottom:30px;">
  ${otp}
</div>


                <p style="font-size:16px; color:#6b7280; margin-bottom:40px;">
                  This OTP is valid for the next <strong>10 minutes</strong>. Please do not share it with anyone.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f9fafb; padding:30px; text-align:center; font-size:12px; color:#9ca3af;">
                &copy; ${new Date().getFullYear()} SkillSwap. All rights reserved.<br>
                Need help? Contact us at <a href="mailto:support@skillswap.com" style="color:#4f46e5; text-decoration:none;">support@skillswap.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
});


    res.json({ success: true, message: "OTP sent to your email.", user: { Email, Username } });
  } catch (err) {
    console.error("Register Error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
// ======================
// VERIFY OTP
// ======================
// export const verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!req.session || !req.session.otp)
//       return res.status(400).json({ success: false, message: "OTP session expired. Please register again." });

//     if (req.session.email !== email)
//       return res.status(400).json({ success: false, message: "Email mismatch" });

//     if (Date.now() > req.session.otpExpire)
//       return res.status(400).json({ success: false, message: "OTP expired" });

//     if (req.session.otp !== String(otp))
//       return res.status(400).json({ success: false, message: "Invalid OTP" });

//     const userData = req.session.userData;
//     const newUser = new User({ ...userData, IsVerified: true, Status: "Active" });
//     await newUser.save();

//     // ✅ Automatically create default subscription with 2 swaps
//     try {
//       const subscription = new Subscription({
//         UserId: newUser._id,
//         PlanId: null, // or your default Plan _id
//         SwapsRemaining: 2,
//       });
//       await subscription.save();
//       console.log(`🎁 Created default subscription for ${newUser.Email}`);
//     } catch (subErr) {
//       console.error("Subscription creation failed:", subErr);
//     }

//     req.session.destroy();

//     res.json({
//       success: true,
//       message: "User registered successfully",
//       user: {
//         UserId: newUser._id,
//         Email: newUser.Email,
//         Username: newUser.Username,
//       },
//     });
//   } catch (err) {
//     console.error("OTP Verify Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!req.session || !req.session.otp)
      return res.status(400).json({ success: false, message: "OTP session expired. Please register again." });

    if (req.session.email !== email)
      return res.status(400).json({ success: false, message: "Email mismatch" });

    if (Date.now() > req.session.otpExpire)
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (req.session.otp !== String(otp))
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    const userData = req.session.userData;

    // Create verified new user
    const newUser = new User({
      ...userData,
      IsVerified: true,
      Status: "Active",
    });
    await newUser.save();

    // 🎁 Create FREE 2 Swap Plan
//     try {
      
// await Subscription.create({
//   UserId: newUser._id,
//   PlanId: null,
//   IsFreePlan: true,
//   SwapsRemaining: 2,
//   Status: "Active", 
//   PaymentStatus: "Pending",
// });

//       console.log(`🎁 Free subscription created for ${newUser.Email}`);
//     } catch (subErr) {
//       console.error("Subscription creation failed:", subErr);
//     }
// create default subscription (explicit free plan)
try {
  const subscription = new Subscription({
    UserId: newUser._id,
    PlanId: null,
    IsFreePlan: true,
    SwapsRemaining: 2,
    Status: "Active",
    StartDate: new Date(),
  });
  await subscription.save();
  console.log(`🎁 Created default subscription for ${newUser.Email}`);
} catch (subErr) {
  console.error("Subscription creation failed:", subErr);
}

    req.session.destroy();

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        UserId: newUser._id,
        Email: newUser.Email,
        Username: newUser.Username,
      },
    });

  } catch (err) {
    console.error("OTP Verify Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};






// export const resendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!req.session || !req.session.userData || req.session.email !== email) {
//       return res.status(400).json({
//         success: false,
//         message: "Session expired or invalid email. Please register again.",
//       });
//     }

//     // Generate new OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     req.session.otp = otp;
//     req.session.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

//     // Send OTP email
//     await transporter.sendMail({
//       from: `SkillSwap <${process.env.SENDER_EMAIL}>`,
//       to: email,
//       subject: "OTP Verification - Resend",
//       text: `Your new OTP is: ${otp}`,
//     });

//     res.json({ success: true, message: "OTP resent successfully." });
//   } catch (err) {
//     console.error("Resend OTP Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!req.session || !req.session.userData || req.session.email !== email) {
      return res.status(400).json({
        success: false,
        message: "Session expired or invalid email. Please register again.",
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.otp = otp;
    req.session.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Send OTP email
   await transporter.sendMail({
  from: `"SkillSwap" <${process.env.SENDER_EMAIL}>`,
  to: email,
  subject: "OTP Verification - Resend",
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #fff0f6; padding: 40px 0;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); text-align: center;">
        
        <!-- Header -->
        <h2 style="color: #d63384; margin-bottom: 20px;">SkillSwap OTP Verification</h2>
        <p style="color: #333333; font-size: 16px; margin-bottom: 30px;">
          Hello, <br>
          Your new OTP for verification is:
        </p>

        <!-- OTP -->
        <div style="display: inline-block; padding: 15px 30px; background-color: #fbcfe8; color: #9d174d; font-size: 28px; font-weight: bold; border-radius: 8px; letter-spacing: 3px; margin-bottom: 30px;">
          ${otp}
        </div>

        <!-- Note -->
        <p style="color: #555555; font-size: 14px; margin-bottom: 0;">
          This OTP is valid for 30 seconds. If you did not request this, please ignore this email.
        </p>

      </div>
    </div>
  `,
});


    res.json({ success: true, message: "OTP resent successfully." });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// ======================
// FETCH CATEGORIES & SKILLS
// ======================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ CategoryName: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSkillsByCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);
    const skills = await Skill.find({ CategoryId: categoryId }).sort({ Name: 1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Utility to ensure directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

// Helper to create PDF based on template
const generatePdfForSkill = async ({
  outputPdfPath,
  logoPath,
  categoryName,
  skillName,
  templateType,
  templateData,
  templateImagePath, // may be null
}) => {
  return new Promise((resolve, reject) => {
    try {
      ensureDir(path.dirname(outputPdfPath));
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const writeStream = fs.createWriteStream(outputPdfPath);
      doc.pipe(writeStream);

      // ---- Header: Logo & Title ----
      if (logoPath && fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, (doc.page.width - 120) / 2, 30, { width: 120 });
        } catch (e) {
          // ignore image load errors
        }
      }
      doc.moveDown(6);
      doc.fontSize(20).fillColor("#1f2937").text("Skill Content Summary", { align: "center" });
      doc.moveDown(1);

      // Category & Skill line
      doc.fontSize(12).fillColor("#4b5563").text(`Category: ${categoryName || "N/A"}`, { align: "left" });
      doc.fontSize(12).fillColor("#4b5563").text(`Skill: ${skillName || "N/A"}`);
      doc.moveDown(0.5);

      // Divider
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor("#e5e7eb").stroke();
      doc.moveDown(1);

      // TEMPLATE: main (main topics)
      if (templateType === "main") {
        doc.fontSize(14).fillColor("#111827").text("Main Topics", { underline: true });
        doc.moveDown(0.5);

        const topics = (templateData || "").split(",").map((t) => t.trim()).filter(Boolean);
        topics.forEach((t) => {
          doc.fontSize(12).text("✓ " + t, { continued: false });
        });
      }

      // TEMPLATE: sub (topic - subtopics per line)
      else if (templateType === "sub") {
        doc.fontSize(14).fillColor("#111827").text("Topics Breakdown", { underline: true });
        doc.moveDown(0.5);

        const lines = (templateData || "").split("\n").map((l) => l.trim()).filter(Boolean);
        lines.forEach((line) => {
          const [topicPart, subPart] = line.split("-");
          const topic = (topicPart || "").trim();
          const subStr = (subPart || "").trim();
          doc.fontSize(13).fillColor("#0f172a").text("• " + topic);
          if (subStr) {
            const subs = subStr.split(",").map((s) => s.trim()).filter(Boolean);
            subs.forEach((sub) => {
              doc.fontSize(12).fillColor("#374151").text("   → " + sub, { indent: 20 });
            });
          }
          doc.moveDown(0.2);
        });
      }

      // TEMPLATE: image + description
      else if (templateType === "image") {
        doc.fontSize(14).fillColor("#111827").text("Image Preview", { underline: true });
        doc.moveDown(0.5);

        if (templateImagePath && fs.existsSync(templateImagePath)) {
          // Fit image width to 420 while maintaining aspect ratio
          try {
            doc.image(templateImagePath, { fit: [420, 320], align: "center", valign: "center" });
          } catch (e) {
            // If pdfkit cannot read the image, skip
            console.error("Image embed error:", e);
            doc.fontSize(12).text("[Image not available]", { align: "center" });
          }
          doc.moveDown(1);
        } else {
          doc.fontSize(12).text("[No image provided]", { align: "center" });
          doc.moveDown(1);
        }

        doc.fontSize(14).fillColor("#111827").text("Description", { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(12).fillColor("#374151").text(templateData || "", { align: "justify" });
      }

      // Footer / generated by
      doc.moveDown(2);
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor("#e5e7eb").stroke();
      doc.moveDown(0.6);
      const footerText = `Generated by SkillSwap | ${new Date().getFullYear()}`;
      doc.fontSize(10).fillColor("#9ca3af").text(footerText, { align: "center" });

      doc.end();

      writeStream.on("finish", () => {
        resolve();
      });
      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};


// ======================
// ADD MULTIPLE SKILLS (with generated PDFs)
// ======================
export const addUserSkills = async (req, res) => {
  try {
    const { UserId, SkillData } = req.body;

    if (!UserId || !SkillData)
      return res.status(400).json({ success: false, message: "UserId and SkillData required" });

    const skillArray = JSON.parse(SkillData);

    if (skillArray.length < 1 || skillArray.length > 5)
      return res.status(400).json({ success: false, message: "Add minimum 1 and maximum 5 skills" });

    const savedSkills = [];

    // files arrays (multer)
    const certFiles = req.files?.certificates || []; // may contain empty Blob entries
    const templateImages = req.files?.TemplateImages || []; // may contain empty file placeholders

    // Ensure upload directories exist
    ensureDir(path.join(process.cwd(), "uploads", "contentfiles"));
    ensureDir(path.join(process.cwd(), "uploads", "certificates"));

    const logoPath = path.join(process.cwd(), "uploads", "logo.png"); // ensure logo exists here

    for (let i = 0; i < skillArray.length; i++) {
      const data = skillArray[i];
      if (!data.SkillId) continue;

      // Prevent duplicate skill for user
      const exists = await UserSkill.findOne({
        UserId,
        SkillId: Number(data.SkillId),
      });
      if (exists) continue;

      // certificate file at same index if uploaded properly
      const certFile = certFiles[i]?.path || null;
      // templateImage file if uploaded
      const templateImageFile = templateImages[i]?.path || null;

      // Get skill and category names for inclusion in PDF
      const skillDoc = await Skill.findOne({ SkillId: Number(data.SkillId) });
      let skillName = skillDoc ? skillDoc.Name : null;
      let categoryName = null;
      if (skillDoc && skillDoc.CategoryId !== undefined && skillDoc.CategoryId !== null) {
        const categoryDoc = await Category.findOne({ CategoryId: skillDoc.CategoryId });
        categoryName = categoryDoc ? categoryDoc.CategoryName : null;
      }

      // Generate PDF from template
      let generatedPdfRelPath = null;
      try {
        const pdfFileName = `content_${UserId}_${Date.now()}_${i}.pdf`;
        const outputPdfPath = path.join("uploads", "contentfiles", pdfFileName);
        await generatePdfForSkill({
          outputPdfPath,
          logoPath,
          categoryName,
          skillName,
          templateType: data.TemplateType,
          templateData: data.TemplateData,
          templateImagePath: templateImageFile,
        });
        generatedPdfRelPath = `/${outputPdfPath.replace(/\\/g, "/")}`;
      } catch (pdfErr) {
        console.error("PDF generation error for skill index", i, pdfErr);
        // continue — still allow saving entry without content file if necessary
        generatedPdfRelPath = null;
      }

      const userSkill = new UserSkill({
        UserId,
        SkillId: Number(data.SkillId),
        Source: data.Source || null,
        CertificateURL: certFile ? `/${certFile.replace(/\\/g, "/")}` : null,
        ContentFileURL: generatedPdfRelPath || null,
      });

      savedSkills.push(await userSkill.save());
    }

    if (savedSkills.length === 0)
      return res.status(400).json({
        success: false,
        message: "No new skills to add",
      });

    res.json({
      success: true,
      message: "Skills added successfully",
      data: savedSkills,
    });
  } catch (err) {
    console.error("addUserSkills error:", err);
    if (err.code === 11000)
      return res.status(400).json({
        success: false,
        message: "Duplicate entry detected",
      });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================
// USER PROFILE
// ======================
// export const getUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select("-Password");
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });
//     res.json({ success: true, user });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-Password")
      .populate("City", "cityName status"); // ✅ populate city object

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================
// UPDATE USER PROFILE
// ======================
// ======================
// UPDATE USER PROFILE WITH VALIDATION (same as register)
// ======================
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      Username,
      Email,
      DateOfBirth,
      StreetNo,
      Area,
      City: cityId,
      ContactNo,
      Bio,
       Gender,
    } = req.body;

    // ✅ 1️⃣ Check if user exists
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // ✅ 2️⃣ Validate Username
    if (!/^[a-zA-Z0-9_]+$/.test(Username) || Username.length < 3)
      return res
        .status(400)
        .json({ success: false, message: "Invalid username format" });

    // ✅ 3️⃣ Validate Email (unique except current user)
    const existingEmail = await User.findOne({ Email });
    if (existingEmail && existingEmail._id.toString() !== userId)
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });

    // ✅ 4️⃣ Validate Contact No (unique except current user)
    if (!/^\d{10}$/.test(ContactNo))
      return res
        .status(400)
        .json({ success: false, message: "Invalid contact number" });

    const existingContact = await User.findOne({ ContactNo });
    if (existingContact && existingContact._id.toString() !== userId)
      return res
        .status(400)
        .json({ success: false, message: "Contact number already in use" });

    // ✅ 5️⃣ Validate Date of Birth (minimum 21 years old)
    const today = new Date();
    const minDOB = new Date(today.setFullYear(today.getFullYear() - 21));
    if (new Date(DateOfBirth) > minDOB)
      return res
        .status(400)
        .json({ success: false, message: "User must be at least 21 years old" });

    // ✅ 6️⃣ Validate City
    const city = await City.findById(cityId);
    if (!city)
      return res
        .status(400)
        .json({ success: false, message: "Invalid city selected" });

    // ✅ 7️⃣ Validate StreetNo and Area
    if (!/^[a-zA-Z0-9\s,]+$/.test(StreetNo))
      return res.status(400).json({
        success: false,
        message: "StreetNo can only contain letters, numbers, commas, and spaces",
      });
    if (!/^[a-zA-Z0-9\s,]+$/.test(Area))
      return res.status(400).json({
        success: false,
        message: "Area can only contain letters, numbers, commas, and spaces",
      });

    // ✅ 8️⃣ Update fields
    user.Username = Username;
    user.Email = Email;
    user.DateOfBirth = DateOfBirth;
    user.StreetNo = StreetNo;
    user.Area = Area;
    user.City = city._id;
    user.ContactNo = ContactNo;
    user.Bio = Bio || null;
        user.Gender = Gender; 

    // ✅ 9️⃣ Update profile image (optional)
    if (req.file) {
      user.ProfileImageURL = `/uploads/${req.file.filename}`;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("_id Username Email");
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// controllers/userController.js
export const getUserSkills = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userSkills = await UserSkill.find({ UserId: userId });

    const skills = await Promise.all(
      userSkills.map(async (us) => {
        // Find skill by numeric SkillId
        const skill = await Skill.findOne({ SkillId: us.SkillId });
        if (!skill) return { SkillName: "Unnamed Skill", CategoryName: null };

        let categoryName = null;
        if (skill.CategoryId !== undefined && skill.CategoryId !== null) {
          // Query category by numeric CategoryId field (not _id)
          const category = await Category.findOne({ CategoryId: skill.CategoryId });
          categoryName = category ? category.CategoryName : null;
        }

        return {
          UserSkillId: us._id,
          SkillName: skill.Name,
          CategoryName: categoryName, // <-- corrected here
        };
      })
    );

    res.json({ success: true, skills });
  } catch (err) {
    console.error("Error fetching user skills:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ======================
// CHANGE PASSWORD
// ======================
export const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.Password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password incorrect" });

    const hashedPw = await bcrypt.hash(newPassword, 10);
    user.Password = hashedPw;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
