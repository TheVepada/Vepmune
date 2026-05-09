import bcrypt from "bcryptjs";
import pool from "../config/db.js";

async function seed() {
  const password = await bcrypt.hash("Password123!", 12);

  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  await pool.query("DELETE FROM playlist_songs");
  await pool.query("DELETE FROM playlists");
  await pool.query("DELETE FROM songs");
  await pool.query("DELETE FROM albums");
  await pool.query("DELETE FROM artists");
  await pool.query("DELETE FROM users");
  await pool.query("ALTER TABLE playlist_songs AUTO_INCREMENT = 1").catch(() => {});
  await pool.query("ALTER TABLE playlists AUTO_INCREMENT = 1").catch(() => {});
  await pool.query("ALTER TABLE songs AUTO_INCREMENT = 1").catch(() => {});
  await pool.query("ALTER TABLE albums AUTO_INCREMENT = 1").catch(() => {});
  await pool.query("ALTER TABLE artists AUTO_INCREMENT = 1").catch(() => {});
  await pool.query("ALTER TABLE users AUTO_INCREMENT = 1").catch(() => {});
  await pool.query("SET FOREIGN_KEY_CHECKS = 1");

  const [user] = await pool.execute(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    ["vepmune", "admin@vepmune.com", password],
  );

  const [artist1] = await pool.execute("INSERT INTO artists (name, bio) VALUES (?, ?)", ["The Weeknd", "Canadian singer, songwriter, and record producer."]);
  const [artist2] = await pool.execute("INSERT INTO artists (name, bio) VALUES (?, ?)", ["Tame Impala", "Psychedelic music project by Kevin Parker."]);

  const [album1] = await pool.execute("INSERT INTO albums (title, artist_id, release_date, cover_art) VALUES (?, ?, ?, ?)", ["My Dear Melancholy", artist1.insertId, "2018-03-30", "https://placehold.co/600x600/1a0a1a/ffffff?text=My+Dear+Melancholy"]);
  const [album2] = await pool.execute("INSERT INTO albums (title, artist_id, release_date, cover_art) VALUES (?, ?, ?, ?)", ["Currents", artist2.insertId, "2015-07-17", "https://placehold.co/600x600/2a1a4a/ffffff?text=Currents"]);

  const [song1] = await pool.execute(
    "INSERT INTO songs (title, artist_id, album_id, duration, audio_url, cover_art) VALUES (?, ?, ?, ?, ?, ?)",
    ["Call Out My Name", artist1.insertId, album1.insertId, 224, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "https://placehold.co/600x600/1a0a1a/ffffff?text=The+Weeknd"],
  );

  const [song2] = await pool.execute(
    "INSERT INTO songs (title, artist_id, album_id, duration, audio_url, cover_art) VALUES (?, ?, ?, ?, ?, ?)",
    ["Let It Happen", artist2.insertId, album2.insertId, 476, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", "https://placehold.co/600x600/2a1a4a/ffffff?text=Tame+Impala"],
  );

  const [playlist] = await pool.execute("INSERT INTO playlists (title, user_id) VALUES (?, ?)", ["Favorites", user.insertId]);
  await pool.execute("INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?), (?, ?)", [playlist.insertId, song1.insertId, playlist.insertId, song2.insertId]);

  console.log("Seed completed successfully.");
  await pool.end();
}

seed().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
