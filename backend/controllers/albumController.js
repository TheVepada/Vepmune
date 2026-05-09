import { createAlbum, deleteAlbum, getAllAlbums, getAlbumById, updateAlbum } from "../models/albumModel.js";

function extractCoverArt(req) {
  const uploaded = req.files?.coverArt?.[0] || req.files?.cover_art?.[0];
  if (uploaded) return `/uploads/artwork/${uploaded.filename}`;
  return req.body.cover_art || null;
}

export async function listAlbums(req, res, next) {
  try {
    return res.json(await getAllAlbums());
  } catch (error) {
    return next(error);
  }
}

export async function readAlbum(req, res, next) {
  try {
    const album = await getAlbumById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found" });
    return res.json(album);
  } catch (error) {
    return next(error);
  }
}

export async function createAlbumHandler(req, res, next) {
  try {
    if (!req.body.title || !req.body.artist_id) {
      return res.status(400).json({ message: "title and artist_id are required" });
    }

    return res.status(201).json(
      await createAlbum({
        title: req.body.title,
        artist_id: req.body.artist_id,
        release_date: req.body.release_date,
        cover_art: extractCoverArt(req),
      }),
    );
  } catch (error) {
    return next(error);
  }
}

export async function updateAlbumHandler(req, res, next) {
  try {
    const result = await updateAlbum(req.params.id, {
      ...req.body,
      cover_art: extractCoverArt(req),
    });
    if (!result.affectedRows) return res.status(404).json({ message: "Album not found" });
    return res.json({ message: "Album updated" });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAlbumHandler(req, res, next) {
  try {
    const result = await deleteAlbum(req.params.id);
    if (!result.affectedRows) return res.status(404).json({ message: "Album not found" });
    return res.json({ message: "Album deleted" });
  } catch (error) {
    return next(error);
  }
}
