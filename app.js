import express from "express";
import cors from "cors";
import authRoute from "./routes/auth.route.js";
import postRoute from "./routes/post.route.js";
import requestRoute from "./routes/request.route.js";
import notificationRoute from "./routes/notification.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";
import supportRoute from "./routes/support.route.js";
import reviewRoute from "./routes/review.route.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://www.housedey.com.ng"]
    : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/requests", requestRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);
app.use("/api/customer", supportRoute);
app.use("/api/reviews", reviewRoute);

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
