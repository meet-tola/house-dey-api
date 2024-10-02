import prisma from "../lib/prisma.js";
import { sendIDStatusEmail } from "../email/emailService.js";


export const getAllAgents = async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: {
        role: "AGENT",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        verificationStatus: true, 
      },
    });

    if (agents.length === 0) {
      return res.status(404).json({ message: "No agents found" });
    }

    res.status(200).json(agents);
  } catch (err) {
    console.error("Error fetching agents:", err);
    res.status(500).json({ message: "Failed to fetch agents" });
  }
};

// Get a specific user by ID, including name, email, and verification image
export const getSpecificUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        verificationImage: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const updateAgentVerificationStatus = async (req, res) => {
  const { id } = req.params;
  const { verificationStatus } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "AGENT") {
      return res.status(403).json({ message: "User is not an agent" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        verificationStatus,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        verificationStatus: true,
      },
    });

    await sendIDStatusEmail(updatedUser.email, updatedUser.username, verificationStatus);

    let notificationMessage = '';
    let notificationDescription = '';

    if (verificationStatus === 'approved') {
      notificationMessage = "ID Verification Approved";
      notificationDescription = "Congratulations! Your ID verification has been successfully approved.";
    } else if (verificationStatus === 'rejected') {
      notificationMessage = "ID Verification Rejected";
      notificationDescription = "Unfortunately, your ID verification was rejected. Please check the submission details and re-upload the correct document.";
    } else if (verificationStatus === 'pending') {
      notificationMessage = "ID Verification Pending";
      notificationDescription = "Your ID verification document has been uploaded and is pending review. You will receive an update within 24 hours.";
    }

    const notification = {
      message: notificationMessage,
      description: notificationDescription,
      type: "id",
      userId: user.id,
    };

    await prisma.notification.create({
      data: notification,
    });

    const backendURL =
      process.env.NODE_ENV === "production"
        ? process.env.NOTIFICATION_SOCKET_URL
        : "http://localhost:4000";

    await axios.post(`${backendURL}/emitNotification`, {
      userId: user.id,
      notification,
    });

    res.status(200).json({
      message: "Agent verification status updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating agent verification status:", err);
    res.status(500).json({ message: "Failed to update verification status" });
  }
};
