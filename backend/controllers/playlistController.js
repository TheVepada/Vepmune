import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getPlaylistSongs,
  getPlaylistsByUser,
  removeSongFromPlaylist,
  updatePlaylist,
} from "../models/playlistModel.js";

export async function listPlaylists(req, res, next) {
  try {
    return res.json(await getPlaylistsByUser(req.user.id));
  } catch (error) {
    return next(error);
  }
}

export async function readPlaylist(req, res, next) {
  try {
    const playlist = await getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (Number(playlist.user_id) !== Number(req.user.id)) return res.status(403).json({ message: "Forbidden" });
    const songs = await getPlaylistSongs(req.params.id);
    return res.json({ ...playlist, songs });
  } catch (error) {
    return next(error);
  }
}

export async function createPlaylistHandler(req, res, next) {
  try {
    if (!req.body.title) return res.status(400).json({ message: "title is required" });
    return res.status(201).json(await createPlaylist({ title: req.body.title, user_id: req.user.id }));
  } catch (error) {
    return next(error);
  }
}

export async function updatePlaylistHandler(req, res, next) {
  try {
    const playlist = await getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (Number(playlist.user_id) !== Number(req.user.id)) return res.status(403).json({ message: "Forbidden" });
    const result = await updatePlaylist(req.params.id, req.body);
    if (!result.affectedRows) return res.status(400).json({ message: "No changes made" });
    return res.json({ message: "Playlist updated" });
  } catch (error) {
    return next(error);
  }
}

export async function deletePlaylistHandler(req, res, next) {
  try {
    const playlist = await getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (Number(playlist.user_id) !== Number(req.user.id)) return res.status(403).json({ message: "Forbidden" });
    const result = await deletePlaylist(req.params.id);
    if (!result.affectedRows) return res.status(404).json({ message: "Playlist not found" });
    return res.json({ message: "Playlist deleted" });
  } catch (error) {
    return next(error);
  }
}

export async function addSongHandler(req, res, next) {
  try {
    const playlist = await getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (Number(playlist.user_id) !== Number(req.user.id)) return res.status(403).json({ message: "Forbidden" });
    if (!req.body.song_id) return res.status(400).json({ message: "song_id is required" });
    await addSongToPlaylist(req.params.id, req.body.song_id);
    return res.status(201).json({ message: "Song added to playlist" });
  } catch (error) {
    return next(error);
  }
}

export async function removeSongHandler(req, res, next) {
  try {
    const playlist = await getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (Number(playlist.user_id) !== Number(req.user.id)) return res.status(403).json({ message: "Forbidden" });
    await removeSongFromPlaylist(req.params.id, req.params.songId);
    return res.json({ message: "Song removed from playlist" });
  } catch (error) {
    return next(error);
  }
}
