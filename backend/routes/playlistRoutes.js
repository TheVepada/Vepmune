import { Router } from "express";
import {
  addSongHandler,
  createPlaylistHandler,
  deletePlaylistHandler,
  listPlaylists,
  readPlaylist,
  removeSongHandler,
  updatePlaylistHandler,
} from "../controllers/playlistController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, listPlaylists);
router.get("/:id", authenticateToken, readPlaylist);
router.post("/", authenticateToken, createPlaylistHandler);
router.put("/:id", authenticateToken, updatePlaylistHandler);
router.delete("/:id", authenticateToken, deletePlaylistHandler);
router.post("/:id/songs", authenticateToken, addSongHandler);
router.delete("/:id/songs/:songId", authenticateToken, removeSongHandler);

export default router;
