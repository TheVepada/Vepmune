import { createArtist, deleteArtist, getAllArtists, getArtistById, updateArtist } from "../models/artistModel.js";

export async function listArtists(req, res, next) {
  try {
    return res.json(await getAllArtists());
  } catch (error) {
    return next(error);
  }
}

export async function readArtist(req, res, next) {
  try {
    const artist = await getArtistById(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });
    return res.json(artist);
  } catch (error) {
    return next(error);
  }
}

export async function createArtistHandler(req, res, next) {
  try {
    if (!req.body.name) return res.status(400).json({ message: "name is required" });
    return res.status(201).json(await createArtist(req.body));
  } catch (error) {
    return next(error);
  }
}

export async function updateArtistHandler(req, res, next) {
  try {
    const result = await updateArtist(req.params.id, req.body);
    if (!result.affectedRows) return res.status(404).json({ message: "Artist not found" });
    return res.json({ message: "Artist updated" });
  } catch (error) {
    return next(error);
  }
}

export async function deleteArtistHandler(req, res, next) {
  try {
    const result = await deleteArtist(req.params.id);
    if (!result.affectedRows) return res.status(404).json({ message: "Artist not found" });
    return res.json({ message: "Artist deleted" });
  } catch (error) {
    return next(error);
  }
}
