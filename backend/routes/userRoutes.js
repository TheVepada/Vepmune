import { Router } from "express";
import { getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/:id", authenticateToken, getUserProfile);
router.put("/:id", authenticateToken, updateUserProfile);

export default router;
