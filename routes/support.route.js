import express from "express";
import { submitSupportRequest } from "../controllers/support.controller.js";

const router = express.Router();

router.post("/support", submitSupportRequest);

export default router;
