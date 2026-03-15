/**
 * Audio Manager
 * Loads all sounds from the Son/ folder as MP3/WAV files.
 * 
 * ═══════════════════════════════════════════════════════════
 *  GUIDE DES SONS — Son/ Folder
 * ═══════════════════════════════════════════════════════════
 *
 *  EFFETS SONORES (UI):
 *  ────────────────────
 *  click_survol_tuile.wav   → Joue quand on SURVOLE une tuile de la grille
 *  pop_interaction.wav      → Joue quand on CLIQUE sur un avatar ou un thème
 *  ouverture_fenetre.wav    → Joue quand on OUVRE une fenêtre d'application
 *  fermeture_fenetre.wav    → Joue quand on FERME une fenêtre
 *
 *  MUSIQUES DE FOND:
 *  ─────────────────
 *  musique_plaza_morning.wav  → Musique d'ambiance #1 "Plaza Morning"
 *  musique_mii_channel.wav    → Musique d'ambiance #2 "Mii Channel Vibe"
 *  musique_shop_ambient.wav   → Musique d'ambiance #3 "Shop Ambient"
 *
 *  💡 Pour changer un son: remplacez simplement le fichier dans
 *     le dossier assets/audio/ par votre propre fichier MP3 ou WAV
 *     en gardant le MÊME NOM de fichier.
 *
 * ═══════════════════════════════════════════════════════════
 */

const AudioManager = {
  sounds: {},
  isMuted: false,
  isPlayingMusic: false,
  currentMusicAudio: null,
  currentTrackIndex: -1,
  isExternalMusicPlaying: false, // Flag for Mii Maker etc.
  _pendingConnectSuccess: false,

  // Sound file mapping
  soundFiles: {
    click: 'assets/audio/click_survol_tuile.wav',
    pop: 'assets/audio/pop_interaction.wav',
    windowOpen: 'assets/audio/ouverture_fenetre.wav',
    windowClose: 'assets/audio/fermeture_fenetre.wav',
    connectSuccess: 'assets/audio/CONNECT_SUCCESS.wav',
    miiLaunch: 'assets/audio/MiiSF.wav',
    gbaLaunch: 'assets/audio/EmuSF.wav',
    gbaBgm: 'assets/audio/GbaSF.mp3',
    defaultLaunch: 'assets/audio/launchD.mp3'
  },

  // Music playlist
  playlist: [
    { name: 'Eshop January 2016', file: 'assets/audio/Eshop January 2016.wav', cover: 'assets/icons/eshop.png' },
    { name: 'Eshop July 2014', file: 'assets/audio/Eshop July 2014.wav', cover: 'assets/icons/eshop.png' },
    { name: 'Eshop June 2015', file: 'assets/audio/Eshop June 2015.wav', cover: 'assets/icons/eshop.png' },
    { name: 'BXNJI', file: 'assets/audio/bxnji.mp3', cover: 'assets/icons/nico.png' },
    { name: 'Thoughtbody', file: 'assets/audio/thoughtbody.mp3', cover: 'assets/icons/nico.png' }
  ],

  init: function () {
    if (this._initialized) return;
    // Preload all UI sound effects
    Object.entries(this.soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.4;
      this.sounds[key] = audio;
    });
    this._initialized = true;
  },

  _play: function (key) {
    if (this.isMuted) return;
    if (!this._initialized) this.init(); // Auto-init if needed
    const sound = this.sounds[key];
    if (sound) {
      // Clone so overlapping plays work
      const clone = sound.cloneNode();
      clone.volume = sound.volume;
      clone.play().catch(() => { }); // Ignore autoplay blocks
    }
  },

  // --- UI Sound Effects ---

  playClick: function () {
    this._play('click');
  },

  playPop: function () {
    this._play('pop');
  },

  playWindowOpen: function () {
    this._play('windowOpen');
  },

  playWindowClose: function () {
    this._play('windowClose');
  },

  playConnectSuccess: function () {
    const sound = this.sounds['connectSuccess'];
    if (sound) {
      sound.play().catch(() => {
        // If blocked by browser, set flag to play on first click
        this._pendingConnectSuccess = true;
        this._setupInteractionFallback();
      });
    }
  },

  _setupInteractionFallback: function() {
    if (this._hasSetupFallback) return;
    const playPending = () => {
      if (this._pendingConnectSuccess) {
        this._play('connectSuccess');
        this._pendingConnectSuccess = false;
      }
      document.removeEventListener('click', playPending);
      document.removeEventListener('keydown', playPending);
    };
    document.addEventListener('click', playPending);
    document.addEventListener('keydown', playPending);
    this._hasSetupFallback = true;
  },

  // --- Music Playback ---

  initAudioContext: function() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  },

  playNextMusic: function () {
    this.pauseMusic();
    this.initAudioContext();

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    let nextIndex;
    
    // Force 'BXNJI' to play first if this is the very first track
    if (this.currentTrackIndex === -1) {
      nextIndex = this.playlist.findIndex(t => t.name.toLowerCase() === 'bxnji');
      if (nextIndex === -1) nextIndex = 0; // Fallback just in case
    } else if (this.playlist.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * this.playlist.length);
      } while (nextIndex === this.currentTrackIndex);
    } else {
      nextIndex = 0;
    }

    this.currentTrackIndex = nextIndex;
    const track = this.playlist[this.currentTrackIndex];

    this.currentMusicAudio = new Audio(track.file);
    this.currentMusicAudio.volume = 0.3;
    this.currentMusicAudio.loop = false; // Disable loop to handle onended
    
    // Connect to Web Audio API
    if (this.ctx && this.analyser) {
      if (this._sourceNode) this._sourceNode.disconnect();
      this._sourceNode = this.ctx.createMediaElementSource(this.currentMusicAudio);
      this._sourceNode.connect(this.analyser);
    }

    this.currentMusicAudio.play().catch(() => { });

    this.currentMusicAudio.onended = () => {
      this.playNextMusic();
      // Broadcast update to UI if it's listening
      if (window.updateVisualizerDisplay) window.updateVisualizerDisplay();
    };

    this.isPlayingMusic = true;
  },

  pauseMusic: function () {
    if (this.currentMusicAudio) {
      this.currentMusicAudio.pause();
      this.currentMusicAudio.currentTime = 0;
      this.currentMusicAudio = null;
    }
    this.isPlayingMusic = false;
  },

  // --- Crossfade helpers ---
  _savedVolume: 0.3,

  fadeOut: function (duration) {
    return new Promise((resolve) => {
      if (!this.currentMusicAudio) { resolve(); return; }
      const audio = this.currentMusicAudio;
      this._savedVolume = audio.volume;
      const steps = 20;
      const stepTime = (duration || 800) / steps;
      const volStep = audio.volume / steps;
      let i = 0;
      const iv = setInterval(() => {
        i++;
        audio.volume = Math.max(0, this._savedVolume - volStep * i);
        if (i >= steps) { clearInterval(iv); audio.pause(); resolve(); }
      }, stepTime);
    });
  },

  fadeIn: function (duration) {
    if (!this.currentMusicAudio) return;
    const audio = this.currentMusicAudio;
    const target = this._savedVolume || 0.3;
    audio.volume = 0;
    audio.play().catch(() => {});
    const steps = 20;
    const stepTime = (duration || 800) / steps;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      audio.volume = Math.min(target, (target / steps) * i);
      if (i >= steps) clearInterval(iv);
    }, stepTime);
  },

  // --- App Special Transitions ---
  
  playAppLaunchTransition: async function(sfKey, bgmKey) {
    // 1. Fade out hub music
    await this.fadeOut(600);
    
    // 2. Play the launch SFX
    if (sfKey && this.soundFiles[sfKey]) {
      const sfx = new Audio(this.soundFiles[sfKey]);
      sfx.volume = 0.5;
      sfx.play().catch(() => {});
    }
    
    // 3. Start new BGM if provided
    if (bgmKey && this.soundFiles[bgmKey]) {
      setTimeout(() => {
        this.appBgm = new Audio(this.soundFiles[bgmKey]);
        this.appBgm.volume = 0;
        this.appBgm.loop = true;
        this.appBgm.play().catch(() => {});
        
        // Fade in app music
        let vol = 0;
        const iv = setInterval(() => {
          vol += 0.05;
          if (this.appBgm) this.appBgm.volume = Math.min(0.4, vol);
          if (vol >= 0.4) clearInterval(iv);
        }, 50);
      }, 500);
    }
  },
  
  restoreHubAudio: async function() {
    // 1. Fade out app music if any
    if (this.appBgm) {
      const audio = this.appBgm;
      const steps = 10;
      const volStep = audio.volume / steps;
      let i = 0;
      const iv = setInterval(() => {
        i++;
        audio.volume = Math.max(0, audio.volume - volStep);
        if (i >= steps) {
          clearInterval(iv);
          audio.pause();
          this.appBgm = null;
        }
      }, 50);
      
      await new Promise(r => setTimeout(r, 600));
    }
    
    // 2. Fade in hub music
    this.playNextMusic(); // Restarts hub playlist with fade internally? 
    // Actually playNextMusic doesn't fade in. Let's force it.
    setTimeout(() => {
      this.fadeIn(600);
    }, 100);
  }
};
