import pool from "../config/db.js";

export async function getPlaylistsByUser(userId) {
  const [rows] = await pool.execute(
    "SELECT id, title, user_id, created_at FROM playlists WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows;
}

export async function getPlaylistById(id) {
  const [rows] = await pool.execute("SELECT id, title, user_id, created_at FROM playlists WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function createPlaylist(data) {
  const [result] = await pool.execute("INSERT INTO playlists (title, user_id) VALUES (?, ?)", [data.title, data.user_id]);
  return { id: result.insertId, ...data };
}

export async function updatePlaylist(id, data) {
  const [result] = await pool.execute("UPDATE playlists SET title = COALESCE(?, title) WHERE id = ?", [data.title || null, id]);
  return result;
}

export async function deletePlaylist(id) {
  const [result] = await pool.execute("DELETE FROM playlists WHERE id = ?", [id]);
  return result;
}

export async function getPlaylistSongs(playlistId) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.title, s.artist_id, ar.name AS artist_name, s.album_id, al.title AS album_title, s.duration, s.audio_url, s.cover_art
     FROM playlist_songs ps
     JOIN songs s ON s.id = ps.song_id
     LEFT JOIN artists ar ON ar.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE ps.playlist_id = ?
     ORDER BY ps.playlist_id, s.title ASC`,
    [playlistId],
  );
  return rows;
}

export async function addSongToPlaylist(playlistId, songId) {
  const [result] = await pool.execute(
    "INSERT IGNORE INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)",
    [playlistId, songId],
  );
  return result;
}

export async function removeSongFromPlaylist(playlistId, songId) {
  const [result] = await pool.execute(
    "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
    [playlistId, songId],
  );
  return result;
}
