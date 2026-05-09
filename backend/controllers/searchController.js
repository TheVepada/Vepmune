import { searchAll } from "../models/searchModel.js";

export async function searchHandler(req, res, next) {
  try {
    const query = (req.query.q || "").trim();
    if (!query) return res.status(400).json({ message: "q is required" });
    return res.json(await searchAll(query));
  } catch (error) {
    return next(error);
  }
}
