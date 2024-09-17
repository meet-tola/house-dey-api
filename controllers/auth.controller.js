import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import prisma from "../lib/prisma.js";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../email/emailService.js";
import axios from 'axios';

export const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        verificationToken,
        verified: false,
      },
    });

    // Send verification email
    await sendVerificationEmail(
      newUser.email,
      newUser.username,
      verificationToken
    );

    res
      .status(201)
      .send(
        "User registered successfully. Please check your email to verify your account."
      );
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Error registering user");
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification link." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null,
      },
    });

    const jwtToken = jwt.sign(
      { id: updatedUser.id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    if (user.role === "AGENT") {
      const notification = {
        message: "Welcome to HouseDey, update your profile.",
        description:
          "You have signed up as an agent, kindly please update your profile for better visibility.",
        type: "profile",
        userId: user.id,
      };

      await prisma.notification.create({
        data: notification,
      });

      const backendURL =
        process.env.NODE_ENV === "production"
          ? process.env.NOTIFICATION_SOCKET_URL
          : "http://localhost:4000";

      await axios.post(`${backendURL}/emitNotification`, {
        userId: user.id, 
        notification,
      });
    }

    res.status(200).json({
      message: "Email verified successfully!",
      user: updatedUser,
      token: jwtToken,
    });
  } catch (error) {
    console.error("Email verification failed:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return res.status(401).json({ message: "Invalid Credentials" });
    if (!user.verified)
      return res
        .status(401)
        .json({ message: "Please verify your email before logging in." });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid Credentials" });

    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: age,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      maxAge: age,
      sameSite: "None",
      secure: isProduction,
      domain: isProduction ? ".house-dey.ng" : "localhost",
    };

    res
      .cookie("token", token, cookieOptions)
      .json({ message: "Login Successful", user, token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const logout = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY);

    res.clearCookie("token").status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout failed:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const checkAuth = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Failed to check auth:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = uuidv4();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiration: new Date(Date.now() + 3600000),
      },
    });

    // Send password reset email
    await sendResetPasswordEmail(user.email, user.username, resetToken);

    res
      .status(200)
      .json({ message: "Password reset link has been sent to your email." });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({ message: "Error requesting password reset" });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiration: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiration: null,
      },
    });

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
