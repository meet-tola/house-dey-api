import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city
          ? {
              contains: query.city,
              mode: "insensitive",
            }
          : undefined,
        type: query.type
          ? {
              contains: query.type,
              mode: "insensitive",
            }
          : undefined,
        property: query.property
          ? {
              contains: query.property,
              mode: "insensitive",
            }
          : undefined,
        bedroom: parseInt(query.bedrooms) || undefined,
        bathroom: parseInt(query.bathrooms) || undefined,
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
    });

    let userId;
    const token = req.cookies?.token; // Use 'req.cookies' to get the token

    if (!token) {
      userId = null;
    } else {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) {
          userId = null;
        } else {
          userId = payload.id;
        }

        const saved = await prisma.savedPost.findUnique({
          where: {
            userId_postId: {
              postId: id,
              userId,
            },
          },
        });

        res.status(200).json({ ...posts, isSaved: saved ? true : false });
      });
    }

    // If no token was provided or verification failed
    if (!userId) {
      res.status(200).json({ ...posts, isSaved: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get posts" });
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
            username: true,
            avatar: true,
          },
        },
      },
    });

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
          res.status(200).json({ ...post, isSaved: saved ? true : false });
        }
      });
    }
    res.status(200).json({ ...post, isSaved: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    // Fetch the user to check their role
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
    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    res.status(200).json();
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
    });

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorised!" });
    }

    await prisma.post.delete({
      where: { id },
    });
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete posts" });
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
    res.status(500).json({ message: "Failed to save post" });
  }
};


