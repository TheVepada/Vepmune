import { Router } from "express";

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import artistRoutes from "./artistRoutes.js";
import albumRoutes from "./albumRoutes.js";
import songRoutes from "./songRoutes.js";
import playlistRoutes from "./playlistRoutes.js";
import searchRoutes from "./searchRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/artists", artistRoutes);
router.use("/albums", albumRoutes);
router.use("/songs", songRoutes);
router.use("/playlists", playlistRoutes);
router.use("/search", searchRoutes);

export default router;
