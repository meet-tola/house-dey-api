import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

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
    firstName,
    lastName,
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
        ...(avatar && { avatar }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
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
    await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete users!" });
  }
};

export const profilePosts = async (req, res) => {
  const tokenUserId = req.params.id;
  try {
    const userPosts = await prisma.post.findUnique({
      where: { userId: tokenUserId },
      include: {
        post: true,
      },
    });

    const savedPosts = saved.map((item) => item.post);
    res.status(200).json({ userPosts, savedPosts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user!" });
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
        firstName: true,
        lastName: true,
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
  const agentId = req.params.id;

  try {
    const tokenUser = await prisma.user.findUnique({
      where: { id: tokenUserId },
    });

    if (!tokenUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    const agent = await prisma.user.findUnique({
      where: {
        id: agentId,
        role: "AGENT",
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        firstName: true,
        lastName: true,
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
