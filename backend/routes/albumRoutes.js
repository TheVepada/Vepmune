import { Router } from "express";
import { createAlbumHandler, deleteAlbumHandler, listAlbums, readAlbum, updateAlbumHandler } from "../controllers/albumController.js";
import { authenticateToken } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listAlbums);
router.get("/:id", readAlbum);
router.post("/", authenticateToken, upload.fields([{ name: "coverArt", maxCount: 1 }, { name: "cover_art", maxCount: 1 }]), createAlbumHandler);
router.put("/:id", authenticateToken, upload.fields([{ name: "coverArt", maxCount: 1 }, { name: "cover_art", maxCount: 1 }]), updateAlbumHandler);
router.delete("/:id", authenticateToken, deleteAlbumHandler);

export default router;
