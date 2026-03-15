document.addEventListener('DOMContentLoaded', () => {
  // Initialize audio (preload MP3/WAV files from Son/ folder)
  if (typeof AudioManager !== 'undefined') {
    AudioManager.init();
  }

  initEnvironment();
  initAppTriggers();
  initFocusNavigation();   // Console-style tile focus + spatial nav
  initClockWidget();
  initMusicBar();          // Initialize song controls
  initAuth(); // Initialize authentication system
  initMiiPlaza();         // Initialize Mii background characters
  initMiiPlaza();         // Initialize Mii background characters

  // Auto-play music on first user interaction (browser requires user gesture)
  function autoPlayOnce() {
    if (typeof AudioManager !== 'undefined' && !AudioManager.isPlayingMusic && !AudioManager.isExternalMusicPlaying) {
      AudioManager.playNextMusic();
      // Update visualizer display
      if (window.updateVisualizerDisplay) window.updateVisualizerDisplay();
    }
    document.removeEventListener('click', autoPlayOnce);
    document.removeEventListener('keydown', autoPlayOnce);
  }
  document.addEventListener('click', autoPlayOnce);
  document.addEventListener('keydown', autoPlayOnce);
});

/* ============================================================
   FOCUS NAVIGATION SYSTEM
   Console-style spatial navigation with arrow keys & mouse hover.
   ============================================================ */
function initFocusNavigation() {
  const tiles = Array.from(document.querySelectorAll('.grid-tile'));
  const glowEl = document.getElementById('focus-glow');
  const mainContainer = document.getElementById('main-container');

  if (!tiles.length) return;

  // Pastel glow colours keyed to tile index (cycles through hues)
  const glowColors = [
    'rgba(79,172,254,0.55)',   // blue
    'rgba(255,154,86,0.50)',   // orange
    'rgba(106,218,228,0.50)',  // teal
    'rgba(196,113,237,0.50)',  // purple
    'rgba(67,233,123,0.45)',   // green
    'rgba(255,117,140,0.50)',  // pink
    'rgba(163,140,209,0.50)',  // lavender
    'rgba(255,211,100,0.45)',  // yellow
  ];

  // BG accent hues matching glow colours
  const bgAccentHues = [210, 25, 188, 280, 140, 340, 255, 45];

  let focusedIndex = 0;

  function setFocus(index, source) {
    if (index < 0 || index >= tiles.length) return;

    // Remove old focused state
    tiles[focusedIndex]?.classList.remove('tile-focused');

    focusedIndex = index;
    const tile = tiles[focusedIndex];
    tile.classList.add('tile-focused');

    // Move glow behind the tile
    if (glowEl && mainContainer) {
      const containerRect = mainContainer.getBoundingClientRect();
      const tileRect = tile.getBoundingClientRect();

      const cx = tileRect.left - containerRect.left + tileRect.width  / 2;
      const cy = tileRect.top  - containerRect.top  + tileRect.height / 2;

      const color = glowColors[focusedIndex % glowColors.length];
      glowEl.style.background = `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`;
      glowEl.style.left = `${cx - 130}px`;
      glowEl.style.top  = `${cy - 130}px`;
      glowEl.style.opacity = '1';
    }

    // Shift body background accent hue
    const hue = bgAccentHues[focusedIndex % bgAccentHues.length];
    document.documentElement.style.setProperty('--bg-accent-h', hue);

    // Update dynamic title if it exists
    const dynamicTitle = document.getElementById('dynamic-title-pill');
    const title = tile.getAttribute('data-title');
    if (dynamicTitle && title && source === 'keyboard') {
      dynamicTitle.textContent = title;
    }
  }

  /* ── Spatial navigation helpers ── */
  function getCenter(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function findNext(currentIndex, direction) {
    const current = getCenter(tiles[currentIndex]);
    let bestIndex = -1;
    let bestScore = Infinity;

    tiles.forEach((tile, i) => {
      if (i === currentIndex) return;
      const c = getCenter(tile);
      const dx = c.x - current.x;
      const dy = c.y - current.y;

      let primary, cross;
      if (direction === 'right') { primary = dx; cross = Math.abs(dy); }
      if (direction === 'left')  { primary = -dx; cross = Math.abs(dy); }
      if (direction === 'down')  { primary = dy; cross = Math.abs(dx); }
      if (direction === 'up')    { primary = -dy; cross = Math.abs(dx); }

      if (primary <= 0) return;  // Wrong direction

      const score = primary + cross * 1.6;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    return bestIndex;
  }

  /* ── Keyboard handler ── */
  document.addEventListener('keydown', (e) => {
    // BLOCK INTERACTION IF LOGIN OVERLAY IS VISIBLE
    if (document.getElementById('auth-overlay').style.display !== 'none') return;
    
    const dirMap = { ArrowRight: 'right', ArrowLeft:  'left', ArrowDown:  'down', ArrowUp:    'up' };
    const dir = dirMap[e.key];
    if (dir) {
      e.preventDefault();
      const next = findNext(focusedIndex, dir);
      if (next !== -1) setFocus(next, 'keyboard');
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement !== tiles[focusedIndex]) {
      e.preventDefault();
      tiles[focusedIndex]?.click();
    }
  });

  /* ── Mouse hover transfers focus ── */
  tiles.forEach((tile, i) => {
    tile.addEventListener('mouseenter', () => setFocus(i, 'mouse'));
  });

  // Set initial focus
  setFocus(0, 'init');
}


function initMusicBar() {
  // Legacy music bar logic disabled. Handled by CircularVisualizer.
}

function initClockWidget() {
  const timeEl = document.getElementById('top-time');
  const dateEl = document.getElementById('top-date');
  if (!timeEl || !dateEl) return;

  function updateClock() {
    const now = new Date();

    // 24h Format
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeEl.textContent = `${hours}:${minutes}`;

    // Date as MM/DD
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    dateEl.textContent = `${month}/${day}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}



function initEnvironment() {
  // Theme tile click handler
  const themeTile = document.getElementById('theme-tile');
  if (themeTile) {
    themeTile.addEventListener('click', () => {
      if (document.getElementById('auth-overlay').style.display !== 'none') return;
      if (typeof AudioManager !== 'undefined') AudioManager.playPop();
      ThemeManager.openSelector();
    });
  }

  initGifGrid();
}

function initGifGrid() {
  const grid = document.getElementById('app-grid');
  if (!grid) return;

  const gifs = [
    'assets/gif/kirby-nintendo.gif',
    'assets/gif/pokemon1.gif',
    'assets/gif/nintendo-video-game.gif'
  ];

  const appTiles = Array.from(grid.children);
  let gifIndex = 0;

  // Insert a GIF tile every 2 applications
  for (let i = 2; i < appTiles.length + (appTiles.length / 2); i += 3) {
    if (gifIndex >= gifs.length) break;

    const gifTile = document.createElement('div');
    gifTile.className = 'grid-tile tile-square gif-tile';
    gifTile.innerHTML = `
      <div class="tile-inner">
        <img src="${gifs[gifIndex]}" alt="GIF" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">
      </div>
    `;
    
    // Insert before the (i)th element
    if (grid.children[i]) {
      grid.insertBefore(gifTile, grid.children[i]);
    } else {
      grid.appendChild(gifTile);
    }
    
    gifIndex++;
  }

  // Update spatial navigation because the grid has changed
  if (window.initFocusNavigation) window.initFocusNavigation();
}

function initAppTriggers() {
  window.AppRegistry = {
    'gallery': { title: '🖼️ Image Gallery', render: null },
    'music': { title: '📻 Radio Station', render: null },
    'arcade': { title: '👾 Hall of Fame Arcade', render: null },
    'guestbook': { title: '📝 Digital Town Board', render: null },
    'notes': { title: '📓 Personal Notes', render: null },
    'hallOfFame': { title: '👾 Hall of Fame Arcade', render: null },
    'miiMaker': { title: '👤 Mii Maker', render: null },
    'miiPlaza': { title: '🏕️ Mii Plaza', render: null },
    'gba': { title: '🎮 Émulateur GBA', render: null }
  };

  const dynamicTitle = document.getElementById('dynamic-title-pill');

  const allTiles = document.querySelectorAll('.grid-tile');
  allTiles.forEach(tile => {
    tile.addEventListener('mouseenter', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      const title = tile.getAttribute('data-title');
      if (title && dynamicTitle) {
        dynamicTitle.textContent = title;
      }
    });
    tile.addEventListener('mouseleave', () => {
      if (dynamicTitle) {
        dynamicTitle.textContent = 'Hylia Plaza';
      }
    });
  });

  const triggers = document.querySelectorAll('.app-trigger');
  triggers.forEach(trigger => {
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      }
    });

      trigger.addEventListener('click', () => {
        if (document.getElementById('auth-overlay').style.display !== 'none') return;
        const appId = trigger.getAttribute('data-app');
        const appData = window.AppRegistry[appId];
        console.log('Launching appId:', appId, 'Data:', appData);

        if (appData) {
          if (appId === 'miiMaker' || appId === 'miiPlaza' || appId === 'gba') {
          // Launch custom fullscreen standalone app experience
          const fsContainer = document.createElement('div');
          fsContainer.className = 'mii-fullscreen-container';
          document.body.appendChild(fsContainer);
          document.body.classList.add('app-open-active');
          
          // Smoothly fade out the hub
          document.getElementById('main-container').style.opacity = '0';
          document.getElementById('main-container').style.transform = 'scale(0.95)';
          
          if (appData.render) {
            appData.render(fsContainer);
          }
          
          // Provide a close method for the app
          appData.close = function() {
            fsContainer.classList.add('anim-window-close');
            setTimeout(() => {
              if (fsContainer.parentNode) fsContainer.parentNode.removeChild(fsContainer);
              document.body.classList.remove('app-open-active');
              document.getElementById('main-container').style.opacity = '1';
              document.getElementById('main-container').style.transform = 'scale(1)';
            }, 300);
          };
        } else {
          WindowManager.openWindow(appId, appData.title, appData.render || function (container) {
            container.innerHTML = `
              <div class="app-inner">
                <h2>${appData.title}</h2>
                <p>Welcome to ${appData.title}. This application is currently being developed!</p>
              </div>
            `;
          });
        }
      }
    });
  });
}

function initAuth() {
  const overlay = document.getElementById('auth-overlay');
  const loginBtn = document.getElementById('btn-login');
  const registerBtn = document.getElementById('btn-register');
  const logoutBtn = document.getElementById('btn-logout');
  const usernameInput = document.getElementById('auth-username');
  const passwordInput = document.getElementById('auth-password');
  const errorMsg = document.getElementById('auth-error');
  const topUsername = document.getElementById('top-username');

  // Check if logged in via local storage fallback (Firebase auth listener will overwrite this)
  const currentUser = Auth.getCurrentUser();
  if (currentUser) {
    overlay.style.display = 'none';
    if (topUsername) topUsername.textContent = currentUser;
  } else {
    overlay.style.display = 'flex';
    generateAuthBackground();
  }

  // Make loadUserMii globally accessible so auth.js can trigger it when Firebase Auth state changes
  window.loadUserMii = async function() {
    const fbUser = window.Auth ? window.Auth.currentUser : null;
    const container = document.getElementById('top-avatar-container');
    if (!fbUser || !container) return;

    try {
      if (!window.Firestore || !window.Firestore.getDoc) return;
      const docRef = window.Firestore.doc(window.FirebaseDB, "avatars", fbUser.uid);
      const docSnap = await window.Firestore.getDoc(docRef);
      
      if (docSnap.exists()) {
        const myAvatar = docSnap.data();
        if (myAvatar && myAvatar.visual_base64) {
          const b64 = myAvatar.visual_base64;
          const thumbUrl = `https://mii-unsecure.ariankordi.net/miis/image.png?data=${encodeURIComponent(b64)}&verifyCharInfo=0&type=face&width=128&shaderType=wiiu`;
          container.innerHTML = `<img src="${thumbUrl}" style="width: 120%; height: 120%; object-fit: cover; transform: translateY(10%);">`;
        } else {
          container.innerHTML = `<span style="font-size: 24px;">👤</span>`;
        }
      } else {
        container.innerHTML = `<span style="font-size: 24px;">👤</span>`;
      }
    } catch (e) {
      console.error("Error loading user Mii for top bar:", e);
      container.innerHTML = `<span style="font-size: 24px;">👤</span>`;
    }
  }; // End of window.loadUserMii

  window.checkForcedMiiCreation = async function() {
    // Anti-duplication guard: don't trigger if a fullscreen app is already open
    if (document.querySelector('.mii-fullscreen-container')) return;

    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (user) {
      const hasMii = await window.Auth.hasMii(user);
      if (!hasMii) {
        // Double check after small delay to be sure
        setTimeout(() => {
          if (document.querySelector('.mii-fullscreen-container')) return;
          const miiMakerTile = document.querySelector('.app-trigger[data-app="miiMaker"]');
          if (miiMakerTile) miiMakerTile.click();
        }, 800); 
      }
    }
  };

  function generateAuthBackground() {
    const bgContainer = document.getElementById('auth-bg');
    if (!bgContainer || bgContainer.children.length > 2) return; // Prevent regenerating

    const faces = [
      // Normal
      '<circle cx="22" cy="22" r="2" fill="#333" /><circle cx="38" cy="22" r="2" fill="#333" /><path d="M25 32 Q30 35 35 32" stroke="#333" stroke-width="2" fill="none" />',
      // Happy
      '<path d="M18 22 Q22 18 26 22" stroke="#333" stroke-width="2" fill="none" /><path d="M34 22 Q38 18 42 22" stroke="#333" stroke-width="2" fill="none" /><path d="M25 30 Q30 36 35 30 Z" fill="#333" />',
      // Surprised
      '<circle cx="22" cy="20" r="3" fill="#333" /><circle cx="38" cy="20" r="3" fill="#333" /><circle cx="30" cy="32" r="4" fill="#333" />',
      // Sleepy
      '<path d="M18 22 L26 22" stroke="#333" stroke-width="2" fill="none" /><path d="M34 22 L42 22" stroke="#333" stroke-width="2" fill="none" /><circle cx="30" cy="32" r="2" fill="#333" />'
    ];

    const phrases = [
      "J'adore la Wii...",
      "C'est quoi ton jeu préféré ?",
      "Il fait beau aujourd'hui !",
      "Zzz...",
      "Où est la place Mii ?",
      "Nintendo !",
      "Je vais jouer à Pokémon.",
      "Hello !",
      "Tu as vu le nouveau thème ?"
    ];

    for (let i = 0; i < 40; i++) {
      const hue = Math.floor(Math.random() * 360);
      const face = faces[Math.floor(Math.random() * faces.length)];
      
      const svg = document.createElement('div');
      svg.className = 'auth-mii';
      
      // Random position and animation properties
      const left = Math.random() * 100;
      const size = 0.5 + Math.random() * 1.5; // Scale between 0.5 and 2
      const duration = 10 + Math.random() * 20; // 10 to 30 seconds
      const delay = Math.random() * -30; // Negative delay to start at random points
      
      svg.style.left = `${left}%`;
      svg.style.transform = `scale(${size})`;
      svg.style.animationDuration = `${duration}s`;
      svg.style.animationDelay = `${delay}s`;
      // Small random z-index so they overlap interestingly
      svg.style.zIndex = Math.floor(Math.random() * 10);
      
      // Randomly decide if this Mii gets a bubble (20% chance)
      let bubbleHtml = '';
      if (Math.random() > 0.8) {
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        const bubbleDelay = Math.random() * 5; // offset bubble animation
        bubbleHtml = `<div class="auth-bubble" style="animation: popBubble 8s ${bubbleDelay}s infinite;">${phrase}</div>`;
      }
      
      svg.innerHTML = `
        ${bubbleHtml}
        <svg viewBox="0 0 60 90" width="60" height="90" style="filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));">
          <path d="M15 45 Q30 40 45 45 L40 85 Q30 90 20 85 Z" fill="hsl(${hue}, 70%, 50%)" />
          <path d="M17 46 Q30 41 43 46 L38 84 Q30 88 22 84 Z" fill="hsl(${hue}, 70%, 60%)" />
          <path d="M20 48 Q30 43 40 48 L35 80 Q30 84 25 80 Z" fill="hsl(${hue}, 70%, 75%)" />
          <circle cx="30" cy="25" r="20" fill="#e6c2a5" />
          <circle cx="28" cy="23" r="18" fill="#ffdfc4" />
          <g class="avatar-face">
            ${face}
          </g>
        </svg>
      `;
      bgContainer.appendChild(svg);
    }
  }

  function handleAuthResponse(res) {
    if (res.success) {
      errorMsg.style.display = 'none';
      errorMsg.style.color = '#7eff7e'; // green success
      errorMsg.textContent = res.message;
      
      // Short delay for user feedback on successful registration/login
      setTimeout(() => {
        const user = Auth.getCurrentUser();
        if (user) {
          overlay.style.display = 'none';
          if (topUsername) topUsername.textContent = user;
          checkForcedMiiCreation();
        }
      }, 500);
    } else {
      errorMsg.style.color = '#ff6b6b';
      errorMsg.style.display = 'block';
      errorMsg.textContent = res.message;
    }
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      loginBtn.disabled = true;
      loginBtn.textContent = '...';
      const res = await Auth.login(usernameInput.value, passwordInput.value);
      loginBtn.disabled = false;
      loginBtn.textContent = 'Connexion';
      handleAuthResponse(res);
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      registerBtn.disabled = true;
      registerBtn.textContent = '...';
      const res = await Auth.register(usernameInput.value, passwordInput.value);
      registerBtn.disabled = false;
      registerBtn.textContent = 'Créer un compte';
      handleAuthResponse(res);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (window.Auth) window.Auth.logout();
    });
  }
} // End of initAuth

