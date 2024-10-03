import express from "express";
import {
  getPosts,
  getAllPosts,
  getFeaturedPosts,
  getPost,
  getUserPosts,
  addPost,
  updatePost,
  deletePost,
  savePost,
  getSavedPosts,
} from "../controllers/post.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/all", getAllPosts);
router.get("/featured", getFeaturedPosts);
router.get("/saved", verifyToken, getSavedPosts);
router.get("/:id", getPost);
router.post("/", verifyToken, addPost);
router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);
router.post("/save", verifyToken, savePost);
router.get("/user/posts", verifyToken, getUserPosts);

export default router;
