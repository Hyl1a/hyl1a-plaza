/**
 * Main application initialization.
 * Coordinates the environment, background animations, and UI triggers.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize audio (preload MP3/WAV files from Son/ folder)
  if (typeof AudioManager !== 'undefined') {
    AudioManager.init();
  }

  initEnvironment();
  initAppTriggers();
  initClockWidget();
  initMusicBar();
  initAuth(); // Initialize authentication system

  // Auto-play music on first user interaction (browser requires user gesture)
  function autoPlayOnce() {
    if (typeof AudioManager !== 'undefined' && !AudioManager.isPlayingMusic && !AudioManager.isExternalMusicPlaying) {
      AudioManager.playNextMusic();
      // Update music bar display
      const playBtn = document.getElementById('music-play');
      const trackName = document.getElementById('music-track-name');
      if (playBtn) { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
      if (trackName && AudioManager.playlist[AudioManager.currentTrackIndex]) {
        trackName.textContent = AudioManager.playlist[AudioManager.currentTrackIndex].name;
      }
    }
    document.removeEventListener('click', autoPlayOnce);
    document.removeEventListener('keydown', autoPlayOnce);
  }
  document.addEventListener('click', autoPlayOnce);
  document.addEventListener('keydown', autoPlayOnce);
});

function initMusicBar() {
  const playBtn = document.getElementById('music-play');
  const nextBtn = document.getElementById('music-next');
  const prevBtn = document.getElementById('music-prev');
  const trackName = document.getElementById('music-track-name');

  if (!playBtn || typeof AudioManager === 'undefined') return;

  function updateTrackDisplay() {
    if (AudioManager.isPlayingMusic && AudioManager.playlist[AudioManager.currentTrackIndex]) {
      trackName.textContent = AudioManager.playlist[AudioManager.currentTrackIndex].name;
      playBtn.textContent = '⏸';
      playBtn.classList.add('playing');
    } else {
      trackName.textContent = 'Aucune musique';
      playBtn.textContent = '▶';
      playBtn.classList.remove('playing');
    }
  }

  playBtn.addEventListener('click', () => {
    if (AudioManager.isPlayingMusic) {
      AudioManager.pauseMusic();
    } else {
      AudioManager.playNextMusic();
    }
    updateTrackDisplay();
  });

  nextBtn.addEventListener('click', () => {
    AudioManager.playNextMusic();
    updateTrackDisplay();
  });

  prevBtn.addEventListener('click', () => {
    // Go to previous track
    if (AudioManager.currentTrackIndex <= 0) {
      AudioManager.currentTrackIndex = AudioManager.playlist.length - 1;
    } else {
      AudioManager.currentTrackIndex -= 2; // -2 because playNextMusic will +1
    }
    AudioManager.playNextMusic();
    updateTrackDisplay();
  });
}

function initClockWidget() {
  const timeEl = document.getElementById('top-time');
  const dateEl = document.getElementById('top-date');
  if (!timeEl || !dateEl) return;

  function updateClock() {
    const now = new Date();

    // Time in 12h format like the Wii U
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeEl.textContent = `${hours}:${minutes} ${ampm}`;

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
      if (typeof AudioManager !== 'undefined') AudioManager.playPop();
      ThemeManager.openSelector();
    });
  }
}

function initAppTriggers() {
  // Map app names to their window content renderers and nice titles
  // These renderers will be populated by the individual app scripts
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

  // Handle ALL grid tiles (both app-trigger and placeholder-app) for hover title
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

  // Handle app-trigger tiles for opening windows
  const triggers = document.querySelectorAll('.app-trigger');
  triggers.forEach(trigger => {
    // Keyboard accessibility
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      }
    });

    // Click action
    trigger.addEventListener('click', () => {
      const appId = trigger.getAttribute('data-app');
      const appData = window.AppRegistry[appId];

      if (appData) {
        if (appId === 'miiMaker' || appId === 'miiPlaza') {
          // Launch custom fullscreen standalone app experience
          const fsContainer = document.createElement('div');
          fsContainer.className = 'mii-fullscreen-container';
          document.body.appendChild(fsContainer);
          if (appData.render) {
            appData.render(fsContainer);
          }
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

  // Check if logged in
  const currentUser = Auth.getCurrentUser();
  if (currentUser) {
    overlay.style.display = 'none';
    if (topUsername) topUsername.textContent = currentUser;
    loadUserMii();
    checkForcedMiiCreation();
  } else {
    overlay.style.display = 'flex';
    generateAuthBackground();
  }

  async function loadUserMii() {
    const user = Auth.getCurrentUser();
    const fbUser = window.Auth ? window.Auth.currentUser : null;
    const container = document.getElementById('top-avatar-container');
    if (!fbUser || !container) return;

    try {
      const docRef = window.Firestore.doc(window.FirebaseDB, "avatars", fbUser.uid);
      const docSnap = await window.Firestore.getDoc(docRef);
      
      if (docSnap.exists()) {
        const myAvatar = docSnap.data();
        if (myAvatar && myAvatar.visual_base64) {
          const b64 = myAvatar.visual_base64;
          const thumbUrl = `https://mii-unsecure.ariankordi.net/miis/image.png?data=${encodeURIComponent(b64)}&verifyCharInfo=0&type=face&width=96&shaderType=wiiu`;
          container.innerHTML = `<img src="${thumbUrl}" style="width: 100%; height: 100%; object-fit: contain;">`;
        } else {
          container.innerHTML = `<span style="font-size: 20px;">👤</span>`;
        }
      } else {
        container.innerHTML = `<span style="font-size: 20px;">👤</span>`;
      }
    } catch (e) {
      console.error("Error loading user Mii for top bar:", e);
      container.innerHTML = `<span style="font-size: 20px;">👤</span>`;
    }
  }

  async function checkForcedMiiCreation() {
    const user = Auth.getCurrentUser();
    if (user) {
      const hasMii = await Auth.hasMii(user);
      if (!hasMii) {
        // Simulate click on the Mii Maker tile
        setTimeout(() => {
          const miiMakerTile = document.querySelector('.app-trigger[data-app="miiMaker"]');
          if (miiMakerTile) miiMakerTile.click();
        }, 500); // Small delay to let plaza render first
      }
    }
  }

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
      Auth.logout();
    });
  }
}
