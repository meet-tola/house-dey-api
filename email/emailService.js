import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Register Handlebars "eq" helper for conditional checks
handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

const readHTMLFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, (err, html) => {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.HOSTED_URL
    : "http://localhost:3000";

// Helper function to compile the Handlebars template
const compileTemplate = async (templatePath, data) => {
  const htmlTemplate = await readHTMLFile(templatePath);
  const compiledTemplate = handlebars.compile(htmlTemplate);
  return compiledTemplate(data);
};

export const sendVerificationEmail = async (
  email,
  username,
  verificationToken
) => {
  const templatePath = path.resolve("email", "verificationEmail.html");

  const htmlContent = await compileTemplate(templatePath, {
    username,
    verificationToken,
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email",
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

export const sendResetPasswordEmail = async (email, username, resetToken) => {
  const templatePath = path.resolve("email", "resetPasswordEmail.html");
  const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;

  const htmlContent = await compileTemplate(templatePath, {
    username,
    resetLink,
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset your password",
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

export const sendIDVerificationEmail = async (email, username) => {
  const templatePath = path.resolve("email", "IDVerification.html");

  const htmlContent = await compileTemplate(templatePath, { username });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "ID Verification Uploaded",
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

export const sendIDStatusEmail = async (
  email,
  username,
  verificationStatus
) => {
  const templatePath = path.resolve("email", "IDVerificationStatus.html");

  const htmlContent = await compileTemplate(templatePath, {
    username,
    verificationStatus,
  });

  const subject =
    verificationStatus === "approved"
      ? "ID Verification Approved"
      : verificationStatus === "rejected"
      ? "ID Verification Rejected"
      : "ID Verification Pending Review";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

export const sendRequestEmail = async (email, username, postId) => {
  const templatePath = path.resolve("email", "newPostNotification.html");
  const propertyLink = `${FRONTEND_URL}/properties/${postId}`; 

  const htmlContent = await compileTemplate(templatePath, {
    username,
    propertyLink, 
  });

  const emails = [email, "wasiusikiru7@gmail.com", "backup.chisom@gmail.com"];

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emails,
    subject: "New Property Listed!", 
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

export default transporter;
