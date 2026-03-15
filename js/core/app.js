document.addEventListener('DOMContentLoaded', () => {
  // Initialize audio (preload MP3/WAV files from Son/ folder)
  if (typeof AudioManager !== 'undefined') {
    AudioManager.init();
  }

  initEnvironment();
  initAppTriggers();
  // initFocusNavigation();   // Legacy console-style tile focus
  initClockWidget();
  initMusicBar();          // Initialize song controls
  initAuth(); // Initialize authentication system
  initMiiPlaza();         // Initialize Mii background characters
  initCompanion();        // Initialize virtual companion

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

  // Try aggressive immediate autoplay (might be blocked by browser policy)
  setTimeout(() => {
    if (typeof AudioManager !== 'undefined' && !AudioManager.isPlayingMusic) {
      try {
        AudioManager.playNextMusic();
        if (window.updateVisualizerDisplay) window.updateVisualizerDisplay();
        document.removeEventListener('click', autoPlayOnce);
        document.removeEventListener('keydown', autoPlayOnce);
      } catch (e) { /* Blocked by browser */ }
    }
  }, 1000);

  // Fallback: start on first interaction if blocked
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

  window.setGlobalHueFromIndex = (index) => {
    const hue = bgAccentHues[index % bgAccentHues.length];
    document.documentElement.style.setProperty('--bg-accent-h', hue);

    // Also update tile glow variables for visualizer/carousel sync
    const glowColorsSolid = ['#4facfe', '#ff9a56', '#6adae4', '#c471ed', '#43e97b', '#ff758c', '#a38cd1', '#ffd364'];
    const glowColorsSoft = [
      'rgba(79,172,254,0.4)', 'rgba(255,154,86,0.4)', 'rgba(106,218,228,0.4)',
      'rgba(196,113,237,0.4)', 'rgba(67,233,123,0.4)', 'rgba(255,117,140,0.4)',
      'rgba(163,140,209,0.4)', 'rgba(255,211,100,0.4)'
    ];
    document.documentElement.style.setProperty('--tile-glow', glowColorsSoft[index % glowColorsSoft.length]);
    document.documentElement.style.setProperty('--tile-glow-solid', glowColorsSolid[index % glowColorsSolid.length]);
  };

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

      const cx = tileRect.left - containerRect.left + tileRect.width / 2;
      const cy = tileRect.top - containerRect.top + tileRect.height / 2;

      const color = glowColors[focusedIndex % glowColors.length];
      glowEl.style.background = `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`;
      glowEl.style.left = `${cx - 130}px`;
      glowEl.style.top = `${cy - 130}px`;
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
      if (direction === 'left') { primary = -dx; cross = Math.abs(dy); }
      if (direction === 'down') { primary = dy; cross = Math.abs(dx); }
      if (direction === 'up') { primary = -dy; cross = Math.abs(dx); }

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
    if (document.body.classList.contains('app-open-active')) return;
    if (document.querySelector('.mii-fullscreen-container')) return;

    const dirMap = { ArrowRight: 'right', ArrowLeft: 'left', ArrowDown: 'down', ArrowUp: 'up' };
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
  // setFocus(0, 'init');
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
  // initGifGrid(); // Disabled: user request to remove gifs
}

// function initGifGrid() { ... } removed as per user request

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
    'gba': { title: '🎮 Émulateur GBA', render: null },
    'gbaTurbo': { title: '🚀 GBA Turbo', render: (c) => window.gbaTurbo.open(c) },
    'miiManager': { 
        title: '⚠️ Mii Manager', 
        render: (container) => {
          if (window.MiiManager) window.MiiManager.open(container);
        } 
      },
    'themes': {
      title: '🎨 Thèmes & Couleurs', render: () => {
        if (typeof ThemeManager !== 'undefined') ThemeManager.openSelector();
      }
    },
    'bio': {
      title: '👤 À propos de Hyl1a', render: (container) => {
        container.innerHTML = `
        <div class="bio-window">
          <div class="bio-header">
            <img src="assets/icons/bobaboy.jpg" class="bio-avatar">
            <div class="bio-title-group">
              <h1>Hyl1a</h1>
              <p>Developer • 20 years old</p>
            </div>
          </div>
          <div class="bio-content">
            <p>J'ai voulu créer un projet similaire à <strong>IISU</strong> mais sur navigateur pour pouvoir jouer directement sur le web avec une gestion fluide de sauvegarde et de compte.</p>
            <div class="bio-socials">
              <div class="social-item"><i class="fas fa-envelope"></i> mohznpro@gmail.com</div>
              <div class="social-item"><i class="fab fa-discord"></i> hyl1a_</div>
              <a href="https://discord.gg/ww4A6BAz" target="_blank" class="social-btn discord-server">Join my Discord</a>
            </div>
            <div class="bio-projects">
              <h3>Mes autres projets</h3>
              <a href="https://hyl1a.github.io/Hyl1a-web/" target="_blank" class="project-card">
                <div class="project-info">
                  <strong>Hyl1a Web</strong>
                  <span>Frutiger Aero aesthetic website</span>
                </div>
                <i class="fas fa-external-link-alt"></i>
              </a>
            </div>
          </div>
        </div>
      `;
      }
    }
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
  });
}

window.showSplashScreen = function (callback) {
  const splash = document.getElementById('app-splash-screen');
  if (!splash) {
    if (callback) callback();
    return;
  }

  splash.classList.remove('splash-exit');
  splash.classList.add('splash-visible');

  // Wait for the pop-in + hover time (Reduced to 800ms for faster feel)
  setTimeout(() => {
    splash.classList.add('splash-exit');

    // Wait for pop-out animation
    setTimeout(() => {
      splash.classList.remove('splash-visible', 'splash-exit');
      if (callback) callback();
    }, 300); // Slightly faster pop-out
  }, 800);
};

window.handleAppLaunch = function (trigger) {
  if (document.getElementById('auth-overlay').style.display !== 'none') return;

  const appId = trigger.getAttribute('data-app');
  const appData = window.AppRegistry[appId];
  console.log('Launching appId:', appId, 'Data:', appData);

  if (appData) {
    // AUDIO TRIGGER: Play sound as soon as splash appears
    if (typeof AudioManager !== 'undefined') {
      if (appId === 'miiMaker') {
        AudioManager.playAppLaunchTransition('miiLaunch');
      } else if (appId === 'gba') {
        AudioManager.playAppLaunchTransition('gbaLaunch', 'gbaBgm');
      } else {
        // Fallback: Play default launch sound for other apps
        if (appId !== 'themes') {
          AudioManager.playAppLaunchTransition('defaultLaunch');
        }
      }
    }

    // Show splash screen
    window.showSplashScreen(() => {
      if (appId === 'miiMaker' || appId === 'miiPlaza' || appId === 'gba' || appId === 'gbaTurbo') {
        const fsContainer = document.createElement('div');
        fsContainer.className = 'mii-fullscreen-container';
        document.body.appendChild(fsContainer);
        document.body.classList.add('app-open-active');

        document.getElementById('main-container').style.opacity = '0';
        document.getElementById('main-container').style.transform = 'scale(0.95)';

        if (appData.render) {
          appData.render(fsContainer);
        }

        // Music logic for Mii Plaza specifically (it doesn't have its own transition sound/music in registry usually)
        if (appId === 'miiPlaza') {
          if (typeof AudioManager !== 'undefined') AudioManager.fadeIn(800);
        }

        appData.close = function () {
          fsContainer.classList.add('anim-window-close');

          if (typeof AudioManager !== 'undefined') {
            AudioManager.restoreHubAudio();
          }

          setTimeout(() => {
            if (fsContainer.parentNode) fsContainer.parentNode.removeChild(fsContainer);
            document.body.classList.remove('app-open-active');
            document.getElementById('main-container').style.opacity = '1';
            document.getElementById('main-container').style.transform = 'scale(1)';
          }, 300);
        };
      } else if (appId === 'themes') {
        if (appData.render) appData.render();
        if (typeof AudioManager !== 'undefined') AudioManager.playPop();
      } else {
        // Windowed apps: open window and fade hub music back in
        WindowManager.openWindow(appId, appData.title, appData.render || function (container) {
          container.innerHTML = `
            <div class="app-inner">
              <h2>${appData.title}</h2>
              <p>Welcome to ${appData.title}. This application is currently being developed!</p>
            </div>
          `;
        });

        // Resume hub music for windowed apps
        if (typeof AudioManager !== 'undefined' && appId !== 'music') {
          AudioManager.fadeIn(800);
        }
      }
    });
  }
};

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
  window.loadUserMii = async function () {
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

  window.checkForcedMiiCreation = async function () {
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

  async function generateAuthBackground() {
    const bgContainer = document.getElementById('auth-bg');
    if (!bgContainer || bgContainer.children.length > 2) return; // Prevent regenerating

    let avatars = [];

    // Try to fetch real Miis from Firestore
    if (window.Firestore && window.FirebaseDB) {
      try {
        const avatarsRef = window.Firestore.collection(window.FirebaseDB, "avatars");
        const qSnap = await window.Firestore.getDocs(avatarsRef);
        qSnap.forEach(doc => {
          if (doc.data().visual_base64 && doc.data().username) {
            avatars.push({
              b64: doc.data().visual_base64,
              username: doc.data().username
            });
          }
        });
      } catch (e) {
        console.warn("Could not fetch real Miis for background, falling back to SVGs", e);
      }
    }

    const totalMiisToGenerate = 15;

    // Fallback data if no real Miis
    const faces = [
      '<circle cx="22" cy="22" r="2" fill="#333" /><circle cx="38" cy="22" r="2" fill="#333" /><path d="M25 32 Q30 35 35 32" stroke="#333" stroke-width="2" fill="none" />',
      '<path d="M18 22 Q22 18 26 22" stroke="#333" stroke-width="2" fill="none" /><path d="M34 22 Q38 18 42 22" stroke="#333" stroke-width="2" fill="none" /><path d="M25 30 Q30 36 35 30 Z" fill="#333" />',
      '<circle cx="22" cy="20" r="3" fill="#333" /><circle cx="38" cy="20" r="3" fill="#333" /><circle cx="30" cy="32" r="4" fill="#333" />',
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

    for (let i = 0; i < totalMiisToGenerate; i++) {
      const svg = document.createElement('div');
      svg.className = 'auth-mii';

      const left = Math.random() * 100;
      const size = 1.0 + Math.random() * 2.5; // SLIGHT REDUCTION: from [1.5, 5.5] to [1.0, 3.5]
      const duration = 12 + Math.random() * 30;
      const delay = Math.random() * -60;

      svg.style.left = `${left}%`;
      svg.style.setProperty('--mii-scale', size);
      svg.style.animationDuration = `${duration}s`;
      svg.style.animationDelay = `${delay}s`;
      svg.style.zIndex = Math.floor(Math.random() * 5);
      let bubbleHtml = '';
      let miiContentHtml = '';

      if (avatars.length > 0) {
        // Pick a random real Mii
        const realMii = avatars[Math.floor(Math.random() * avatars.length)];
        const thumbUrl = `https://mii-unsecure.ariankordi.net/miis/image.png?data=${encodeURIComponent(realMii.b64)}&verifyCharInfo=0&type=face&width=128&shaderType=wiiu`;
        miiContentHtml = `<img src="${thumbUrl}" style="width: 60px; height: 60px; object-fit: cover; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5)); border-radius: 50%;">`;

        if (Math.random() > 0.8) {
          const bubbleDelay = Math.random() * 5;
          bubbleHtml = `<div class="auth-bubble" style="animation: popBubble 8s ${bubbleDelay}s infinite;">${realMii.username} : ${phrases[Math.floor(Math.random() * phrases.length)]}</div>`;
        }
      } else {
        // Fallback SVG Mii
        const hue = Math.floor(Math.random() * 360);
        const face = faces[Math.floor(Math.random() * faces.length)];

        miiContentHtml = `
          <svg viewBox="0 0 60 90" width="60" height="90" style="filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));">
            <path d="M15 45 Q30 40 45 45 L40 85 Q30 90 20 85 Z" fill="hsl(${hue}, 70%, 50%)" />
            <path d="M17 46 Q30 41 43 46 L38 84 Q30 88 22 84 Z" fill="hsl(${hue}, 70%, 60%)" />
            <path d="M20 48 Q30 43 40 48 L35 80 Q30 84 25 80 Z" fill="hsl(${hue}, 70%, 75%)" />
            <circle cx="30" cy="25" r="20" fill="#e6c2a5" />
            <circle cx="28" cy="23" r="18" fill="#ffdfc4" />
            <g class="avatar-face">${face}</g>
          </svg>
        `;

        if (Math.random() > 0.8) {
          const phrase = phrases[Math.floor(Math.random() * phrases.length)];
          const bubbleDelay = Math.random() * 5;
          bubbleHtml = `<div class="auth-bubble" style="animation: popBubble 8s ${bubbleDelay}s infinite;">${phrase}</div>`;
        }
      }

      svg.innerHTML = `
        ${bubbleHtml}
        ${miiContentHtml}
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

function initCompanion() {
  const widget = document.getElementById('companion-widget');
  const bubble = document.getElementById('companion-bubble');
  const glass = document.querySelector('.companion-glass');

  if (!widget || !bubble || !glass) return;

  const phrases = [
    "Poyo",
    "Tu veux jouer à quoi frro ?",
    "Hylia Plaza est trop cool ! (stp dis le)",
    "Coucou !",
    "C'est une belle journée !",
    "J'adore la musique ici !",
    "Tema, je flotte !",
    "Mii Maker est trop bien",
    "Tu as vu le nouveau thème ?"
  ];

  let bubbleTimeout;

  const showBubble = (text) => {
    bubble.textContent = text || phrases[Math.floor(Math.random() * phrases.length)];
    bubble.classList.add('show');

    clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(() => {
      bubble.classList.remove('show');
    }, 4000);
  };

  glass.addEventListener('click', () => {
    showBubble();
    if (typeof AudioManager !== 'undefined') {
      AudioManager.playPop();
    }
  });

  // Small random greeting on hub load
  setTimeout(() => showBubble("Poyo ! ✨"), 3000);

  // Random interaction every minute
  setInterval(() => {
    if (Math.random() > 0.6 && document.getElementById('auth-overlay').style.display === 'none') {
      showBubble();
    }
  }, 60000);
}

