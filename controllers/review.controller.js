import prisma from "../lib/prisma.js";

// Get all reviews for an agent by agentId
export const getReviewsByAgent = async (req, res) => {
  const { agentId } = req.params;

  try {
    const reviews = await prisma.review.findMany({
      where: { agentId },
      select: {
        id: true,
        message: true,
        rating: true,
        createdAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    // Calculate total number of reviews and average rating
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    res.status(200).json({
      totalReviews,
      averageRating: averageRating.toFixed(2), // Round to 2 decimal places
      reviews,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get reviews!" });
  }
};

// Get all reviews created by a user
export const getReviewsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const reviews = await prisma.review.findMany({
      where: { userId },
      select: {
        id: true,
        message: true,
        rating: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    res.status(200).json(reviews);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user reviews!" });
  }
};

export const createReview = async (req, res) => {
  const { message, rating, agentId, userId } = req.body;
  try {
    const review = await prisma.review.create({
      data: {
        message,
        rating,
        agentId,
        userId,
      },
    });
    res.status(201).json(review);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create review!" });
  }
};

// Update a review by reviewId
export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { message, rating } = req.body;
  const userId = req.userId;

  try {
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview || existingReview.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this review!" });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        message,
        rating,
      },
    });

    res.status(200).json(updatedReview);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update review!" });
  }
};

export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.userId;

  try {
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview || existingReview.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this review!" });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.status(200).json({ message: "Review deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete review!" });
  }
};
