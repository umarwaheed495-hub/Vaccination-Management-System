import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Standard password nahi, Gmail App Password use karein
    },
  });

  const mailOptions = {
    from: `"Vaccination Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: subject,
    html: message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error; // Re-throw error so the calling controller can catch it
  }
};