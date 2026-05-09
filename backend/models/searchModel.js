import pool from "../config/db.js";

export async function searchAll(term) {
  const like = `%${term}%`;
  const [rows] = await pool.execute(
    `SELECT 'song' AS type, id, title AS name, NULL AS subtitle FROM songs WHERE title LIKE ?
     UNION ALL
     SELECT 'album' AS type, id, title AS name, NULL AS subtitle FROM albums WHERE title LIKE ?
     UNION ALL
     SELECT 'artist' AS type, id, name, bio AS subtitle FROM artists WHERE name LIKE ?
     ORDER BY type, name`,
    [like, like, like],
  );
  return rows;
}
