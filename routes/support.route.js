import express from "express";
import { submitSupportRequest } from "../controllers/supportController.js";

const router = express.Router();

router.post("/support", submitSupportRequest);

export default router;
