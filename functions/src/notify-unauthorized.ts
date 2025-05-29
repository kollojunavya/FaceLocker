
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const notifyUnauthorized = functions.https.onRequest(async (req, res) => {
  const { userId, email, imageUrl } = req.body;

  if (!userId || !email || !imageUrl) {
    res.status(400).send("Missing required fields");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"FaceLocker" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Unauthorized Locker Access Attempt",
      html: `
        <p>Dear User,</p>
        <p>An unauthorized attempt was made to access your FaceLocker at ${new Date().toLocaleString()}.</p>
        <p><img src="${imageUrl}" alt="Unauthorized Attempt" style="max-width: 300px;" /></p>
        <p>Please review this attempt in your dashboard.</p>
        <p>Best regards,<br>FaceLocker Team</p>
      `,
    });
    res.status(200).send("Notification sent");
  } catch (error: any) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send notification");
  }
});
