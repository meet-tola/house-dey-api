import express from "express";
import {
  loginAdmin,
  getAllAgents,
  getSpecificUser,
  updateAgentVerificationStatus,
} from "../controllers/admin.controller.js";
import { adminToken } from "../middleware/adminToken.js";

const router = express.Router();

router.post("/login", loginAdmin);

router.get("/agents", adminToken, getAllAgents);
router.get("/user/:id", adminToken, getSpecificUser);
router.put("/verification/:id", adminToken, updateAgentVerificationStatus);

export default router;
