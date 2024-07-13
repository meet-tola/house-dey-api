import express from 'express';
import authRoute from './routes/auth.route.js';
import listingRoute from './routes/listing.route.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());

app.use('/api/listings', listingRoute);
app.use('/api/auth', authRoute);

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
