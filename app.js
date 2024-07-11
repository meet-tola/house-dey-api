import express from 'express';
import session from 'express-session';
import passport from 'passport';
import authRoute from './routes/auth.route.js';
import listingRoute from './routes/listing.route.js';
import dotenv from 'dotenv';

dotenv.config(); 

const app = express();

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/listings', listingRoute);
app.use('/api/auth', authRoute);

app.listen(8800, () => {
  console.log('Server is running');
});
