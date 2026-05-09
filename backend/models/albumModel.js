import pool from "../config/db.js";

export async function getAllAlbums() {
  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.artist_id, ar.name AS artist_name, a.release_date, a.cover_art
     FROM albums a
     LEFT JOIN artists ar ON ar.id = a.artist_id
     ORDER BY a.release_date DESC, a.title ASC`,
  );
  return rows;
}

export async function getAlbumById(id) {
  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.artist_id, ar.name AS artist_name, a.release_date, a.cover_art
     FROM albums a
     LEFT JOIN artists ar ON ar.id = a.artist_id
     WHERE a.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function createAlbum(data) {
  const [result] = await pool.execute(
    "INSERT INTO albums (title, artist_id, release_date, cover_art) VALUES (?, ?, ?, ?)",
    [data.title, data.artist_id, data.release_date || null, data.cover_art || null],
  );
  return { id: result.insertId, ...data };
}

export async function updateAlbum(id, data) {
  const [result] = await pool.execute(
    "UPDATE albums SET title = COALESCE(?, title), artist_id = COALESCE(?, artist_id), release_date = COALESCE(?, release_date), cover_art = COALESCE(?, cover_art) WHERE id = ?",
    [data.title || null, data.artist_id || null, data.release_date || null, data.cover_art || null, id],
  );
  return result;
}

export async function deleteAlbum(id) {
  const [result] = await pool.execute("DELETE FROM albums WHERE id = ?", [id]);
  return result;
}
