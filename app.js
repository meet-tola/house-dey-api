import express from 'express';
import cors from "cors";
import authRoute from './routes/auth.route.js';
import listingRoute from './routes/listing.route.js';
import userRoute from './routes/user.route.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

app.use('/api/listings', listingRoute);
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute)
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
