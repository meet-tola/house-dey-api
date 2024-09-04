import prisma from "../lib/prisma.js";

export const getNotifications = async (req, res) => {
    const tokenUserId = req.userId;
  
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: tokenUserId,
        },
        include: {
          post: true, // Include post details if needed
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
  
      res.status(200).json(notifications);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  };
  