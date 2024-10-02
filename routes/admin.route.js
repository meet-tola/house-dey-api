import express from "express";
import {
  getAllAgents,
  getSpecificUser,
  updateAgentVerificationStatus,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/agents", getAllAgents);
router.get("/user/:id", getSpecificUser);
router.put("/verification/:id", updateAgentVerificationStatus);

export default router;
