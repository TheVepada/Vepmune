import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createSong, deleteSong, getSongById, getSongs, updateSong } from "../models/songModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toAudioUrl(req) {
  const uploaded = req.files?.audioFile?.[0];
  if (uploaded) return `/uploads/audio/${uploaded.filename}`;
  return req.body.audio_url || null;
}

function toCoverArt(req) {
  const uploaded = req.files?.coverArt?.[0] || req.files?.cover_art?.[0];
  if (uploaded) return `/uploads/artwork/${uploaded.filename}`;
  return req.body.cover_art || null;
}

export async function listSongs(req, res, next) {
  try {
    const songs = await getSongs({
      artist_id: req.query.artist_id,
      album_id: req.query.album_id,
      playlist_id: req.query.playlist_id,
    });
    return res.json(songs);
  } catch (error) {
    return next(error);
  }
}

export async function readSong(req, res, next) {
  try {
    const song = await getSongById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });
    return res.json(song);
  } catch (error) {
    return next(error);
  }
}

export async function createSongHandler(req, res, next) {
  try {
    if (!req.body.title || !req.body.artist_id) {
      return res.status(400).json({ message: "title and artist_id are required" });
    }

    const song = await createSong({
      title: req.body.title,
      artist_id: req.body.artist_id,
      album_id: req.body.album_id || null,
      duration: req.body.duration || null,
      audio_url: toAudioUrl(req),
      cover_art: toCoverArt(req),
    });

    return res.status(201).json(song);
  } catch (error) {
    return next(error);
  }
}

export async function updateSongHandler(req, res, next) {
  try {
    const result = await updateSong(req.params.id, {
      ...req.body,
      audio_url: toAudioUrl(req),
      cover_art: toCoverArt(req),
    });
    if (!result.affectedRows) return res.status(404).json({ message: "Song not found" });
    return res.json({ message: "Song updated" });
  } catch (error) {
    return next(error);
  }
}

export async function deleteSongHandler(req, res, next) {
  try {
    const result = await deleteSong(req.params.id);
    if (!result.affectedRows) return res.status(404).json({ message: "Song not found" });
    return res.json({ message: "Song deleted" });
  } catch (error) {
    return next(error);
  }
}

export async function streamSong(req, res, next) {
  try {
    const song = await getSongById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    if (!song.audio_url) {
      return res.status(404).json({ message: "Audio file not available" });
    }

    if (song.audio_url.startsWith("http://") || song.audio_url.startsWith("https://")) {
      return res.redirect(song.audio_url);
    }

    const filePath = path.join(__dirname, "..", song.audio_url.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Audio file missing" });
    }

    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
}
