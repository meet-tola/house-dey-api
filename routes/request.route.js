import express from "express";
import {
  getRequests,
  getAllRequests,
  getRequest,
  getUserRequests,
  addRequest,
  updateRequest,
  deleteRequest,
} from "../controllers/request.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", getRequests);
router.get("/all", getAllRequests);
router.get("/:id", getRequest);
router.post("/", verifyToken, addRequest);
router.put("/:id", verifyToken, updateRequest);
router.delete("/:id", verifyToken, deleteRequest);
router.get("/user/requests", verifyToken, getUserRequests);

export default router;
