import express from "express";
import { getNotifications } from "../controllers/notification.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, getNotifications);

export default router;
