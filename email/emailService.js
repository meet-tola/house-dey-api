import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  const FRONTEND_URL = "http://localhost:3000" || process.env.HOSTED_URL;

  export const sendVerificationEmail = async (email, verificationToken) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: `<p>Click the link to verify your email: <a href="${FRONTEND_URL}/verify/${verificationToken}">Verify Email</a></p>`,
    };
  
    await transporter.sendMail(mailOptions);
  };
  
  export const sendResetPasswordEmail = async (email, resetToken) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your password',
      html: `<p>Click the link to reset your password: <a href="${FRONTEND_URL}/reset-password/${resetToken}">Reset Password</a></p>`,
    };
  
    await transporter.sendMail(mailOptions);
  };
  
  export default transporter;
