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

  // Sound file mapping
  soundFiles: {
    click: 'assets/audio/click_survol_tuile.wav',
    pop: 'assets/audio/pop_interaction.wav',
    windowOpen: 'assets/audio/ouverture_fenetre.wav',
    windowClose: 'assets/audio/fermeture_fenetre.wav'
  },

  // Music playlist
  playlist: [
    { name: 'Eshop January 2016', file: 'assets/audio/Eshop January 2016.wav' },
    { name: 'Eshop July 2014', file: 'assets/audio/Eshop July 2014.wav' },
    { name: 'Eshop June 2015', file: 'assets/audio/Eshop June 2015.wav' }
  ],

  init: function () {
    // Preload all UI sound effects
    Object.entries(this.soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.4;
      this.sounds[key] = audio;
    });
  },

  _play: function (key) {
    if (this.isMuted) return;
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

  // --- Music Playback ---

  playNextMusic: function () {
    this.pauseMusic();

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    const track = this.playlist[this.currentTrackIndex];

    this.currentMusicAudio = new Audio(track.file);
    this.currentMusicAudio.volume = 0.3;
    this.currentMusicAudio.loop = true;
    this.currentMusicAudio.play().catch(() => { });

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
  }
};
