import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import axios from "axios";
import { sendIDVerificationEmail } from "../email/emailService.js";

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get users!" });
  }
};

export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user!" });
  }
};

export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }
  const {
    password,
    avatar,
    fullName,
    mobile,
    street,
    locality,
    state,
    country,
    ...inputs
  } = req.body;

  let updatedPassword = null;
  try {
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(updatedPassword && { password: updatedPassword }),
        avatar: avatar !== undefined ? avatar : undefined,
        ...(fullName && { fullName }),
        ...(mobile && { mobile }),
        ...(street && { street }),
        ...(locality && { locality }),
        ...(state && { state }),
        ...(country && { country }),
      },
    });

    const { password: userPassword, ...rest } = updatedUser;

    res.status(200).json(rest);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update user!" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    await prisma.notification.deleteMany({
      where: { userId: id },
    });
    
    await prisma.post.deleteMany({
      where: { userId: id },
    });

    await prisma.savedPost.deleteMany({
      where: { userId: id },
    });

    await prisma.chat.deleteMany({
      where: { userId: id },
    });

    await prisma.review.deleteMany({
      where: { userId: id },
    });
    
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};

export const getUserWithRoleAgent = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const tokenUser = await prisma.user.findUnique({
      where: { id: tokenUserId },
    });

    if (!tokenUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Fetch users with the role "AGENT"
    const users = await prisma.user.findMany({
      where: {
        role: "AGENT",
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        fullName: true,
      },
    });

    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get users!" });
  }
};

export const getAgentWithPosts = async (req, res) => {
  const tokenUserId = req.userId;
  const agentUsername = req.params.username;

  try {
    const tokenUser = await prisma.user.findUnique({
      where: { id: tokenUserId },
    });

    if (!tokenUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    const agent = await prisma.user.findUnique({
      where: {
        username: agentUsername, // Search by username
        role: "AGENT",
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        fullName: true,
        mobile: true,
        locality: true,
        post: {
          select: {
            id: true,
            title: true,
            images: true,
            address: true,
            property: true,
            type: true,
            price: true,
          },
        },
      },
    });

    if (!agent) {
      return res
        .status(404)
        .json({ message: "Agent not found or not an agent!" });
    }

    res.status(200).json(agent);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get agent and posts!" });
  }
};

export const verifyAgentId = async (req, res) => {
  const { userId, imageUrl } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "AGENT") {
      return res.status(403).json({ message: "User is not an agent" });
    }

    const verificationData = {
      verificationImage: imageUrl || null,
      verificationStatus: imageUrl ? "pending" : user.verificationStatus,
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: verificationData,
    });

    const notification = {
      message: "ID Verification Uploaded",
      description:
        "Your ID verification document has been successfully uploaded. It is pending review and you will receive an update within 24 hours.",
      type: "id",
      userId: user.id,
    };

    await sendIDVerificationEmail(updatedUser.email, updatedUser.username);

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

    res.status(200).json({
      message: "Agent ID verification is pending",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error verifying agent ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
