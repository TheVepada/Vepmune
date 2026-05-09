import pool from "../config/db.js";

export async function createUser({ username, email, password }) {
  const [result] = await pool.execute(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password],
  );
  return { id: result.insertId, username, email };
}

export async function findUserByEmailOrUsername(identifier) {
  const [rows] = await pool.execute(
    "SELECT id, username, email, password, created_at FROM users WHERE email = ? OR username = ? LIMIT 1",
    [identifier, identifier],
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    "SELECT id, username, email, created_at FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] || null;
}

export async function updateUser(id, data) {
  const fields = [];
  const values = [];
  if (data.username) {
    fields.push("username = ?");
    values.push(data.username);
  }
  if (data.email) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.password) {
    fields.push("password = ?");
    values.push(data.password);
  }
  if (!fields.length) return { affectedRows: 0 };
  values.push(id);
  const [result] = await pool.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
  return result;
}
