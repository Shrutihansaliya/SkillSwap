import nodemailer from "nodemailer";
import 'dotenv/config';

console.log("SMTP_USER:", process.env.SMTP_USER); // for debugging
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "Loaded" : "Not loaded");
console.log("SENDER_EMAIL:", process.env.SENDER_EMAIL);

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((err, success) => {
  if (err) console.error("❌ SMTP connection failed:", err);
  else console.log("✅ SMTP connection OK");
});

async function sendTestMail() {
  try {
    await transporter.sendMail({
      from: `"SkillSwap" <${process.env.SENDER_EMAIL}>`,
      to: process.env.SENDER_EMAIL,
      subject: "Test Email",
      text: "This is a test email from your SkillSwap backend."
    });
    console.log("✅ Test email sent!");
  } catch (err) {
    console.error("❌ Error sending test email:", err);
  }
}

sendTestMail();
