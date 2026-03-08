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

  // Auto-play music on first user interaction (browser requires user gesture)
  function autoPlayOnce() {
    if (typeof AudioManager !== 'undefined' && !AudioManager.isPlayingMusic) {
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
    'miiPlaza': { title: '🏕️ Mii Plaza', render: null }
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
