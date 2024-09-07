import prisma from "../lib/prisma.js";

export const getRequests = async (req, res) => {
  const { searchQuery, city, state, minBudget, maxBudget, type, property } = req.query;

  try {
    const requests = await prisma.request.findMany({
      where: {
        OR: searchQuery
          ? [
              {
                address: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
              {
                city: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
              {
                state: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
              {
                type: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
            ]
          : undefined,
        city: city
          ? {
              contains: city,
              mode: "insensitive",
            }
          : undefined,
        state: state
          ? {
              contains: state,
              mode: "insensitive",
            }
          : undefined,
        budget: {
          gte: minBudget ? parseFloat(minBudget) : undefined,
          lte: maxBudget ? parseFloat(maxBudget) : undefined,
        },
        type: type ? { equals: type } : undefined,
        property: property ? { equals: property } : undefined,
      },
      include: {
        requestDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(200).json(requests);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get requests" });
  }
};


export const getAllRequests = async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      include: {
        requestDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });
    res.status(200).json(requests);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get requests" });
  }
};

export const getRequest = async (req, res) => {
  const id = req.params.id;
  try {
    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        requestDetail: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found!" });
    }

    res.status(200).json(request);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get request" });
  }
};

export const getUserRequests = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const requests = await prisma.request.findMany({
      where: {
        userId: tokenUserId,
      },
    });

    res.status(200).json(requests);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user requests" });
  }
};

export const addRequest = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUserId },
    });

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    const newRequest = await prisma.request.create({
      data: {
        ...body,
        userId: tokenUserId,
        requestDetail: {
          create: body.requestDetail,
        },
      },
    });
    res.status(200).json(newRequest);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create request" });
  }
};

export const updateRequest = async (req, res) => {
  const id = req.params.id;
  const body = req.body;

  try {
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        ...body,
        requestDetail: {
          update: body.requestDetail,
        },
      },
    });
    res.status(200).json(updatedRequest);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update request" });
  }
};

export const deleteRequest = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        requestDetail: true,
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found!" });
    }

    if (request.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }
    if (request.requestDetail) {
      await prisma.requestDetail.delete({
        where: { id: request.requestDetail.id },
      });
    }

    await prisma.request.delete({
      where: { id },
    });

    res.status(200).json({ message: "Request deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete request" });
  }
};
