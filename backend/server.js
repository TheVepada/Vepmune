import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "VepMune API" });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VepMune API listening on port ${PORT}`);
});
