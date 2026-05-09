import { Router } from "express";
import { createArtistHandler, deleteArtistHandler, listArtists, readArtist, updateArtistHandler } from "../controllers/artistController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/", listArtists);
router.get("/:id", readArtist);
router.post("/", authenticateToken, createArtistHandler);
router.put("/:id", authenticateToken, updateArtistHandler);
router.delete("/:id", authenticateToken, deleteArtistHandler);

export default router;
