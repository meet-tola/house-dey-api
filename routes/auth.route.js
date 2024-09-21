import express from "express";
import {
  register,
  login,
  logout,
  checkAuth,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/checkAuth", checkAuth);
router.post("/verify", verifyEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
export default router;
