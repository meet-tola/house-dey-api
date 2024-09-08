import express from "express";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  profilePosts,
  getUserWithRoleAgent,
  getAgentWithPosts
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/agents", verifyToken, getUserWithRoleAgent); 
router.get("/agent/:id", verifyToken, getAgentWithPosts); 
router.get("/:id", verifyToken, getUser); 
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);
router.get("/profilePosts", verifyToken, profilePosts);

export default router;
