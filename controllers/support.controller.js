import prisma from "../lib/prisma.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const submitSupportRequest = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Save the support request to the database
    const supportRequest = await prisma.supportRequest.create({
      data: {
        name,
        email,
        subject,
        message,
        createdAt: new Date(),
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "ofonagorochisom81@gmail.com",
      subject: `Support Request: ${subject}`,
      html: `
        <h3>New Complain Request</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p>Submitted at: ${new Date()}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message:
        "Support request submitted successfully. We will get back to you shortly.",
    });
  } catch (error) {
    console.error("Error submitting support request:", error);
    res.status(500).json({ message: "Error submitting support request" });
  }
};
