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
    queue: [],
    favorites: [],
    library: [],
    following: [],
    ticker: null,
  };
  const STORAGE_KEYS = { queue: 'vepmune_queue', current: 'vepmune_current', favs: 'vepmune_favs', lib: 'vepmune_lib', following: 'vepmune_following', playlists: 'vepmune_playlists' };
  let bc = null;

  /* ── broadcast channel (cross-tab sync) ────────────── */
  function initBroadcastChannel() {
    try {
      bc = new BroadcastChannel('vepmune-sync');
      bc.addEventListener('message', (e) => {
        if (e.data.type === 'queue-updated') { state.queue = e.data.queue || []; renderQueue(); }
        if (e.data.type === 'track-changed') { data.currentTrack = e.data.track; renderPlayer(); }
      });
    } catch (err) { /* BroadcastChannel not supported */ }
  }
  function broadcastQueue() { if (bc) bc.postMessage({ type: 'queue-updated', queue: state.queue }); }
  function broadcastTrack() { if (bc) bc.postMessage({ type: 'track-changed', track: data.currentTrack }); }

  /* ── boot ───────────────────────────────────────────── */
  async function init() {
    try {
      const r = await fetch('mockdata.json');
      data = await r.json();
    } catch {
      data = fallback();
    }
    loadStateFromStorage();
    initBroadcastChannel();
    renderUser();
    renderPlaylists();
    renderPlayer();
    if (isHomePage()) {
      renderTopRecs();
      renderNewReleases();
      renderTrending();
      renderArtists();
    }
    wire();
    // render queue badge & queue list if stored items exist
    renderQueue();
    updateQueueBadge();
  }

  /* ── render ─────────────────────────────────────────── */
  function renderAll() {
    renderUser();
    renderPlaylists();
    renderTopRecs();
    renderNewReleases();
    renderTrending();
    renderArtists();
    renderPlayer();
  }

  function isHomePage() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    return page === 'index.html' || page === '' || page === 'index.htm';
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
    if (!container) return;
    container.innerHTML = data.topRecommendations.map(s => {
      const key = s.id || s.title;
      const isFav = state.favorites.some(f => String(f) === String(key));
      const isSaved = state.library.some(f => String(f) === String(key));
      return `
      <div class="rec-card">
        <div class="card-badges">
          ${isFav ? `<div class="card-badge fav" data-key="${key}" data-type="track" title="Favorited">❤</div>` : ''}
          ${isSaved ? `<div class="card-badge saved" data-key="${key}" data-type="track" title="Saved">✔</div>` : ''}
        </div>
        <div class="rec-card-art" data-play-id="${s.id}" data-play-title="${esc(s.title)}" data-play-artist="${esc(s.artist)}" data-play-bg="${s.bg}" data-play-image="${s.image}">
          <img src="${s.image}" alt="${s.title}" class="rec-card-art-inner" />
          <div class="rec-card-overlay"></div>
          <div class="rec-card-play">${iconPlay(18)}</div>
        </div>
        <button class="card-add-queue" data-title="${esc(s.title)}" data-artist="${esc(s.artist)}" data-bg="${s.bg}" data-image="${s.image}" data-id="${s.id}">+</button>
        <div class="rec-card-title">${s.title}</div>
        <div class="rec-card-artist">${s.artist}</div>
      </div>`;
    }).join('');
  }

  function renderNewReleases() {
    const container = qs('#newRelRow');
    if (!container) return;
    container.innerHTML = data.newReleases.map(a => {
      const key = a.id || a.album;
      const isSaved = state.library.some(f => String(f) === String(key));
      return `
      <div class="album-card">
        <div class="card-badges">${isSaved ? `<div class="card-badge saved" data-key="${key}" data-type="collection" title="Saved">✔</div>` : ''}</div>
        <div class="card-art" data-play-title="${esc(a.album)}" data-play-artist="${esc(a.artist)}" data-play-bg="${a.bg}" data-play-image="${a.image}">
          <img src="${a.image}" alt="${a.album}" class="card-art-inner" />
          <div class="card-art-overlay"></div>
          <div class="card-play-fab">${iconPlay(16)}</div>
        </div>
        <button class="card-add-queue" data-title="${esc(a.album)}" data-artist="${esc(a.artist)}" data-bg="${a.bg}" data-image="${a.image}">+</button>
        <div class="card-title">${a.album}</div>
        <div class="card-artist">${a.artist}</div>
        <div class="card-meta">${a.year} • ${a.tracks} tracks</div>
      </div>`;
    }).join('');
  }

  function renderTrending() {
    const container = qs('#trendRow');
    if (!container) return;
    container.innerHTML = data.trendingPlaylists.map(p => {
      const key = p.id || p.name;
      const isSaved = state.library.some(f => String(f) === String(key));
      return `
      <div class="pl-card">
        <div class="card-badges">${isSaved ? `<div class="card-badge saved" data-key="${key}" data-type="collection" title="Saved">✔</div>` : ''}</div>
        <div class="card-art" data-play-title="${esc(p.name)}" data-play-artist="${esc(p.curator)}" data-play-bg="${p.bg}" data-play-image="${p.image}">
          <img src="${p.image}" alt="${p.name}" class="card-art-inner" />
          <div class="card-art-overlay"></div>
          <div class="card-play-fab">${iconPlay(16)}</div>
        </div>
        <button class="card-add-queue" data-title="${esc(p.name)}" data-artist="${esc(p.curator)}" data-bg="${p.bg}" data-image="${p.image}">+</button>
        <div class="card-title">${p.name}</div>
        <div class="card-artist">${p.curator}</div>
        <div class="card-meta">${p.tracks} tracks</div>
      </div>`;
    }).join('');
  }

  function renderArtists() {
    const container = qs('#artistsGrid');
    if (!container || !data.artists) return;
    container.innerHTML = data.artists.map(a => {
      const isFollowing = state.following.some(f => String(f) === String(a.name));
      return `
      <div class="artist-card">
        <div class="card-badges">${isFollowing ? `<div class="card-badge follow" data-key="${a.name}" data-type="artist" title="Following">★</div>` : ''}</div>
        <img src="${a.image}" alt="${a.name}" class="artist-image" data-play-title="${esc(a.name)}" data-play-artist="${esc(a.genre)}" data-play-bg="${a.bg || ''}" data-play-image="${a.image || ''}" />
        <button class="card-add-queue" data-title="${esc(a.name)}" data-artist="${esc(a.genre)}" data-bg="${a.bg || ''}" data-image="${a.image || ''}">+</button>
        <div class="artist-name">${a.name}</div>
        <div class="artist-genre">${a.genre}</div>
        <div class="artist-followers">${a.followers} followers</div>
      </div>`;
    }).join('');
  }

  function renderPlayer() {
    const t = data.currentTrack;
    if (!t) return;
    state.duration    = t.duration;
    state.currentTime = t.currentTime || 0;
    const titleEl = qs('#pTitle');
    const artistEl = qs('#pArtist');
    const artEl = qs('#pArt');
    const endEl = qs('#timeEnd');
    if (titleEl) titleEl.textContent = t.title;
    if (artistEl) artistEl.textContent = t.artist;
    if (artEl) artEl.innerHTML = `<img src="${t.image}" alt="${t.title}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`;
    if (endEl) endEl.textContent = fmt(t.duration);
    updateProgress();
    updateVolume();
  }

  /* ── wiring ─────────────────────────────────────────── */
  function wire() {
    const btnPlay = qs('#btnPlay');
    const btnPrev = qs('#btnPrev');
    const btnNext = qs('#btnNext');
    const btnLike = qs('#btnLike');
    const btnShuffle = qs('#btnShuffle');
    const btnRepeat = qs('#btnRepeat');
    const btnMute = qs('#btnMute');
    const progTrack = qs('#progTrack');
    const volTrack = qs('#volTrack');
    const btnMenu = qs('#btnMenu');
    const sidebarOverlay = qs('#sidebarOverlay');
    const btnPremium = qs('#btnPremium');
    const btnBell = qs('#btnBell');
    const recArrow = qs('#recArrow');
    const newRelArrow = qs('#newRelArrow');
    const trendArrow = qs('#trendArrow');

    if (btnPlay) btnPlay.addEventListener('click', togglePlay);
    if (btnPrev) btnPrev.addEventListener('click', prev);
    if (btnNext) btnNext.addEventListener('click', next);
    if (btnLike) btnLike.addEventListener('click', toggleLike);
    if (btnShuffle) btnShuffle.addEventListener('click', toggleShuffle);
    if (btnRepeat) btnRepeat.addEventListener('click', toggleRepeat);
    if (btnMute) btnMute.addEventListener('click', toggleMute);

    if (progTrack) progTrack.addEventListener('click', seek);
    if (volTrack) volTrack.addEventListener('click', setVol);

    if (btnMenu) btnMenu.addEventListener('click', openSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    if (btnPremium) btnPremium.addEventListener('click', () => toast('✦ Upgrade coming soon!'));
    if (btnBell) btnBell.addEventListener('click', () => toast('🔔 No new notifications'));

    if (recArrow) recArrow.addEventListener('click', () => scrollRow(qs('#topRecsRow'), 500));
    if (newRelArrow) newRelArrow.addEventListener('click', () => scrollRow(qs('#newRelRow'), 500));
    if (trendArrow) trendArrow.addEventListener('click', () => scrollRow(qs('#trendRow'), 500));

    qsa('.nav-item[data-nav]').forEach(el =>
      el.addEventListener('click', () => {
        qsa('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        toast(`Navigated to ${el.querySelector('span').textContent}`);
        closeSidebar();
      })
    );

    const btnAddPlaylist = qs('#btnAddPlaylist');
    if (btnAddPlaylist) btnAddPlaylist.addEventListener('click', () => toast('📂 Create playlist coming soon!'));

    // "See all" buttons for each section
    qsa('.see-all').forEach(el => {
      el.addEventListener('click', () => {
        const title = el.parentElement.querySelector('.section-title').textContent;
        toast(`📂 View all ${title}`);
      });
      el.style.cursor = 'pointer';
    });

    // Utility buttons: Edit, Queue, PiP, Volume, Fullscreen
    qsa('.util-btn').forEach((btn, idx) => {
      if (idx === 0) {
        btn.addEventListener('click', () => toast('✎ Edit track details'));
      } else if (idx === 1) {
        btn.addEventListener('click', openQueue);
      } else if (idx === 2) {
        btn.addEventListener('click', () => toast('🎬 Mini player'));
      } else if (idx === 4) {
        btn.addEventListener('click', () => {
          document.documentElement.requestFullscreen?.();
          toast('⛶ Fullscreen');
        });
      }
    });

    // Queue panel controls
    const qPanelClose = qs('#btnCloseQueue');
    const qPanelClear = qs('#btnClearQueue');
    if (qPanelClose) qPanelClose.addEventListener('click', closeQueue);
    if (qPanelClear) qPanelClear.addEventListener('click', () => { clearQueue(); renderQueue(); });

    // Delegated listener for add-to-queue (+) buttons and card play areas
    document.addEventListener('click', (e) => {
      // clickable badges on cards
      const badge = e.target.closest('.card-badge');
      if (badge) {
        e.stopPropagation();
        const key = badge.dataset.key;
        if (badge.classList.contains('fav')) {
          toggleFavorite(key);
          // re-render row to reflect badge change
          renderTopRecs(); renderNewReleases(); renderTrending(); renderArtists();
          return;
        }
        if (badge.classList.contains('saved')) {
          saveToLibrary({ title: key, name: key, id: key });
          renderTopRecs(); renderNewReleases(); renderTrending(); renderArtists();
          return;
        }
        if (badge.classList.contains('follow')) {
          toggleFollowArtist(key);
          renderArtists();
          return;
        }
      }
      const add = e.target.closest('.card-add-queue');
      if (add) {
        e.stopPropagation();
        openPlusMenuForButton(add, e);
        return;
      }

      const playArea = e.target.closest('.rec-card .rec-card-art, .album-card .card-art, .pl-card .card-art, .artist-image');
      if (playArea) {
        const dt = playArea.dataset || {};
        const title = dt.playTitle || dt.playtitle || playArea.dataset.title || '';
        const artist = dt.playArtist || dt.playartist || playArea.dataset.artist || '';
        const bg = dt.playBg || '';
        const image = dt.playImage || '';
        if (title && artist) loadTrack(title, artist, bg, image);
      }
    });

    // context menu (right click) on card areas
    document.addEventListener('contextmenu', (e) => {
      const card = e.target.closest('.rec-card, .album-card, .pl-card, .artist-card');
      if (!card) return;
      e.preventDefault();
      const menu = qs('#contextMenu');
      if (!menu) return;
      // read data from child play area or dataset
      const playArea = card.querySelector('[data-play-title], [data-play-artist]');
      const ctx = {
        title: playArea?.dataset?.title || playArea?.dataset?.playTitle || card.querySelector('.rec-card-title')?.textContent || card.querySelector('.card-title')?.textContent || card.querySelector('.artist-name')?.textContent || '',
        artist: playArea?.dataset?.artist || playArea?.dataset?.playArtist || card.querySelector('.rec-card-artist')?.textContent || card.querySelector('.card-artist')?.textContent || card.querySelector('.artist-genre')?.textContent || ''
      };
      menu.dataset.ctx = JSON.stringify(ctx);
      menu.style.left = e.pageX + 'px';
      menu.style.top = e.pageY + 'px';
      menu.style.display = 'block';
      menu.setAttribute('aria-hidden','false');
    });

    // hide context menu on click elsewhere
    document.addEventListener('click', (e) => {
      const menu = qs('#contextMenu');
      if (menu && menu.style.display === 'block') { menu.style.display = 'none'; menu.setAttribute('aria-hidden','true'); }
      const plus = qs('#plusMenu');
      if (plus && plus.style.display === 'block') { plus.style.display = 'none'; plus.setAttribute('aria-hidden','true'); }
      const pm = qs('#playlistModal');
      if (pm && pm.style.display === 'block') { pm.style.display = 'none'; pm.setAttribute('aria-hidden','true'); }
    });

    // context menu action handler
    const ctxMenu = qs('#contextMenu');
    if (ctxMenu) {
      ctxMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const ctx = JSON.parse(ctxMenu.dataset.ctx || '{}');
        if (action === 'play') playNow(ctx.title || '', ctx.artist || '');
        else if (action === 'playNext') playNext(ctx.title || '', ctx.artist || '');
        else if (action === 'addQueue') addToQueue(ctx.title || '', ctx.artist || '');
        else if (action === 'goAlbum') toast('🔎 Open album view coming soon');
        ctxMenu.style.display = 'none';
        ctxMenu.setAttribute('aria-hidden','true');
      });
    }

    // plusMenu action handler (for + buttons)
    const plusMenuEl = qs('#plusMenu');
    if (plusMenuEl) {
      plusMenuEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const ctx = JSON.parse(plusMenuEl.dataset.ctx || '{}');
        if (action === 'fav') toggleFavorite(ctx.id || ctx.title || ctx.name);
        else if (action === 'addPlay') openPlaylistModal(ctx);
        else if (action === 'addQueue') addToQueue(ctx.title || ctx.name || ctx.title, ctx.artist || ctx.curator || '');
        else if (action === 'save') saveToLibrary(ctx);
        else if (action === 'follow') toggleFollowArtist(ctx.id || ctx.title || ctx.name);
        plusMenuEl.style.display = 'none'; plusMenuEl.setAttribute('aria-hidden','true');
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'ArrowLeft') { state.currentTime = Math.max(0, state.currentTime - 5); updateProgress(); }
      else if (e.code === 'ArrowRight') { state.currentTime = Math.min(state.duration, state.currentTime + 5); updateProgress(); }
      else if (e.code === 'KeyM') { toggleMute(); }
      else if (e.code === 'KeyL') { toggleLike(); }
    });
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
    // If queue has items, play next from queue
    if (state.queue && state.queue.length > 0) {
      playQueueIndex(0);
      return;
    }
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
  function playRec(id, title, artist, bg, image) {
    loadTrack(title, artist, bg, image);
  }

  function playAlbum(album, artist, bg, image) {
    loadTrack(album, artist, bg, image);
  }

  function playPl(name, curator, bg, image) {
    loadTrack(name, curator, bg, image);
  }

  function playArtist(name, genre) {
    toast(`🎤 Playing all songs by ${name} (${genre})`);
  }

  /* ── queue / persistence ─────────────────────────────────── */
  function loadStateFromStorage() {
    try {
      const q = JSON.parse(localStorage.getItem(STORAGE_KEYS.queue) || '[]');
      state.queue = Array.isArray(q) ? q : [];
      const cur = JSON.parse(localStorage.getItem(STORAGE_KEYS.current) || 'null');
      if (cur) {
        data.currentTrack = cur;
      }
      // load favorites, library, following, playlists
      try { state.favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favs) || '[]') || []; } catch(e){ state.favorites = []; }
      try { state.library = JSON.parse(localStorage.getItem(STORAGE_KEYS.lib) || '[]') || []; } catch(e){ state.library = []; }
      try { state.following = JSON.parse(localStorage.getItem(STORAGE_KEYS.following) || '[]') || []; } catch(e){ state.following = []; }
      try { const pls = JSON.parse(localStorage.getItem(STORAGE_KEYS.playlists) || 'null'); if (pls && Array.isArray(pls)) data.customPlaylists = pls; } catch(e){}
    } catch (e) { /* ignore */ }
  }

  function saveQueue() { localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(state.queue || [])); broadcastQueue(); }
  function saveCurrent() { localStorage.setItem(STORAGE_KEYS.current, JSON.stringify(data.currentTrack)); broadcastTrack(); }

  function openQueue() {
    renderQueue();
    const panel = qs('#queuePanel');
    if (panel) { panel.setAttribute('aria-hidden','false'); panel.classList.add('open'); }
  }

  function closeQueue() {
    const panel = qs('#queuePanel');
    if (panel) { panel.setAttribute('aria-hidden','true'); panel.classList.remove('open'); }
  }

  function renderQueue() {
    const ul = qs('#queueList');
    if (!ul) return;
    const curTrack = data.currentTrack?.title || '';
    ul.innerHTML = (state.queue || []).map((t, idx) => {
      const isActive = t.title === curTrack ? ' active-queue-item' : '';
      return `
      <li class="queue-item${isActive}" data-idx="${idx}" draggable="true" style="animation: slideIn 0.2s ease;">
        <div class="q-info">
          <strong>${t.title}</strong>
          <div class="q-sub">${t.artist}</div>
        </div>
        <div class="q-actions">
          <button onclick="VepMune.playQueueIndex(${idx})">▶</button>
          <button onclick="VepMune.moveQueueItem(${idx},-1)">▲</button>
          <button onclick="VepMune.moveQueueItem(${idx},1)">▼</button>
          <button onclick="VepMune.removeFromQueue(${idx})">✕</button>
        </div>
      </li>
    `}).join('');
    saveQueue();
    updateQueueBadge();
    attachQueueDnD();
  }

  function attachQueueDnD() {
    const list = qs('#queueList');
    if (!list) return;
    let dragSrc = null;
    list.querySelectorAll('.queue-item').forEach(li => {
      li.addEventListener('dragstart', (e) => {
        dragSrc = li;
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', li.dataset.idx);
      });
      li.addEventListener('dragend', () => { li.classList.remove('dragging'); dragSrc = null; });
      li.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; li.classList.add('drag-over'); });
      li.addEventListener('dragleave', () => { li.classList.remove('drag-over'); });
      li.addEventListener('drop', (e) => {
        e.preventDefault(); li.classList.remove('drag-over');
        const srcIdx = Number(e.dataTransfer.getData('text/plain'));
        const destIdx = Number(li.dataset.idx);
        if (isNaN(srcIdx) || isNaN(destIdx)) return;
        if (srcIdx === destIdx) return;
        const item = state.queue.splice(srcIdx,1)[0];
        state.queue.splice(destIdx,0,item);
        renderQueue();
      });
    });
  }

  function addToQueue(title, artist, bg, image, id) {
    const item = { id: id || Date.now(), title, artist, bg, image };
    state.queue = state.queue || [];
    state.queue.push(item);
    saveQueue();
    toast(`➕ Added to queue: ${title}`);
    renderQueue();
  }

  function playNext(title, artist, bg, image, id) {
    const item = { id: id || Date.now(), title, artist, bg, image };
    state.queue = state.queue || [];
    state.queue.splice(0,0,item);
    saveQueue();
    toast(`▶ Next: ${title}`);
    renderQueue();
  }

  function playNow(title, artist, bg, image) {
    loadTrack(title, artist, bg, image);
    toast(`▶ Playing now: ${title}`);
  }

  function removeFromQueue(idx) {
    state.queue.splice(idx,1);
    renderQueue();
    toast('Removed from queue');
  }

  function moveQueueItem(idx, dir) {
    const to = idx + dir;
    if (to < 0 || to >= state.queue.length) return;
    const arr = state.queue;
    const item = arr.splice(idx,1)[0];
    arr.splice(to,0,item);
    renderQueue();
  }

  function clearQueue() { state.queue = []; saveQueue(); toast('Queue cleared'); }

  function updateQueueBadge() {
    const b = qs('#queueBadge');
    if (!b) return;
    const len = (state.queue || []).length;
    b.textContent = len ? String(len) : '';
    b.style.display = len ? 'inline-block' : 'none';
  }

  function playQueueIndex(idx) {
    const it = state.queue[idx];
    if (!it) return;
    loadTrack(it.title, it.artist, it.bg, it.image);
    // remove played item
    state.queue.splice(idx,1);
    renderQueue();
  }

  function loadTrack(title, artist, bg, image) {
    state.currentTime = 0;
    qs('#pTitle').textContent  = title;
    qs('#pArtist').textContent = artist;
    if (image) {
      qs('#pArt').innerHTML = `<img src="${image}" alt="${title}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`;
    } else {
      qs('#pArt').style.background = bg;
    }
    if (!state.playing) togglePlay();
    else { updateProgress(); }
    toast(`▶ ${title} — ${artist}`);
    // persist current track
    if (data && data.currentTrack) { data.currentTrack.title = title; data.currentTrack.artist = artist; data.currentTrack.image = image || data.currentTrack.image; data.currentTrack.bg = bg || data.currentTrack.bg; saveCurrent(); }
  }

  function openPlaylist(id, el) {
    qsa('.playlist-item').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
    const pl = data.customPlaylists.find(p => p.id === id);
    if (pl) toast(`📂 ${pl.name}`);
    closeSidebar();
  }

  /* ── plus-menu & playlist helpers ───────────────────────────────── */
  function openPlusMenuForButton(btn, e) {
    // simpler UX: directly open playlist modal for songs (with favorite option),
    // save to library for albums/playlists, follow/unfollow for artists
    const card = btn.closest('.rec-card, .album-card, .pl-card, .artist-card');
    if (!card) return;
    if (card.classList.contains('rec-card')) {
      const ctx = { id: btn.dataset.id ? Number(btn.dataset.id) : null, title: btn.dataset.title || '', artist: btn.dataset.artist || '' };
      openPlaylistModal(ctx);
      // also offer quick fav button inside modal
      const list = qs('#playlistList');
      if (list) {
        const favBtn = document.createElement('div');
        favBtn.style.padding = '8px';
        favBtn.innerHTML = `<button class="small" id="_addFavBtn">Add to Favorites</button>`;
        list.prepend(favBtn);
        const b = qs('#_addFavBtn'); if (b) b.addEventListener('click', () => { toggleFavorite(ctx.id || ctx.title); b.remove(); });
      }
    } else if (card.classList.contains('album-card') || card.classList.contains('pl-card')) {
      const ctx = { title: btn.dataset.title || '', artist: btn.dataset.artist || '' };
      saveToLibrary(ctx);
    } else if (card.classList.contains('artist-card')) {
      const name = btn.dataset.title || '';
      toggleFollowArtist(name);
    } else {
      // fallback: add to queue
      const title = btn.dataset.title || '';
      const artist = btn.dataset.artist || '';
      addToQueue(title, artist, btn.dataset.bg || '', btn.dataset.image || '', btn.dataset.id ? Number(btn.dataset.id) : undefined);
    }
  }

  function saveFavoritesToStorage() { localStorage.setItem(STORAGE_KEYS.favs, JSON.stringify(state.favorites || [])); }
  function savePlaylistsToStorage() { localStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify(data.customPlaylists || [])); }
  function saveFollowingToStorage() { localStorage.setItem(STORAGE_KEYS.following, JSON.stringify(state.following || [])); }

  function toggleFavorite(idOrTitle) {
    const key = idOrTitle || '';
    const idx = state.favorites.indexOf(key);
    if (idx === -1) { state.favorites.push(key); toast('❤ Added to favorites'); }
    else { state.favorites.splice(idx,1); toast('Removed from favorites'); }
    saveFavoritesToStorage();
  }

  function saveToLibrary(ctx) {
    const key = ctx.title || ctx.name || ctx.id || '';
    if (!key) return;
    const idx = state.library.findIndex(f => String(f) === String(key));
    if (idx === -1) {
      state.library.push(key);
      toast('✔ Saved to your library');
    } else {
      state.library.splice(idx, 1);
      toast('Removed from your library');
    }
    localStorage.setItem(STORAGE_KEYS.lib, JSON.stringify(state.library));
  }

  function toggleFollowArtist(name) {
    const key = name || '';
    const idx = state.following.indexOf(key);
    if (idx === -1) { state.following.push(key); toast(`✔ Following ${key}`); }
    else { state.following.splice(idx,1); toast(`Unfollowed ${key}`); }
    saveFollowingToStorage();
  }

  function openPlaylistModal(ctx) {
    const modal = qs('#playlistModal');
    const list = qs('#playlistList');
    if (!modal || !list) return;
    modal.dataset.ctx = JSON.stringify(ctx || {});
    // ensure playlists have tracks array (coerce numeric counts to empty arrays)
    data.customPlaylists = data.customPlaylists.map(p => ({ ...p, tracks: Array.isArray(p.tracks) ? p.tracks : [] }));
    list.innerHTML = data.customPlaylists.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 6px;border-bottom:1px solid rgba(255,255,255,0.02)">
        <div style="font-size:13px">${p.name}</div>
        <button data-plid="${p.id}" class="small">Add</button>
      </div>
    `).join('');
    // show modal after current click handlers complete to avoid immediate global hide
    setTimeout(() => { modal.style.display = 'block'; modal.setAttribute('aria-hidden','false'); }, 20);
    // wire add buttons
    list.querySelectorAll('button[data-plid]').forEach(b => b.addEventListener('click', () => {
      const pid = b.dataset.plid;
      const ctx2 = JSON.parse(modal.dataset.ctx || '{}');
      addSongToPlaylist(pid, ctx2);
      closePlaylistModal();
    }));
    // wire create playlist
    const createInput = qs('#newPlaylistName');
    const createBtn = qs('#btnCreatePlaylist');
    if (createBtn && createInput) {
      createBtn.onclick = () => {
        const name = (createInput.value || '').trim();
        if (!name) { toast('Please enter a playlist name'); return; }
        const newPl = { id: 'cp' + Date.now(), name, createdBy: (data.user && data.user.name) || 'You', creationDate: new Date().toISOString().slice(0,10), tracks: [] };
        data.customPlaylists.unshift(newPl);
        savePlaylistsToStorage();
        // refresh list
        openPlaylistModal(ctx);
        // if there is a ctx (song) add to new playlist immediately
        const context = ctx || {};
        if (context.title || context.name) {
          addSongToPlaylist(newPl.id, context);
          toast(`➕ Created ${name} and added track`);
          closePlaylistModal();
        } else {
          toast(`✔ Created ${name}`);
        }
      };
    }
  }

  function closePlaylistModal() { const m = qs('#playlistModal'); if (m) { m.style.display = 'none'; m.setAttribute('aria-hidden','true'); } }

  function addSongToPlaylist(playlistId, ctx) {
    const pl = data.customPlaylists.find(p => p.id === playlistId);
    if (!pl) return;
    pl.tracks = pl.tracks || [];
    const item = { id: ctx.id || Date.now(), title: ctx.title || ctx.name || '', artist: ctx.artist || '' };
    pl.tracks.push(item);
    savePlaylistsToStorage();
    toast(`➕ Added to ${pl.name}`);
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
      user: { name: "Vepada Ram", plan: "Premium", avatar: "V", email: "thevepada@gmail.com", joinDate: "2026-05-01" },
      artists: [
        { id: 1, name: "The Weeknd", genre: "R&B", image: "https://upload.wikimedia.org/wikipedia/en/c/c5/The_Weeknd_-_My_Dear_Melancholy.png", followers: "75M" },
        { id: 2, name: "Tame Impala", genre: "Psychedelic Rock", image: "https://upload.wikimedia.org/wikipedia/en/c/c6/Tame_Impala_-_Currents.png", followers: "15M" },
        { id: 3, name: "The 1975", genre: "Indie Rock", image: "https://upload.wikimedia.org/wikipedia/en/b/be/The_1975_-_Being_Funny_in_a_Foreign_Language.png", followers: "28M" },
        { id: 4, name: "Joji", genre: "R&B", image: "https://upload.wikimedia.org/wikipedia/en/3/34/Joji_-_Nectar.png", followers: "22M" }
      ],
      topRecommendations: [
        { id:1, title:"Call Out My Name",        artist:"The Weeknd",     albumId:1, duration:"3:44", image:"https://upload.wikimedia.org/wikipedia/en/c/c5/The_Weeknd_-_My_Dear_Melancholy.png", bg:"linear-gradient(155deg,#1a0a1a,#4a1a2a)" },
        { id:4, title:"Let It Happen", artist:"Tame Impala",  albumId:2, duration:"7:56", image:"https://upload.wikimedia.org/wikipedia/en/c/c6/Tame_Impala_-_Currents.png", bg:"linear-gradient(155deg,#2a1a4a,#5a3a7a)" },
        { id:6, title:"The Less I Know The Better", artist:"Tame Impala", albumId:2, duration:"3:36", image:"https://upload.wikimedia.org/wikipedia/en/c/c6/Tame_Impala_-_Currents.png", bg:"linear-gradient(155deg,#1a3a4a,#3a6a8a)" },
        { id:9, title:"Sanctuary", artist:"Joji", albumId:4, duration:"3:37", image:"https://upload.wikimedia.org/wikipedia/en/3/34/Joji_-_Nectar.png", bg:"linear-gradient(155deg,#1a2a3a,#3a5a6a)" },
        { id:7, title:"Robbers", artist:"The 1975", albumId:3, duration:"4:58", image:"https://upload.wikimedia.org/wikipedia/en/b/be/The_1975_-_Being_Funny_in_a_Foreign_Language.png", bg:"linear-gradient(155deg,#4a2a2a,#7a4a4a)" },
        { id:3, title:"I Was Never There", artist:"The Weeknd", albumId:1, duration:"4:01", image:"https://upload.wikimedia.org/wikipedia/en/c/c5/The_Weeknd_-_My_Dear_Melancholy.png", bg:"linear-gradient(155deg,#0a0a1a,#2a0a2a)" }
      ],
      newReleases: [
        { id:1, album:"My Dear Melancholy,", artist:"The Weeknd", albumId:1, image:"https://upload.wikimedia.org/wikipedia/en/c/c5/The_Weeknd_-_My_Dear_Melancholy.png", year:2018, tracks:6, genre:"R&B", bg:"linear-gradient(145deg,#1a0a1a,#4a1a2a,#2a0a1a)" },
        { id:2, album:"Nectar", artist:"Joji", albumId:4, image:"https://upload.wikimedia.org/wikipedia/en/3/34/Joji_-_Nectar.png", year:2020, tracks:8, genre:"R&B", bg:"linear-gradient(145deg,#1a2a3a,#3a5a6a,#1a3a4a)" },
        { id:3, album:"Currents", artist:"Tame Impala", albumId:2, image:"https://upload.wikimedia.org/wikipedia/en/c/c6/Tame_Impala_-_Currents.png", year:2015, tracks:13, genre:"Psychedelic Rock", bg:"linear-gradient(145deg,#2a1a4a,#5a3a7a,#3a1a5a)" },
        { id:4, album:"Being Funny in a Foreign Language", artist:"The 1975", albumId:3, image:"https://upload.wikimedia.org/wikipedia/en/b/be/The_1975_-_Being_Funny_in_a_Foreign_Language.png", year:2022, tracks:12, genre:"Indie Rock", bg:"linear-gradient(145deg,#4a2a2a,#7a4a4a,#5a2a3a)" }
      ],
      trendingPlaylists: [
        { id:1, name:"Chill R&B Vibes", curator:"VepMune Editorial", image:"https://upload.wikimedia.org/wikipedia/en/c/c5/The_Weeknd_-_My_Dear_Melancholy.png", tracks:45, description:"Smooth R&B tracks to unwind", bg:"linear-gradient(145deg,#1a0a1a,#4a1a2a)" },
        { id:2, name:"Psychedelic Journey", curator:"VepMune Editorial", image:"https://upload.wikimedia.org/wikipedia/en/c/c6/Tame_Impala_-_Currents.png", tracks:38, description:"Explore the psychedelic rock universe", bg:"linear-gradient(145deg,#2a1a4a,#5a3a7a)" },
        { id:3, name:"Indie Essentials", curator:"VepMune Editorial", image:"https://upload.wikimedia.org/wikipedia/en/b/be/The_1975_-_Being_Funny_in_a_Foreign_Language.png", tracks:52, description:"The best indie rock tracks of our time", bg:"linear-gradient(145deg,#4a2a2a,#7a4a4a)" },
        { id:4, name:"Late Night Vibes", curator:"VepMune Editorial", image:"https://upload.wikimedia.org/wikipedia/en/3/34/Joji_-_Nectar.png", tracks:41, description:"Perfect for those late night sessions", bg:"linear-gradient(145deg,#1a2a3a,#3a5a6a)" }
      ],
      customPlaylists: [
        { id:"cp1", name:"Paroxitene", createdBy:"Vepada Ram", creationDate:"2026-05-02", tracks:8, description:"My personal collection" },
        { id:"cp2", name:"Mohomaya", createdBy:"Tomal Devnath", creationDate:"2026-05-02", tracks:6, description:"Favorite tracks" },
        { id:"cp3", name:"Otasha", createdBy:"Farhan Sikder", creationDate:"2026-05-02", tracks:7, description:"Relaxing music" }
      ],
      currentTrack: { id:1, title:"Call Out My Name", artist:"The Weeknd", album:"My Dear Melancholy,", albumId:1, duration:224, currentTime:85, image:"https://upload.wikimedia.org/wikipedia/en/c/c5/The_Weeknd_-_My_Dear_Melancholy.png", bg:"linear-gradient(135deg,#1a0a1a,#4a1a2a)" }
    };
  }

  // expose public API
  return { init, playRec, playAlbum, playPl, playArtist, openPlaylist,
    addToQueue, openQueue, playQueueIndex, removeFromQueue, moveQueueItem,
    playNext, playNow };
})();

document.addEventListener('DOMContentLoaded', VepMune.init);
