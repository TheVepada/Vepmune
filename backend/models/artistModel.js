import pool from "../config/db.js";

export async function getAllArtists() {
  const [rows] = await pool.execute("SELECT id, name, bio FROM artists ORDER BY name ASC");
  return rows;
}

export async function getArtistById(id) {
  const [rows] = await pool.execute("SELECT id, name, bio FROM artists WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function createArtist(data) {
  const [result] = await pool.execute("INSERT INTO artists (name, bio) VALUES (?, ?)", [data.name, data.bio || null]);
  return { id: result.insertId, ...data };
}

export async function updateArtist(id, data) {
  const [result] = await pool.execute("UPDATE artists SET name = COALESCE(?, name), bio = COALESCE(?, bio) WHERE id = ?", [data.name || null, data.bio || null, id]);
  return result;
}

export async function deleteArtist(id) {
  const [result] = await pool.execute("DELETE FROM artists WHERE id = ?", [id]);
  return result;
}
