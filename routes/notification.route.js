import express from "express";
import { getNotifications, deleteNotification } from "../controllers/notification.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.delete("/:id", verifyToken, deleteNotification);


export default router;
