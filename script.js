const VepMune = (() => {

  /* ── state ─────────────────────────────────────────── */
  let data = null;
  let state = {
    playing: false,
    currentTime: 120,
    duration: 179,
    volume: 0.7,
    muted: false,
    liked: false,
    shuffle: false,
    repeat: false,
    ticker: null,
  };

  /* ── boot ───────────────────────────────────────────── */
  async function init() {
    try {
      const r = await fetch('mockdata.json');
      data = await r.json();
    } catch {
      data = fallback();
    }
    renderAll();
    wire();
  }

  /* ── render ─────────────────────────────────────────── */
  function renderAll() {
    renderUser();
    renderPlaylists();
    renderTopRecs();
    renderNewReleases();
    renderTrending();
    renderPlayer();
  }

  function renderUser() {
    const u = data.user;
    qs('#welcomeName').textContent = `Welcome, ${u.name}`;
    qs('#userAvatar').textContent   = u.avatar;
  }

  function renderPlaylists() {
    qs('#sidebarPlaylists').innerHTML = data.customPlaylists.map(pl => `
      <div class="playlist-item" data-id="${pl.id}" onclick="VepMune.openPlaylist('${pl.id}',this)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span>${pl.name}</span>
      </div>`).join('');
  }

  function renderTopRecs() {
    const container = qs('#topRecsRow');
    container.innerHTML = data.topRecommendations.map(s => `
      <div class="rec-card" onclick="VepMune.playRec(${s.id},'${esc(s.title)}','${esc(s.artist)}','${s.bg}')">
        <div class="rec-card-art">
          <div class="rec-card-art-inner" style="background:${s.bg}">
            ${artSVG(s.label)}
          </div>
          <div class="rec-card-overlay"></div>
          <div class="rec-card-play">
            ${iconPlay(18)}
          </div>
        </div>
        <div class="rec-card-title">${s.title}</div>
        <div class="rec-card-artist">${s.artist}</div>
      </div>`).join('');
  }

  function renderNewReleases() {
    const container = qs('#newRelRow');
    container.innerHTML = data.newReleases.map(a => `
      <div class="album-card" onclick="VepMune.playAlbum('${esc(a.album)}','${esc(a.artist)}','${a.bg}')">
        <div class="card-art">
          <div class="card-art-inner" style="background:${a.bg}">
            ${artSVG(a.album.charAt(0))}
          </div>
          <div class="card-art-overlay"></div>
          <div class="card-play-fab">${iconPlay(16)}</div>
        </div>
        <div class="card-title">${a.album}</div>
        <div class="card-artist">${a.artist}</div>
      </div>`).join('');
  }

  function renderTrending() {
    const container = qs('#trendRow');
    container.innerHTML = data.trendingPlaylists.map(p => `
      <div class="pl-card" onclick="VepMune.playPl('${esc(p.name)}','${esc(p.curator)}','${p.bg}')">
        <div class="card-art">
          <div class="card-art-inner" style="background:${p.bg}">
            ${artSVG(p.name.charAt(0))}
          </div>
          <div class="card-art-overlay"></div>
          <div class="card-play-fab">${iconPlay(16)}</div>
        </div>
        <div class="card-title">${p.name}</div>
        <div class="card-artist">${p.curator}</div>
      </div>`).join('');
  }

  function renderPlayer() {
    const t = data.currentTrack;
    state.duration    = t.duration;
    state.currentTime = t.startAt || 0;
    qs('#pTitle').textContent  = t.title;
    qs('#pArtist').textContent = t.artist;
    qs('#pArt').style.background = t.bg;
    qs('#timeEnd').textContent = fmt(t.duration);
    updateProgress();
    updateVolume();
  }

  /* ── wiring ─────────────────────────────────────────── */
  function wire() {
    qs('#btnPlay').addEventListener('click', togglePlay);
    qs('#btnPrev').addEventListener('click', prev);
    qs('#btnNext').addEventListener('click', next);
    qs('#btnLike').addEventListener('click', toggleLike);
    qs('#btnShuffle').addEventListener('click', toggleShuffle);
    qs('#btnRepeat').addEventListener('click', toggleRepeat);
    qs('#btnMute').addEventListener('click', toggleMute);

    qs('#progTrack').addEventListener('click', seek);
    qs('#volTrack').addEventListener('click', setVol);

    qs('#btnMenu').addEventListener('click', openSidebar);
    qs('#sidebarOverlay').addEventListener('click', closeSidebar);

    qs('#btnPremium').addEventListener('click', () => toast('✦ Upgrade coming soon!'));
    qs('#btnBell').addEventListener('click', () => toast('🔔 No new notifications'));

    qs('#recArrow').addEventListener('click', () => scrollRow(qs('#topRecsRow'), 500));
    qs('#newRelArrow').addEventListener('click', () => scrollRow(qs('#newRelRow'), 500));
    qs('#trendArrow').addEventListener('click', () => scrollRow(qs('#trendRow'), 500));

    qsa('.nav-item[data-nav]').forEach(el =>
      el.addEventListener('click', () => {
        qsa('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        toast(`Navigated to ${el.querySelector('span').textContent}`);
        closeSidebar();
      })
    );

    qs('#btnAddPlaylist').addEventListener('click', () => toast('📂 Create playlist coming soon!'));
  }

  /* ── playback ────────────────────────────────────────── */
  function togglePlay() {
    state.playing = !state.playing;
    const btn = qs('#btnPlay');
    btn.innerHTML = state.playing
      ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
      : iconPlay(18);

    qs('.player').classList.toggle('playing', state.playing);

    if (state.playing) {
      state.ticker = setInterval(() => {
        if (state.currentTime < state.duration) {
          state.currentTime++;
          updateProgress();
        } else {
          state.currentTime = 0;
          if (!state.repeat) { next(); } else { updateProgress(); }
        }
      }, 1000);
    } else {
      clearInterval(state.ticker);
    }
  }

  function prev() {
    state.currentTime = 0;
    updateProgress();
    toast('⏮ Previous track');
  }

  function next() {
    state.currentTime = 0;
    updateProgress();
    toast('⏭ Next track');
  }

  function toggleLike() {
    state.liked = !state.liked;
    const btn = qs('#btnLike');
    btn.classList.toggle('liked', state.liked);
    btn.innerHTML = state.liked
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="#ff4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
      : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;
    toast(state.liked ? '❤ Added to liked songs' : 'Removed from liked songs');
  }

  function toggleShuffle() {
    state.shuffle = !state.shuffle;
    qs('#btnShuffle').classList.toggle('on', state.shuffle);
    toast(state.shuffle ? '🔀 Shuffle on' : 'Shuffle off');
  }

  function toggleRepeat() {
    state.repeat = !state.repeat;
    qs('#btnRepeat').classList.toggle('on', state.repeat);
    toast(state.repeat ? '🔁 Repeat on' : 'Repeat off');
  }

  function toggleMute() {
    state.muted = !state.muted;
    updateVolume();
  }

  function seek(e) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    state.currentTime = Math.round(((e.clientX - left) / width) * state.duration);
    updateProgress();
  }

  function setVol(e) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    state.volume = Math.min(1, Math.max(0, (e.clientX - left) / width));
    state.muted   = false;
    updateVolume();
  }

  function updateProgress() {
    const pct = state.duration ? (state.currentTime / state.duration) * 100 : 0;
    qs('#progFill').style.width      = pct + '%';
    qs('#timeCurrent').textContent   = fmt(state.currentTime);
  }

  function updateVolume() {
    const w = state.muted ? 0 : state.volume * 100;
    qs('#volFill').style.width = w + '%';
    const btn = qs('#btnMute');
    btn.innerHTML = state.muted || state.volume === 0
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
      : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>`;
  }

  /* ── card actions ────────────────────────────────────── */
  function playRec(id, title, artist, bg) {
    loadTrack(title, artist, bg);
  }

  function playAlbum(album, artist, bg) {
    loadTrack(album, artist, bg);
  }

  function playPl(name, curator, bg) {
    loadTrack(name, curator, bg);
  }

  function loadTrack(title, artist, bg) {
    state.currentTime = 0;
    qs('#pTitle').textContent  = title;
    qs('#pArtist').textContent = artist;
    qs('#pArt').style.background = bg;
    if (!state.playing) togglePlay();
    else { updateProgress(); }
    toast(`▶ ${title} — ${artist}`);
  }

  function openPlaylist(id, el) {
    qsa('.playlist-item').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
    const pl = data.customPlaylists.find(p => p.id === id);
    if (pl) toast(`📂 ${pl.name}`);
    closeSidebar();
  }

  /* ── sidebar ─────────────────────────────────────────── */
  function openSidebar() {
    qs('#sidebar').classList.add('open');
    qs('#sidebarOverlay').classList.add('active');
  }

  function closeSidebar() {
    qs('#sidebar').classList.remove('open');
    qs('#sidebarOverlay').classList.remove('active');
  }

  /* ── helpers ─────────────────────────────────────────── */
  function scrollRow(el, px) { el.scrollBy({ left: px, behavior: 'smooth' }); }

  let toastTimer = null;
  function toast(msg) {
    const el = qs('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function esc(s) { return s.replace(/'/g, "\\'"); }

  function qs(sel)  { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  function iconPlay(size) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
  }

  function artSVG(letter) {
    return `<svg viewBox="0 0 60 60" width="60" height="60" style="opacity:.18">
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="sans-serif" font-size="32" font-weight="700" fill="white">${letter}</text>
    </svg>`;
  }

  function fallback() {
    return {
      user: { name: "User Name", plan: "free", avatar: "U" },
      topRecommendations: [
        { id:1, title:"Dumk Wealr",        artist:"Redcle",     duration:"3:24", bg:"linear-gradient(155deg,#111,#2a2a2a)", label:"D" },
        { id:2, title:"Dawlingota Sans...", artist:"Toelflums",  duration:"4:01", bg:"linear-gradient(155deg,#7a1010,#c0392b)", label:"D" },
        { id:3, title:"Bloaver",            artist:"The Second", duration:"3:55", bg:"linear-gradient(155deg,#c4a882,#e0cab0)", label:"B" },
        { id:4, title:"Samiracind the",     artist:"Sleephone",  duration:"4:18", bg:"linear-gradient(155deg,#222,#444)", label:"S" },
        { id:5, title:"Date Milly",         artist:"Doctor",     duration:"3:42", bg:"linear-gradient(155deg,#080808,#181818)", label:"DP" },
        { id:6, title:"Yarpa Brdan",        artist:"Chaii Wenf", duration:"5:10", bg:"linear-gradient(155deg,#181818,#2e2e2e)", label:"Y" }
      ],
      newReleases: [
        { id:7,  album:"Newly Released...", artist:"Catalog data", year:2025, tracks:12, bg:"linear-gradient(145deg,#f5c2d0,#e8a0bf,#c070a0)" },
        { id:8,  album:"Tirilly Roast",     artist:"Album",        year:2025, tracks:9,  bg:"linear-gradient(145deg,#6e0f08,#b03020,#6e1008)" },
        { id:9,  album:"Jean Noider",       artist:"Artist",       year:2025, tracks:10, bg:"linear-gradient(145deg,#b89050,#d0a860,#907030)" },
        { id:10, album:"Jan Gron",          artist:"Artist",       year:2025, tracks:11, bg:"linear-gradient(145deg,#104a6a,#1a6a8a,#103a5a)" }
      ],
      trendingPlaylists: [
        { id:1, name:"Trending Playlist...", curator:"Custom playlists",      tracks:34, bg:"linear-gradient(145deg,#3a0808,#a02020)" },
        { id:2, name:"Trending Playlist...", curator:"Custom playlists",      tracks:28, bg:"linear-gradient(145deg,#c8c0b8,#e0d8d0)" },
        { id:3, name:"Flow Note",            curator:"Translotiom Playliste", tracks:45, bg:"linear-gradient(145deg,#181828,#282848)" },
        { id:4, name:"Midnight Synthwave",   curator:"Custom playlists",      tracks:22, bg:"linear-gradient(145deg,#0a0a18,#18183a)" }
      ],
      customPlaylists: [
        { id:"cp1", name:"Custom Playlist 1", tracks:12 },
        { id:"cp2", name:"Custom Playlist 2", tracks:8 },
        { id:"cp3", name:"Custom Playlist 3", tracks:15 },
        { id:"cp4", name:"Custom Playlist 4", tracks:6 },
        { id:"cp5", name:"Custom Playlist 5", tracks:20 },
        { id:"cp6", name:"Custom Playlist 6", tracks:11 }
      ],
      currentTrack: { id:1, title:"Track From (Counel)", artist:"Uisenity Track", album:"Counel Sessions", duration:179, startAt:120, bg:"linear-gradient(135deg,#1a1a1a,#2e2e2e)" }
    };
  }

  return { init, playRec, playAlbum, playPl, openPlaylist };
})();

document.addEventListener('DOMContentLoaded', VepMune.init);
