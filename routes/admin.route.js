import express from "express";
import {
  getAllAgents,
  getSpecificUser,
  updateAgentVerificationStatus,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/agents", verifyToken, getAllAgents);
router.get("/user/:id", verifyToken, getSpecificUser);
router.put("/verification/:id", verifyToken, updateAgentVerificationStatus);

export default router;
