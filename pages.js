const STORAGE_KEYS = {
  lib: "vepmune_lib",
  playlists: "vepmune_playlists",
};

async function loadData() {
  let baseData = null;

  try {
    const response = await fetch("mockdata.json");
    if (!response.ok) throw new Error("Failed to fetch mockdata.json");
    baseData = await response.json();
  } catch {
    baseData = {
      user: { name: "User", avatar: "U" },
      artists: [],
      newReleases: [],
      topRecommendations: [],
      trendingPlaylists: [],
      customPlaylists: [],
    };
  }

  const api = window.VepMuneAPI;

  if (api?.fetchJson) {
    try {
      const [artists, albums] = await Promise.all([
        api.fetchJson(`${api.apiBaseUrl}/artists`),
        api.fetchJson(`${api.apiBaseUrl}/albums`),
      ]);

      return {
        ...baseData,
        artists: artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          genre: artist.bio || "Artist",
          image: artist.image || `https://placehold.co/600x600?text=${encodeURIComponent(artist.name)}`,
          followers: artist.followers || 0,
        })),
        newReleases: albums.map((album) => ({
          id: album.id,
          album: album.title,
          artist: album.artist_name || "Unknown artist",
          image: album.cover_art || `https://placehold.co/600x600?text=${encodeURIComponent(album.title)}`,
          year: album.release_date ? new Date(album.release_date).getFullYear() : "-",
          tracks: album.tracks || 0,
        })),
      };
    } catch {
      // Fall through to the local mock data.
    }
  }

  return baseData;
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return document.querySelectorAll(selector);
}

function getPageName() {
  return window.location.pathname.split("/").pop().replace(".html", "") || "index";
}

function setUser(data) {
  const welcomeName = qs("#welcomeName");
  const userAvatar = qs("#userAvatar");
  if (welcomeName) welcomeName.textContent = `Welcome, ${data.user?.name || "User"}`;
  if (userAvatar) userAvatar.textContent = data.user?.avatar || "U";
}

function playFromCard(title, artist, image) {
  if (window.VepMune?.playNow) {
    window.VepMune.playNow(title, artist, "", image || "");
  }
}

function addCardToQueue(title, artist, image, id) {
  if (window.VepMune?.addToQueue) {
    window.VepMune.addToQueue(title, artist, "", image || "", id);
  }
}

function bindCardInteractions(container) {
  if (!container) return;

  container.querySelectorAll("[data-play-title]").forEach((card) => {
    card.addEventListener("click", () => {
      playFromCard(card.dataset.playTitle || "", card.dataset.playArtist || "", card.dataset.playImage || "");
    });
  });

  container.querySelectorAll(".card-add-queue").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      addCardToQueue(
        button.dataset.title || "",
        button.dataset.artist || "",
        button.dataset.image || "",
        button.dataset.id ? Number(button.dataset.id) : undefined,
      );
    });
  });
}

function getLibraryEntries(data) {
  const savedKeys = JSON.parse(localStorage.getItem(STORAGE_KEYS.lib) || "[]");
  const catalog = [
    ...(data.topRecommendations || []).map((item) => ({ id: item.id || item.title, type: "track", title: item.title, artist: item.artist, image: item.image })),
    ...(data.newReleases || []).map((item) => ({ id: item.id || item.album, type: "album", title: item.album, artist: item.artist, image: item.image })),
    ...(data.trendingPlaylists || []).map((item) => ({ id: item.id || item.name, type: "playlist", title: item.name, artist: item.curator, image: item.image })),
    ...(data.artists || []).map((item) => ({ id: item.id || item.name, type: "artist", title: item.name, artist: item.genre, image: item.image })),
  ];

  return savedKeys
    .map((key) => catalog.find((item) => String(item.id) === String(key) || item.title === key))
    .filter(Boolean);
}

function renderBrowse(data) {
  const artistsGrid = qs("#browseArtists");
  const albumsGrid = qs("#browseAlbums");

  const artistCount = qs("#browseArtistCount");
  const albumCount = qs("#browseAlbumCount");
  const catalogCount = qs("#browseCatalogCount");

  if (artistCount) artistCount.textContent = String((data.artists || []).length);
  if (albumCount) albumCount.textContent = String((data.newReleases || []).length);
  if (catalogCount) catalogCount.textContent = String((data.artists || []).length + (data.newReleases || []).length);

  if (artistsGrid) {
    artistsGrid.innerHTML = (data.artists || [])
      .map((artist) => `
        <div class="rec-card">
          <div class="rec-card-art" data-play-title="${artist.name}" data-play-artist="${artist.genre}" data-play-image="${artist.image}">
            <img src="${artist.image || ""}" alt="${artist.name || "Artist"}" class="rec-card-art-inner" />
            <div class="rec-card-overlay"></div>
            <div class="rec-card-play"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
          </div>
          <button class="card-add-queue" data-title="${artist.name}" data-artist="${artist.genre}" data-image="${artist.image}" data-id="${artist.id}">+</button>
          <div class="rec-card-title">${artist.name}</div>
          <div class="rec-card-artist">${artist.genre} • ${artist.followers || "-"} followers</div>
        </div>`)
      .join("");
    bindCardInteractions(artistsGrid);
  }

  if (albumsGrid) {
    albumsGrid.innerHTML = (data.newReleases || [])
      .map((album) => `
        <div class="album-card">
          <div class="card-art" data-play-title="${album.album}" data-play-artist="${album.artist}" data-play-image="${album.image}">
            <img src="${album.image || ""}" alt="${album.album || "Album"}" class="card-art-inner" />
            <div class="card-art-overlay"></div>
            <div class="card-play-fab"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
          </div>
          <button class="card-add-queue" data-title="${album.album}" data-artist="${album.artist}" data-image="${album.image}">+</button>
          <div class="card-title">${album.album}</div>
          <div class="card-artist">${album.artist}</div>
          <div class="card-meta">${album.year || "-"} • ${album.tracks || 0} tracks</div>
        </div>`)
      .join("");
    bindCardInteractions(albumsGrid);
  }

  const playAll = qs("#btnBrowsePlayAll");
  const shuffle = qs("#btnBrowseShuffle");

  if (playAll) {
    playAll.onclick = () => {
      const first = (data.topRecommendations || [])[0] || (data.newReleases || [])[0] || (data.artists || [])[0];
      if (!first) return;
      playFromCard(first.title || first.album || first.name || "", first.artist || first.genre || "", first.image || "");
    };
  }

  if (shuffle) {
    shuffle.onclick = () => {
      const pool = [
        ...(data.topRecommendations || []).map((item) => ({ title: item.title, artist: item.artist, image: item.image })),
        ...(data.newReleases || []).map((item) => ({ title: item.album, artist: item.artist, image: item.image })),
        ...(data.artists || []).map((item) => ({ title: item.name, artist: item.genre, image: item.image })),
      ];
      if (!pool.length) return;
      const choice = pool[Math.floor(Math.random() * pool.length)];
      playFromCard(choice.title, choice.artist, choice.image);
    };
  }
}

function renderLibrary(data) {
  const grid = qs("#libraryItems");
  if (!grid) return;

  const entries = getLibraryEntries(data);
  const savedKeys = JSON.parse(localStorage.getItem(STORAGE_KEYS.lib) || "[]");
  const savedCount = qs("#librarySavedCount");
  const artistCount = qs("#libraryArtistCount");
  const albumCount = qs("#libraryAlbumCount");

  if (savedCount) savedCount.textContent = String(savedKeys.length);
  if (artistCount) artistCount.textContent = String(entries.filter((entry) => entry.type === "artist").length);
  if (albumCount) albumCount.textContent = String(entries.filter((entry) => entry.type === "album").length);

  let activeFilter = "all";

  const render = () => {
    const filtered = activeFilter === "all" ? entries : entries.filter((entry) => entry.type === activeFilter);

    if (!savedKeys.length) {
      grid.innerHTML = '<div class="empty-inline">Your library is empty. Save songs, albums, artists, or playlists to build your collection.</div>';
      return;
    }

    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-inline">No saved items in this category.</div>';
      return;
    }

    grid.innerHTML = filtered
      .map((entry) => `
        <div class="rec-card">
          <div class="rec-card-art" data-play-title="${entry.title}" data-play-artist="${entry.artist}" data-play-image="${entry.image}">
            <img src="${entry.image || ""}" alt="${entry.title}" class="rec-card-art-inner" />
            <div class="rec-card-overlay"></div>
            <div class="rec-card-play"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
          </div>
          <button class="card-add-queue" data-title="${entry.title}" data-artist="${entry.artist}" data-image="${entry.image}">+</button>
          <div class="rec-card-title">${entry.title}</div>
          <div class="rec-card-artist">${entry.artist || "Saved item"}</div>
        </div>`)
      .join("");

    bindCardInteractions(grid);
  };

  render();

  [
    ["#btnLibraryAll", "all"],
    ["#btnLibraryArtists", "artist"],
    ["#btnLibraryAlbums", "album"],
    ["#btnLibraryPlaylists", "playlist"],
  ].forEach(([selector, filter]) => {
    const button = qs(selector);
    if (!button) return;
    button.addEventListener("click", () => {
      activeFilter = filter;
      qsa("#btnLibraryAll, #btnLibraryArtists, #btnLibraryAlbums, #btnLibraryPlaylists").forEach((el) => el.classList.remove("primary"));
      button.classList.add("primary");
      render();
    });
  });

  const defaultButton = qs("#btnLibraryAll");
  if (defaultButton) defaultButton.classList.add("primary");
}

function renderPlaylists(data) {
  const grid = qs("#playlistsGrid");
  if (!grid) return;

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.playlists) || "null");
  let playlists = Array.isArray(stored) && stored.length ? stored : (data.customPlaylists || []).slice();

  const playlistCount = qs("#playlistCount");
  const playlistTrackCount = qs("#playlistTrackCount");
  const playlistSavedCount = qs("#playlistSavedCount");

  if (playlistCount) playlistCount.textContent = String(playlists.length);
  if (playlistTrackCount) playlistTrackCount.textContent = String(playlists.reduce((total, playlist) => total + (Array.isArray(playlist.tracks) ? playlist.tracks.length : Number(playlist.tracks || 0)), 0));
  if (playlistSavedCount) playlistSavedCount.textContent = String((JSON.parse(localStorage.getItem(STORAGE_KEYS.lib) || "[]") || []).length);

  const render = () => {
    if (!playlists.length) {
      grid.innerHTML = '<div class="empty-inline">No playlists yet. Create one to start organizing your music.</div>';
      return;
    }

    grid.innerHTML = playlists
      .map((playlist) => {
        const trackCount = Array.isArray(playlist.tracks) ? playlist.tracks.length : Number(playlist.tracks || 0);
        return `
          <div class="rec-card">
            <div class="rec-card-art" data-play-title="${playlist.name}" data-play-artist="${playlist.createdBy || "You"}">
              <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a0a1a,#4a1a2a);border-radius:10px;">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" style="opacity:0.5;"><path d="M21 15V6"/><path d="M18.5 18.5A2.5 2.5 0 1 1 16 16a2.5 2.5 0 0 1 2.5 2.5Z"/><path d="M21 6a9 9 0 0 1-9 9"/><path d="M3 7h8"/><path d="M3 12h6"/><path d="M3 17h4"/></svg>
              </div>
              <div class="rec-card-overlay"></div>
              <div class="rec-card-play"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
            </div>
            <button class="card-add-queue" data-title="${playlist.name}" data-artist="${playlist.createdBy || "You"}">+</button>
            <div class="rec-card-title">${playlist.name}</div>
            <div class="rec-card-artist">By ${playlist.createdBy || "You"}</div>
            <div class="rec-card-artist">${trackCount} tracks</div>
          </div>`;
      })
      .join("");

    bindCardInteractions(grid);
  };

  render();

  const createButton = qs("#btnCreatePlaylistHero");
  if (createButton) {
    createButton.onclick = () => {
      const playlistName = window.prompt("Playlist name");
      if (!playlistName || !playlistName.trim()) return;

      const nextPlaylist = {
        id: `cp${Date.now()}`,
        name: playlistName.trim(),
        createdBy: (data.user && data.user.name) || "You",
        creationDate: new Date().toISOString().slice(0, 10),
        tracks: [],
      };

      playlists = [nextPlaylist, ...playlists];
      localStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify(playlists));
      render();
      if (playlistCount) playlistCount.textContent = String(playlists.length);
      toast("Playlist created");
    };
  }

  const playFirstButton = qs("#btnPlayFirstPlaylist");
  if (playFirstButton) {
    playFirstButton.onclick = () => {
      const first = playlists[0];
      if (!first) return;
      playFromCard(first.name, first.createdBy || "You", "");
    };
  }
}

async function init() {
  const data = await loadData();
  setUser(data);

  const page = getPageName();
  if (page === "browse") renderBrowse(data);
  else if (page === "library") renderLibrary(data);
  else if (page === "playlists") renderPlaylists(data);
}

document.addEventListener("DOMContentLoaded", init);
