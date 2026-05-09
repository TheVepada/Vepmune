const API_BASE_URL = "http://localhost:5000/api";
const LOCAL_DATA_URL = "mockdata.json";

const FALLBACK_SONGS = [
  { title: "Call Out My Name", artist: "The Weeknd" },
  { title: "Let It Happen", artist: "Tame Impala" },
  { title: "Robbers", artist: "The 1975" },
  { title: "Sanctuary", artist: "Joji" },
];

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function loadRemoteSongs() {
  return fetchJson(`${API_BASE_URL}/songs`);
}

async function loadRemoteBrowseData() {
  const [artists, albums] = await Promise.all([
    fetchJson(`${API_BASE_URL}/artists`),
    fetchJson(`${API_BASE_URL}/albums`),
  ]);

  return { artists, albums };
}

window.VepMuneAPI = {
  apiBaseUrl: API_BASE_URL,
  fetchJson,
  loadRemoteSongs,
  loadRemoteBrowseData,
};

async function loadSongs() {
  const list = document.getElementById("songList");
  if (!list) return;

  let songs = [];

  // Try backend first, then local mock data, then hardcoded fallback.
  try {
    songs = await loadRemoteSongs();
  } catch {
    try {
      const localRes = await fetch(LOCAL_DATA_URL);
      if (!localRes.ok) throw new Error(`Local data request failed: ${localRes.status}`);
      const localData = await localRes.json();
      songs = Array.isArray(localData.songs) ? localData.songs : [];
    } catch {
      songs = FALLBACK_SONGS;
    }
  }

  list.innerHTML = "";
  songs.forEach((song) => {
    const li = document.createElement("li");
    const artist = song.artist_name || song.artist || song.artistName || "Unknown artist";
    li.textContent = `${song.title} - ${artist}`;
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", loadSongs);