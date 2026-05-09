import pool from "../config/db.js";

export async function getSongs(filters = {}) {
  let sql = `
    SELECT s.id, s.title, s.artist_id, ar.name AS artist_name, s.album_id, al.title AS album_title,
           s.duration, s.audio_url, s.cover_art
    FROM songs s
    LEFT JOIN artists ar ON ar.id = s.artist_id
    LEFT JOIN albums al ON al.id = s.album_id
  `;
  const where = [];
  const values = [];

  if (filters.artist_id) {
    where.push("s.artist_id = ?");
    values.push(filters.artist_id);
  }
  if (filters.album_id) {
    where.push("s.album_id = ?");
    values.push(filters.album_id);
  }
  if (filters.playlist_id) {
    sql += " INNER JOIN playlist_songs ps ON ps.song_id = s.id ";
    where.push("ps.playlist_id = ?");
    values.push(filters.playlist_id);
  }

  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += " ORDER BY s.title ASC";
  const [rows] = await pool.execute(sql, values);
  return rows;
}

export async function getSongById(id) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.title, s.artist_id, ar.name AS artist_name, s.album_id, al.title AS album_title,
            s.duration, s.audio_url, s.cover_art
     FROM songs s
     LEFT JOIN artists ar ON ar.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE s.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function createSong(data) {
  const [result] = await pool.execute(
    "INSERT INTO songs (title, artist_id, album_id, duration, audio_url, cover_art) VALUES (?, ?, ?, ?, ?, ?)",
    [data.title, data.artist_id, data.album_id || null, data.duration || null, data.audio_url || null, data.cover_art || null],
  );
  return { id: result.insertId, ...data };
}

export async function updateSong(id, data) {
  const [result] = await pool.execute(
    "UPDATE songs SET title = COALESCE(?, title), artist_id = COALESCE(?, artist_id), album_id = COALESCE(?, album_id), duration = COALESCE(?, duration), audio_url = COALESCE(?, audio_url), cover_art = COALESCE(?, cover_art) WHERE id = ?",
    [data.title || null, data.artist_id || null, data.album_id || null, data.duration || null, data.audio_url || null, data.cover_art || null, id],
  );
  return result;
}

export async function deleteSong(id) {
  const [result] = await pool.execute("DELETE FROM songs WHERE id = ?", [id]);
  return result;
}
