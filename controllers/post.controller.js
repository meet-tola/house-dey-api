import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import { sendRequestEmail } from "../email/emailService.js";

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        address: query.address
          ? {
              contains: query.address,
              mode: "insensitive",
            }
          : undefined,
        city: query.city
          ? {
              contains: query.city,
              mode: "insensitive",
            }
          : undefined,
        type: query.type
          ? {
              equals: query.type,
            }
          : undefined,
        property: query.property
          ? {
              equals: query.property,
            }
          : undefined,
        bedroom: query.bedrooms ? parseInt(query.bedrooms) : undefined,
        bathroom: query.bathrooms ? parseInt(query.bathrooms) : undefined,
        price: {
          gte: query.minPrice ? parseInt(query.minPrice) : undefined,
          lte: query.maxPrice ? parseInt(query.maxPrice) : undefined,
        },
      },
    });

    const token = req.cookies?.token;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (!err) {
          // Check if the user has saved each post
          const postsWithSaveStatus = await Promise.all(
            posts.map(async (post) => {
              const saved = await prisma.savedPost.findUnique({
                where: {
                  userId_postId: {
                    postId: post.id,
                    userId: payload.id,
                  },
                },
              });
              return { ...post, isSaved: !!saved };
            })
          );

          return res.status(200).json(postsWithSaveStatus);
        } else {
          return res.status(200).json(
            posts.map((post) => ({
              ...post,
              isSaved: false,
            }))
          );
        }
      });
    } else {
      return res.status(200).json(
        posts.map((post) => ({
          ...post,
          isSaved: false,
        }))
      );
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });
    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};

export const getFeaturedPosts = async (req, res) => {
  try {
    const featuredPosts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(200).json(featuredPosts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get featured posts" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    const token = req.cookies?.token;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (!err) {
          const saved = await prisma.savedPost.findUnique({
            where: {
              userId_postId: {
                postId: id,
                userId: payload.id,
              },
            },
          });
          return res
            .status(200)
            .json({ ...post, isSaved: saved ? true : false });
        }
      });
    } else {
      return res.status(200).json({ ...post, isSaved: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

export const getUserPosts = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: tokenUserId,
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user posts" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;
  const requestId = req.query.requestId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUserId },
    });

    if (!user || user.role !== "AGENT") {
      return res.status(403).json({ message: "Only agents can create posts" });
    }

    const newPost = await prisma.post.create({
      data: {
        ...body,
        userId: tokenUserId,
        postDetail: {
          create: body.postDetail,
        },
      },
    });

    if (requestId && requestId !== "null") {
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        select: { userId: true },
      });

      if (request) {
        await sendRequestEmail(user.email, user.username, newPost.id);

        const notification = {
          message: `New listing for your request: ${newPost.title}`,
          description:
            "The house properties you were looking for is now available. Click on the notification to view.",
          type: "listing",
          userId: request.userId,
          postId: newPost.id,
        };

        await prisma.notification.create({
          data: notification,
        });

        const backendURL =
          process.env.NODE_ENV === "production"
            ? process.env.NOTIFICATION_SOCKET_URL
            : "http://localhost:4000";

        await axios.post(`${backendURL}/emitNotification`, {
          userId: request.userId,
          notification,
        });
      }
    }

    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const body = req.body;

  try {
    const postToUpdate = await prisma.post.findUnique({
      where: { id },
    });

    if (!postToUpdate) {
      return res.status(404).json({ message: "Post not found!" });
    }

    if (postToUpdate.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...body,
        postDetail: {
          update: body.postDetail,
        },
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to edit posts" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        savedPost: true,
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorised!" });
    }

    if (post.savedPost.length > 0) {
      await prisma.savedPost.deleteMany({
        where: { postId: id },
      });
    }

    if (post.postDetail) {
      await prisma.postDetail.delete({
        where: { id: post.postDetail.id },
      });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  try {
    const savePost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (savePost) {
      await prisma.savedPost.delete({
        where: {
          id: savePost.id,
        },
      });
      return res.status(200).json({ message: "Post removed from save list" });
    } else {
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });
      return res.status(200).json({ message: "Post saved" });
    }
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ message: "Failed to save post backend" });
  }
};

export const getSavedPosts = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: {
        userId: tokenUserId,
      },
      include: {
        post: {
          include: {
            postDetail: true,
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const posts = savedPosts.map((savedPost) => savedPost.post);

    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get saved posts" });
  }
};
