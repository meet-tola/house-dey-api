import prisma from "../lib/prisma.js";

export const addMessage = async (req, res) => {
  const tokenUserId = req.userId;
  const { text } = req.body;
  const chatId = req.params.chatId;

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    const message = await prisma.message.create({
      data: {
        chatId: chatId,
        userId: tokenUserId,
        text: text,
        userIDs: chat.userIDs,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessage: text },
    });

    res.status(200).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to send message!" });
  }
};
