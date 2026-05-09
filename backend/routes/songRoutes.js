import { Router } from "express";
import { createSongHandler, deleteSongHandler, listSongs, readSong, streamSong, updateSongHandler } from "../controllers/songController.js";
import { authenticateToken } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listSongs);
router.get("/:id", readSong);
router.get("/:id/stream", authenticateToken, streamSong);
router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "coverArt", maxCount: 1 },
    { name: "cover_art", maxCount: 1 },
  ]),
  createSongHandler,
);
router.put(
  "/:id",
  authenticateToken,
  upload.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "coverArt", maxCount: 1 },
    { name: "cover_art", maxCount: 1 },
  ]),
  updateSongHandler,
);
router.delete("/:id", authenticateToken, deleteSongHandler);

export default router;
