import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "..", "uploads");
const audioDir = path.join(uploadsRoot, "audio");
const artworkDir = path.join(uploadsRoot, "artwork");

[uploadsRoot, audioDir, artworkDir].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.fieldname === "audioFile") return cb(null, audioDir);
    return cb(null, artworkDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

function fileFilter(req, file, cb) {
  const audioTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];
  const imageTypes = ["image/jpeg", "image/png", "image/webp"];
  if (file.fieldname === "audioFile" && audioTypes.includes(file.mimetype)) return cb(null, true);
  if (file.fieldname === "coverArt" && imageTypes.includes(file.mimetype)) return cb(null, true);
  if (file.fieldname === "cover_art" && imageTypes.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("Unsupported file type"));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});
