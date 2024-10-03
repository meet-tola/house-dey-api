import prisma from "../lib/prisma.js";

export const getNotifications = async (req, res) => {
    const tokenUserId = req.userId;
  
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: tokenUserId,
        },
        include: {
          post: true,
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
  
  export const deleteNotification = async (req, res) => {
    const notificationId = req.params.id;
    const tokenUserId = req.userId; 
  
    try {
      const notification = await prisma.notification.findUnique({
        where: {
          id: notificationId,
        },
      });
  
      if (!notification || notification.userId !== tokenUserId) {
        return res.status(404).json({ message: "Notification not found or unauthorized" });
      }
  
      await prisma.notification.delete({
        where: {
          id: notificationId,
        },
      });
  
      res.status(200).json({ message: "Notification deleted successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  };
  