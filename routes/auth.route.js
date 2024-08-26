import express from 'express';
import { register, login, logout, checkAuth, verifyEmail } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/checkAuth', checkAuth);
router.get('/verify/:token', verifyEmail);
export default router;
