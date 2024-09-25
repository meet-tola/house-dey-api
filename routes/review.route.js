import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getReviewsByAgent,
  getReviewsByUser,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";

const router = express.Router();

// Get all reviews for an agent by agentId
router.get("/agent/:agentId", getReviewsByAgent);

// Get all reviews created by a user by userId
router.get("/user/:userId", verifyToken, getReviewsByUser);

// Create a review for an agent
router.post("/", verifyToken, createReview);

// Update a review by reviewId
router.put("/:reviewId", verifyToken, updateReview);

// Delete a review by reviewId
router.delete("/:reviewId", verifyToken, deleteReview);

export default router;
