// Mii Maker Implementation – Redesigned to match datkat21/mii-creator style
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.AppRegistry) {
      window.AppRegistry['miiMaker'].render = async function (container) {
        if (document.querySelector('.mii-fullscreen-container > .mii-topbar')) {
          console.warn("Mii Maker is already open.");
          return;
        }
        if (typeof AudioManager !== 'undefined') AudioManager.isExternalMusicPlaying = true;
        // Clean up any lingering login welcome messages
        const oldWelcome = document.getElementById('login-welcome-msg');
        if (oldWelcome) oldWelcome.remove();
        
        // Show gender selection first
        renderGenderSelection(container);
      };
    }
  }, 100);
});

// --- Asset Colors ---
const SKINS = ['#feedcf', '#f7d3a0', '#edb278', '#d38b58', '#9d6343', '#834c31', '#512f1f'];
const HAIRS = ['#1d1c1a', '#3f3123', '#663b21', '#85512b', '#7c6d66', '#a98059', '#b5a16d', '#bc9c65'];
const EYES_COLORS = ['#3f3530', '#7a818c', '#533c30', '#837b2d', '#426899', '#5d8050'];
const SHIRTS = ['#ff3333', '#ff6600', '#ffcc00', '#33cc33', '#3366ff', '#66ccff', '#9933cc', '#ff66cc', '#ffffff', '#888888', '#222222'];

// --- Category Definitions ---
const CATEGORIES = [
  { id: 'face', icon: 'assets/icons/caté/visageI.png', label: 'Face' },
  { id: 'hair', icon: 'assets/icons/caté/cheveuxI.png', label: 'Hair' },
  { id: 'eyebrows', icon: 'assets/icons/caté/brow.png', label: 'Brows' },
  { id: 'eyes', icon: 'assets/icons/caté/oeilI.png', label: 'Eyes' },
  { id: 'nose', icon: 'assets/icons/caté/nezI.png', label: 'Nose' },
  { id: 'mouth', icon: 'assets/icons/caté/boucheI.png', label: 'Mouth' },
  { id: 'glasses', icon: 'assets/icons/caté/accsI.png', label: 'Glasses' },
  { id: 'body', icon: 'assets/icons/caté/gars.png', label: 'Body' },
  { id: 'profile', icon: '📝', label: 'Profile' },
];

// --- Hair / Eye / Brow / Mouth / Nose style data (ALL valid values) ---
// Helper to generate style arrays from a range
function makeStyles(max) {
  const arr = [];
  for (let i = 0; i <= max; i++) arr.push({ v: i, n: 'Style ' + i });
  return arr;
}
const HAIR_STYLES = makeStyles(131);
const EYE_STYLES = makeStyles(59);
const BROW_STYLES = makeStyles(23);
const MOUTH_STYLES = makeStyles(35);
const NOSE_STYLES = makeStyles(17);
const GLASSES_STYLES = [{ v: 0, n: 'None' }].concat(makeStyles(8).slice(1));
const FACE_STYLES = makeStyles(11);

let miiInstance = null;
let currentGLBModel = null;

/**
 * Render the gender selection screen
 */
function renderGenderSelection(container) {
  container.innerHTML = `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle, #2a2a4a 0%, #1a1a2e 100%); color: white; border-radius: 20px; overflow: hidden; position: relative; font-family: 'Outfit', sans-serif;">
      <h2 style="font-size: 32px; margin-bottom: 40px; text-shadow: 0 4px 10px rgba(0,0,0,0.5); animation: fadeInDown 0.8s ease-out;">Choisissez le genre</h2>
      <div style="display: flex; gap: 40px; animation: fadeInUp 0.8s ease-out;">
        <button id="select-male" style="background: rgba(255,255,255,0.1); border: 4px solid #7ec4ff; border-radius: 30px; padding: 30px; cursor: pointer; transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); display: flex; flex-direction: column; align-items: center; gap: 15px;">
          <img src="assets/icons/caté/gars.png" style="width: 120px; height: 120px; object-fit: contain; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));">
          <span style="font-size: 20px; font-weight: 800; color: #7ec4ff;">Homme</span>
        </button>
        <button id="select-female" style="background: rgba(255,255,255,0.1); border: 4px solid #ff7eb3; border-radius: 30px; padding: 30px; cursor: pointer; transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); display: flex; flex-direction: column; align-items: center; gap: 15px;">
          <img src="assets/icons/caté/meuf.png" style="width: 120px; height: 120px; object-fit: contain; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));">
          <span style="font-size: 20px; font-weight: 800; color: #ff7eb3;">Femme</span>
        </button>
      </div>
      <style>
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #select-male:hover { transform: scale(1.1); background: rgba(126, 196, 255, 0.2); box-shadow: 0 0 30px rgba(126, 196, 255, 0.4); }
        #select-female:hover { transform: scale(1.1); background: rgba(255, 126, 179, 0.2); box-shadow: 0 0 30px rgba(255, 126, 179, 0.4); }
      </style>
    </div>
  `;

  container.querySelector('#select-male').addEventListener('click', () => initMiiMaker(container, 0));
  container.querySelector('#select-female').addEventListener('click', () => initMiiMaker(container, 1));
}

async function initMiiMaker(container, gender = 0) {
  if (!window.Mii) {
    setTimeout(() => initMiiMaker(container), 100);
    return;
  }

  // Build category buttons HTML
  const catBtns = CATEGORIES.map((c, i) => {
    const isImage = c.icon.includes('.png');
    const content = isImage ? `<img src="${c.icon}" style="width:38px;height:38px;object-fit:contain;">` : `<span style="font-size:32px;line-height:1;">${c.icon}</span>`;
    return `<button class="mii-cat-btn${i === 0 ? ' active' : ''}" data-cat="${c.id}" title="${c.label}">${content}</button>`;
  }).join('');

  container.innerHTML = `
    <div class="mii-topbar">
      <div class="mii-topbar-title">Mii Maker</div>
      ${catBtns}
      <div class="mii-topbar-spacer"></div>
      <button class="mii-music-toggle" id="mii-music-toggle" title="Couper/Activer la musique" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;border:2px solid #2a2a4a;background:#22223a;color:#7eb8ff;font-size:18px;cursor:pointer;margin-right:8px;transition:all 0.15s;">🔊</button>
      <button class="mii-close-btn" title="Close">✕</button>
    </div>
    <div class="mii-body">
      <div class="mii-canvas-area" id="mii-canvas-container" style="background: transparent;">
        <div id="mii-loading-overlay">Loading Preview...</div>
        <div id="mii-tutorial-bubble" style="display: none; position: absolute; top: 120px; left: 52.5%; transform: translateX(-50%); background: linear-gradient(to bottom, #7ee8ff 0%, #4facfe 100%); color: white; padding: 15px 25px; border-radius: 30px; font-weight: 800; font-size: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.4); z-index: 1000; animation: bounce 2s infinite; border: 3px solid white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); pointer-events: none;">
          <div id="mii-tutorial-text">Bienvenue ! ✨</div>
          <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); border-width: 15px 15px 0; border-style: solid; border-color: white transparent transparent transparent;"></div>
          <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); border-width: 12px 12px 0; border-style: solid; border-color: #4facfe transparent transparent transparent;"></div>
          <style>
            @keyframes bounce {
              0%, 100% { transform: translate(-50%, 0); }
              50% { transform: translate(-50%, -10px); }
            }
          </style>
        </div>
      </div>
      <div class="mii-controls-area">
        <div class="mii-subtabs">
          <div class="mii-subtab active" data-sub="type">Type</div>
          <div class="mii-subtab" data-sub="color">Color</div>
          <div class="mii-subtab" data-sub="position">Position</div>
        </div>
        <div class="mii-panel-content" id="mii-panel"></div>
        <button class="mii-save-btn" id="btn-save">Save & Quit</button>
      </div>
    </div>
  `;

  // --- Mii Maker Music (crossfade with main music) ---
  let miiMusic = null;
  let mainMusicWasPlaying = false;

  function startMiiMusic() {
    miiMusic = new Audio('assets/audio/Mii Maker.mp3');
    miiMusic.volume = 0.3;
    miiMusic.loop = true;

    if (typeof AudioManager !== 'undefined') {
      AudioManager.isExternalMusicPlaying = true;
      if (AudioManager.isPlayingMusic) {
        mainMusicWasPlaying = true;
        AudioManager.fadeOut(300).then(() => {
          miiMusic.play().catch(() => { });
        });
        // Also start playing immediately but at low volume if possible, 
        // or just start playing right after a short fade
      } else {
        mainMusicWasPlaying = false;
        miiMusic.play().catch(() => { });
      }
    } else {
      mainMusicWasPlaying = false;
      miiMusic.play().catch(() => { });
    }

    // Set Mii Maker background video
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
      bgVideo.src = 'assets/icons/video/miimakerBC.mp4';
      bgVideo.style.opacity = '1';
      bgVideo.play().catch(e => console.log('Video play error:', e));
    }
  }

  function stopMiiMusic() {
    if (typeof AudioManager !== 'undefined') {
      AudioManager.isExternalMusicPlaying = false;
    }
    if (miiMusic) {
      miiMusic.pause();
      miiMusic.currentTime = 0;
      miiMusic = null;
    }
    // Restore main music if it was playing before
    if (mainMusicWasPlaying && typeof AudioManager !== 'undefined' && AudioManager.currentMusicAudio) {
      AudioManager.fadeIn(800);
    }
  }

  function playMiiSFX(name) {
    const sfx = new Audio(`/assets/audio/${name}.wav`);
    sfx.preload = "auto";
    sfx.volume = 0.5;
    sfx.play().catch(err => console.error(`Failed to play SFX: ${name}`, err));
  }

  // Start Mii music on open
  startMiiMusic();

  // Mute/unmute toggle
  const musicToggle = container.querySelector('#mii-music-toggle');
  musicToggle.addEventListener('click', () => {
    if (miiMusic) {
      if (miiMusic.paused) {
        miiMusic.play().catch(() => { });
        musicToggle.textContent = '🔊';
      } else {
        miiMusic.pause();
        musicToggle.textContent = '🔇';
      }
    }
  });

  // Close Logic with Forced Creation Check
  const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
  const isForcedCreation = currentUser && window.Auth ? !(await window.Auth.hasMii(currentUser)) : false;

  function closeMiiMaker() {
    stopMiiMusic();
    // Restore theme background
    if (window.ThemeManager) {
      window.ThemeManager.apply(window.ThemeManager.currentTheme, false);
    }
    container.classList.add('closing');
    if (blinkTimeout) clearTimeout(blinkTimeout);
    if (miiSpeechTimeout) clearTimeout(miiSpeechTimeout);
    
    // Restore main container visibility
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
      mainContainer.style.opacity = '1';
      mainContainer.style.transform = 'scale(1)';
    }
    document.body.classList.remove('app-open-active');

    setTimeout(() => { if (container.parentNode) container.parentNode.removeChild(container); }, 300);
  }

  container.querySelector('.mii-close-btn').addEventListener('click', () => {
    playMiiSFX('cancel');
    if (isForcedCreation) {
      alert("Veuillez d'abord créer et sauvegarder votre Mii !");
      return;
    }
    closeMiiMaker();
  });

  // State
  let activeCategory = 'face';
  let activeSubtab = 'type';
  let currentExpression = 'normal';
  let blinkTimeout = null;
  let miiSpeechTimeout = null;

  const MII_MESSAGES = [
    "Regarde mon nouveau look hehehe",
    "Je me sens super bien aujourd'hui !",
    "Tu trouves que cette couleur me va ?",
    "On dirait presque mon jumeau !",
    "J'adore ma nouvelle coiffure !",
    "C'est quoi ce poulet !",
    "Tu as beaucoup de goût !",
    "Waouh, je suis stylé !",
    "Je me demande à quoi je vais ressembler...",
    "Clique sur les catégories pour m'ajuster !"
  ];

  // --- TUTORIAL LOGIC ---
  const tutorialBubble = container.querySelector('#mii-tutorial-bubble');

  if (isForcedCreation) {
    tutorialBubble.style.display = 'block';
  }

  function updateTutorialMessage() {
    if (!isForcedCreation) return;
    const textEl = container.querySelector('#mii-tutorial-text');
    if (!textEl) return;

    const variants = {
      welcome: ["Bienvenue ! ✨", "Salut ! On commence ? 👋", "C'est l'heure de créer votre Mii ! 🎨"],
      face: ["Choisissez un joli visage ! 😊", "Quel teint vous va le mieux ? ✨", "La base de tout Mii ! 👤"],
      hair: ["Une coiffure stylée ? 💇", "Quelle couleur vous préférez ? 🌈", "Changez de tête ! ✨"],
      eyebrows: ["Des sourcils expressifs ! 🤨", "Ça change tout le regard ! ✨"],
      eyes: ["Regardez-moi dans les yeux ! 👀", "Des yeux pétillants ? ✨"],
      nose: ["Un petit pif ? 👃", "Chacun son nez ! 😄"],
      mouth: ["Gardez le sourire ! 😁", "Une petite moue ? ✨"],
      glasses: ["Besoin d'y voir plus clair ? 👓", "Le style intello ! 🤓"],
      body: ["Ajustez votre taille ! 📏", "Quelle est votre couleur préférée ? 👕", "Un Mii à votre image ! ✨"],
      profile: ["Presque fini ! Donnez-lui un nom ! 📝", "Dernière étape ! ✨"]
    };

    const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];

    let msg = getRand(variants.welcome);
    if (activeCategory === 'face') msg = getRand(variants.face);
    else if (activeCategory === 'hair') msg = getRand(variants.hair);
    else if (activeCategory === 'eyebrows') msg = getRand(variants.eyebrows);
    else if (activeCategory === 'eyes') msg = getRand(variants.eyes);
    else if (activeCategory === 'nose') msg = getRand(variants.nose);
    else if (activeCategory === 'mouth') msg = getRand(variants.mouth);
    else if (activeCategory === 'glasses') msg = getRand(variants.glasses);
    else if (activeCategory === 'body') msg = getRand(variants.body);
    else if (activeCategory === 'profile') msg = getRand(variants.profile);

    if (activeCategory !== 'body' && activeCategory !== 'profile') {
      if (activeSubtab === 'color') msg += " (Les couleurs ! 🎨)";
      if (activeSubtab === 'position') msg += " (Ajustez bien ! 🎯)";
    }

    textEl.textContent = msg;
  }

  // --- Profile Data & Mii Loader ---
  const currentProfile = {
    first_name: "",
    last_name: "",
    username: currentUser || "",
    birthday: "",
    bio: ""
  };

  // Default Mii (if user has none)
  let miiBase64Str = "AwEAAAAAAAAAAAAAgP9wmQAAAAAAAAAAAABNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAhAQJoRBgmNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMNn";

  if (currentUser && window.Auth && window.Auth.currentUser) {
    if (isForcedCreation) {
      // New user: skip the loading attempt from Firestore
      const overlay = container.querySelector('#mii-loading-overlay');
      if (overlay) overlay.style.display = 'none';
    } else {
      // Existing user: attempt to load their Mii
      const overlay = container.querySelector('#mii-loading-overlay');
      if (overlay) overlay.textContent = "Loading your Mii...";

      try {
        const docRef = window.Firestore.doc(window.FirebaseDB, "avatars", window.Auth.currentUser.uid);
        const docSnap = await window.Firestore.getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.visual_base64) miiBase64Str = data.visual_base64;
          currentProfile.first_name = data.first_name || "";
          currentProfile.last_name = data.last_name || "";
          currentProfile.birthday = data.birthday || "";
          currentProfile.bio = data.bio || "";
        }
      } catch (e) { console.error("Could not load Mii save:", e); }
    }
  }

  const rawData = atob(miiBase64Str);
  const u8 = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) u8[i] = rawData.charCodeAt(i);
  miiInstance = new window.Mii(u8);
  miiInstance.gender = gender; // Set gender from selection
  miiInstance.height = 91; // Base height requested by user (0-127)
  miiInstance.mouthType = 19; // Default smile style requested by user

  // Female-specific defaults
  if (gender === 1) {
    miiInstance.hairType = 12;
    miiInstance.eyebrowType = 0;
    miiInstance.eyeType = 4;
  }

  // Category switching
  const catButtons = container.querySelectorAll('.mii-cat-btn');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      activeSubtab = 'type';
      container.querySelectorAll('.mii-subtab').forEach(s => s.classList.remove('active'));
      container.querySelector('.mii-subtab[data-sub="type"]').classList.add('active');
      renderPanel();
    });
  });

  // Sub-tab switching
  const subtabs = container.querySelectorAll('.mii-subtab');
  subtabs.forEach(subtab => {
    subtab.addEventListener('click', () => {
      subtabs.forEach(s => s.classList.remove('active'));
      subtab.classList.add('active');
      activeSubtab = subtab.getAttribute('data-sub');
      renderPanel();
      updateTutorialMessage();
    });
  });

  const panel = container.querySelector('#mii-panel');

  // --- RENDER PANEL ---
  function renderPanel() {
    panel.innerHTML = '';
    updateTutorialMessage();

    if (activeCategory === 'profile') {
      renderProfilePanel();
      return;
    }

    if (activeSubtab === 'type') renderTypePanel();
    else if (activeSubtab === 'color') renderColorPanel();
    else if (activeSubtab === 'position') renderPositionPanel();
  }

  function renderTypePanel() {
    let items = [];
    let stateKey = '';
    switch (activeCategory) {
      case 'face': items = FACE_STYLES; stateKey = 'faceType'; break;
      case 'hair': items = HAIR_STYLES; stateKey = 'hairType'; break;
      case 'eyebrows': items = BROW_STYLES; stateKey = 'eyebrowType'; break;
      case 'eyes': items = EYE_STYLES; stateKey = 'eyeType'; break;
      case 'nose': items = NOSE_STYLES; stateKey = 'noseType'; break;
      case 'mouth': items = MOUTH_STYLES; stateKey = 'mouthType'; break;
      case 'glasses': items = GLASSES_STYLES; stateKey = 'glassesType'; break;
      case 'body': renderBodyPanel(); return;
    }

    const label = document.createElement('div');
    label.className = 'mii-section-label';
    label.textContent = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) + ' Style';
    panel.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'mii-style-grid';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'mii-style-btn' + (miiInstance[stateKey] === item.v ? ' active' : '');
      btn.style.cssText = 'padding:4px;display:flex;align-items:center;justify-content:center;min-height:80px;min-width:80px;';;
      btn.title = item.n;

      const tempMii = Object.assign(Object.create(Object.getPrototypeOf(miiInstance)), miiInstance);
      tempMii[stateKey] = item.v;
      try {
        const enc = tempMii.encode();
        let b64 = btoa(String.fromCharCode(...new Uint8Array(enc.slice(0, 96))));
        const thumbUrl = `https://mii-unsecure.ariankordi.net/miis/image.png?data=${encodeURIComponent(b64)}&verifyCharInfo=0&type=face&width=128&shaderType=wiiu`;
        const img = document.createElement('img');
        img.src = thumbUrl;
        img.alt = item.n;
        img.style.cssText = 'width:72px;height:72px;object-fit:contain;border-radius:4px;';
        img.loading = 'lazy';
        btn.appendChild(img);
      } catch (e) {
        btn.textContent = item.n;
      }

      btn.addEventListener('click', () => {
        grid.querySelectorAll('.mii-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        miiInstance[stateKey] = item.v;
        playMiiSFX('Selectwav');
        fetch3DModel();
      });
      grid.appendChild(btn);
    });
    panel.appendChild(grid);
  }

  function renderColorPanel() {
    let colors = []; let stateKey = '';
    switch (activeCategory) {
      case 'face': colors = SKINS; stateKey = 'skinColor'; break;
      case 'hair': colors = HAIRS; stateKey = 'hairColor'; break;
      case 'eyebrows': colors = HAIRS; stateKey = 'eyebrowColor'; break;
      case 'eyes': colors = EYES_COLORS; stateKey = 'eyeColor'; break;
      case 'mouth': colors = ['#de7e58', '#cc5544', '#e87070', '#d45e7e', '#c94040', '#a03030']; stateKey = 'mouthColor'; break;
      case 'body': colors = SHIRTS; stateKey = 'favoriteColor'; break;
      case 'glasses': colors = ['#222222', '#994433', '#4455aa', '#cc5555', '#ffffff', '#886644']; stateKey = 'glassesColor'; break;
      default:
        panel.innerHTML = '<div class="mii-section-label" style="color:#666;">No colors for this category.</div>';
        return;
    }

    const label = document.createElement('div');
    label.className = 'mii-section-label';
    label.textContent = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) + ' Color';
    panel.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'mii-color-grid';
    colors.forEach((c, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'mii-color-swatch' + (miiInstance[stateKey] === idx ? ' active' : '');
      swatch.style.backgroundColor = c;
      swatch.addEventListener('click', () => {
        playMiiSFX('Color');
        grid.querySelectorAll('.mii-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        miiInstance[stateKey] = idx;
        fetch3DModel();
      });
      grid.appendChild(swatch);
    });
    panel.appendChild(grid);
  }

  function renderPositionPanel() {
    const sliders = [];
    switch (activeCategory) {
      case 'eyes':
        sliders.push({ label: 'Vertical', key: 'eyeVertical', min: 0, max: 18 });
        sliders.push({ label: 'Size', key: 'eyeScale', min: 0, max: 7 });
        sliders.push({ label: 'Stretch', key: 'eyeStretch', min: 0, max: 6 });
        sliders.push({ label: 'Spacing', key: 'eyeSpacing', min: 0, max: 12 });
        sliders.push({ label: 'Rotation', key: 'eyeRotation', min: 0, max: 7 });
        break;
      case 'eyebrows':
        sliders.push({ label: 'Vertical', key: 'eyebrowVertical', min: 0, max: 18 });
        sliders.push({ label: 'Size', key: 'eyebrowScale', min: 0, max: 8 });
        sliders.push({ label: 'Stretch', key: 'eyebrowStretch', min: 0, max: 6 });
        sliders.push({ label: 'Spacing', key: 'eyebrowSpacing', min: 0, max: 12 });
        sliders.push({ label: 'Rotation', key: 'eyebrowRotation', min: 0, max: 11 });
        break;
      case 'nose':
        sliders.push({ label: 'Vertical', key: 'noseVertical', min: 0, max: 18 });
        sliders.push({ label: 'Size', key: 'noseScale', min: 0, max: 8 });
        break;
      case 'mouth':
        sliders.push({ label: 'Vertical', key: 'mouthVertical', min: 0, max: 18 });
        sliders.push({ label: 'Size', key: 'mouthScale', min: 0, max: 8 });
        sliders.push({ label: 'Stretch', key: 'mouthStretch', min: 0, max: 6 });
        break;
      default:
        panel.innerHTML = '<div class="mii-section-label" style="color:#666;">No position controls for this category.</div>';
        return;
    }
    sliders.forEach(s => {
      const group = document.createElement('div');
      group.className = 'mii-slider-group';
      const val = miiInstance[s.key] || 0;
      group.innerHTML = `
        <div class="mii-slider-label"><span>${s.label}</span><span id="val-${s.key}">${val}</span></div>
        <input type="range" class="mii-slider" min="${s.min}" max="${s.max}" value="${val}" data-key="${s.key}">
      `;
      group.querySelector('input').addEventListener('input', (e) => {
        miiInstance[s.key] = parseInt(e.target.value);
        group.querySelector(`#val-${s.key}`).textContent = e.target.value;
        playMiiSFX('Selectwav');
        fetch3DModel();
      });
      panel.appendChild(group);
    });
  }

  function renderBodyPanel() {
    const label = document.createElement('div');
    label.className = 'mii-section-label';
    label.textContent = 'Body Settings';
    panel.appendChild(label);

    const hg = document.createElement('div'); hg.className = 'mii-slider-group';
    const hv = miiInstance.height || 64;
    hg.innerHTML = `<div class="mii-slider-label"><span>Height</span><span id="val-height">${hv}</span></div>
      <input type="range" class="mii-slider" min="0" max="127" value="${hv}">`;
    hg.querySelector('input').addEventListener('input', e => {
      miiInstance.height = parseInt(e.target.value);
      hg.querySelector('#val-height').textContent = e.target.value;
      playMiiSFX('Selectwav');
      fetch3DModel();
    });
    panel.appendChild(hg);

    const bg = document.createElement('div'); bg.className = 'mii-slider-group';
    const bv = miiInstance.build || 64;
    bg.innerHTML = `<div class="mii-slider-label"><span>Build</span><span id="val-build">${bv}</span></div>
      <input type="range" class="mii-slider" min="0" max="127" value="${bv}">`;
    bg.querySelector('input').addEventListener('input', e => {
      miiInstance.build = parseInt(e.target.value);
      bg.querySelector('#val-build').textContent = e.target.value;
      playMiiSFX('Selectwav');
      fetch3DModel();
    });
    panel.appendChild(bg);

    const sl = document.createElement('div'); sl.className = 'mii-section-label'; sl.textContent = 'Shirt Color'; sl.style.marginTop = '20px'; panel.appendChild(sl);
    const grid = document.createElement('div'); grid.className = 'mii-color-grid';
    SHIRTS.forEach((c, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'mii-color-swatch' + (miiInstance.favoriteColor === idx ? ' active' : '');
      swatch.style.backgroundColor = c;
      swatch.addEventListener('click', () => {
        playMiiSFX('Color');
        grid.querySelectorAll('.mii-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        miiInstance.favoriteColor = idx;
        fetch3DModel();
      });
      grid.appendChild(swatch);
    });
    panel.appendChild(grid);
  }

  // Profile data state is defined at top level now
  function renderProfilePanel() {
    panel.innerHTML = `
      <div class="mii-control-group"><label>First Name</label><input type="text" class="mii-input" id="inp-first" placeholder="e.g. Luigi" value="${currentProfile.first_name}"></div>
      <div class="mii-control-group"><label>Last Name</label><input type="text" class="mii-input" id="inp-last" placeholder="e.g. Mario" value="${currentProfile.last_name}"></div>
      <div class="mii-control-group"><label>Nickname (Account)</label><input type="text" class="mii-input" id="inp-nick" value="${currentProfile.username}" readonly style="background:rgba(255,255,255,0.05); color:#888;"></div>
      <div class="mii-control-group"><label>Birthday</label><input type="date" class="mii-input" id="inp-birth" value="${currentProfile.birthday}"></div>
      <div class="mii-control-group"><label>Short Bio</label><textarea class="mii-textarea" id="inp-bio" placeholder="It's-a me!">${currentProfile.bio}</textarea></div>
    `;

    // Listeners to update state in real-time
    panel.querySelector('#inp-first').addEventListener('input', e => currentProfile.first_name = e.target.value.trim());
    panel.querySelector('#inp-last').addEventListener('input', e => currentProfile.last_name = e.target.value.trim());
    panel.querySelector('#inp-birth').addEventListener('change', e => currentProfile.birthday = e.target.value);
    panel.querySelector('#inp-bio').addEventListener('input', e => currentProfile.bio = e.target.value.trim());
  }

  // Initial render
  renderPanel();

  // Base64 encoder
  function encodeMiiBase64() {
    const enc = miiInstance.encode();
    const limit = Math.min(enc.length, 96);
    let res = "";
    for (let i = 0; i < limit; i++) res += String.fromCharCode(enc[i]);
    return btoa(res);
  }

  // Profile data getter
  const getProfileData = () => ({
    ...currentProfile,
    visual_base64: encodeMiiBase64()
  });

  // Save with Forced Creation Bypass
  const saveBtn = container.querySelector('#btn-save');
  saveBtn.addEventListener('click', async () => {
    playMiiSFX('save');
    const data = getProfileData();
    if (!data.username) { alert("Please enter a Nickname before saving!"); return; }
    if (data.first_name) miiInstance.miiName = data.first_name;

    try {
      saveBtn.textContent = "Saving..."; saveBtn.disabled = true;
      const fbUser = window.Auth ? window.Auth.currentUser : null;

      if (!fbUser) throw new Error("User not authenticated in Firebase");

      // Save complete avatar blob in "avatars" collection using their UID
      const docRef = window.Firestore.doc(window.FirebaseDB, "avatars", fbUser.uid);
      await window.Firestore.setDoc(docRef, data, { merge: true });

      if (typeof AudioManager !== 'undefined') AudioManager.playPop();
      saveBtn.textContent = "Saved!";

      closeMiiMaker();

      // Reload if it was the first time creating a Mii to unlock the site
      if (isForcedCreation) setTimeout(() => window.location.reload(), 1000);

    } catch (err) {
      console.error("Mii Save Error:", err);
      alert("Failed to save Mii: " + err.message);
      saveBtn.textContent = "Save & Quit"; saveBtn.disabled = false;
    }
  });

  // --- MII PREVIEW (Full body 2D render from API + arrow rotation) ---
  const canvasArea = container.querySelector('#mii-canvas-container');
  canvasArea.style.position = 'relative';

  // Make the background look like a spotlight or brighter to see the Mii clearly
  canvasArea.style.background = 'radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 70%)';
  canvasArea.style.borderRadius = '16px';
  canvasArea.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5)';
  // Ensure the container is transparent so the bg-video shows through
  canvasArea.style.backgroundColor = 'transparent';

  // Create the preview image
  const previewImg = document.createElement('img');
  previewImg.id = 'mii-preview-img';
  previewImg.classList.add('mii-anim-breathe');
  previewImg.style.cssText = 'width:105%;height:105%;object-fit:contain;display:block;margin:auto;transition:opacity 0.3s ease-in-out;user-select:none;z-index:2;filter:drop-shadow(0px 15px 20px rgba(0,0,0,0.6));opacity:1;position:relative;';
  previewImg.alt = 'Mii Preview';
  previewImg.draggable = false;
  canvasArea.appendChild(previewImg);

  // Arrow buttons
  const arrowStyle = 'position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.15);color:#fff;border:none;font-size:28px;width:40px;height:60px;cursor:pointer;border-radius:8px;z-index:5;transition:background 0.2s;display:flex;align-items:center;justify-content:center;';

  const leftBtn = document.createElement('button');
  leftBtn.innerHTML = '◀';
  leftBtn.style.cssText = arrowStyle + 'left:6px;';
  leftBtn.title = 'Tourner à gauche';
  leftBtn.onmouseenter = () => leftBtn.style.background = 'rgba(255,255,255,0.3)';
  leftBtn.onmouseleave = () => leftBtn.style.background = 'rgba(255,255,255,0.15)';
  canvasArea.appendChild(leftBtn);

  const rightBtn = document.createElement('button');
  rightBtn.innerHTML = '▶';
  rightBtn.style.cssText = arrowStyle + 'right:6px;';
  rightBtn.title = 'Tourner à droite';
  rightBtn.onmouseenter = () => rightBtn.style.background = 'rgba(255,255,255,0.3)';
  rightBtn.onmouseleave = () => rightBtn.style.background = 'rgba(255,255,255,0.15)';
  canvasArea.appendChild(rightBtn);

  function triggerStarEffect() {
    const count = 15;
    const colors = ['#fff700', '#ffea00', '#ffd700']; // Only yellow variations

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.innerHTML = i % 2 === 0 ? '★' : '✨';
      star.style.position = 'absolute';
      star.style.left = '52%';
      star.style.top = '40%'; // Balanced position for face centering
      star.style.transform = 'translate(-50%, -50%)';
      star.style.color = colors[Math.floor(Math.random() * colors.length)];
      star.style.fontSize = (Math.random() * 80 + 50) + 'px'; // Larger stars
      star.style.zIndex = '0'; // Behind the Mii
      star.style.pointerEvents = 'none';
      star.style.textShadow = '0 0 15px rgba(255,255,255,1)';

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 220 + 120; // Drift further
      const driftX = Math.cos(angle) * distance;
      const driftY = Math.sin(angle) * distance;

      star.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(2) rotate(180deg)', opacity: 1, offset: 0.2 },
        { transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) scale(0) rotate(360deg)`, opacity: 0 }
      ], {
        duration: 800 + Math.random() * 600,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        delay: Math.random() * 100 // Slight staggered burst
      }).onfinish = () => star.remove();

      canvasArea.appendChild(star);
    }
  }

  // Rotation state
  let rotationY = 0;

  leftBtn.addEventListener('click', () => {
    playMiiSFX('Gauche');
    rotationY -= 30;
    fetchMiiRender();
  });
  rightBtn.addEventListener('click', () => {
    playMiiSFX('Droite');
    rotationY += 30;
    fetchMiiRender();
  });

  function fetchMiiRender(skipStars = false) {
    const b64 = encodeMiiBase64();
    const angle = ((rotationY % 360) + 360) % 360;
    const url = `https://mii-unsecure.ariankordi.net/miis/image.png?data=${encodeURIComponent(b64)}&verifyCharInfo=0&type=all_body&width=720&clothesColor=default&shaderType=wiiu&characterYRotate=${Math.round(angle)}&expression=${currentExpression}`;

    // Create a background image to load the new render
    const newImg = new Image();
    newImg.onload = () => {
      // Swap immediately when loaded
      previewImg.src = newImg.src;
      // Hide loading overlay
      const overlay = container.querySelector('#mii-loading-overlay');
      if (overlay) overlay.style.display = 'none';

      // Fade back in quickly for a smooth transition if we were fading
      previewImg.style.opacity = '1';
      if (!skipStars) triggerStarEffect();
    };
    newImg.onerror = () => {
      console.error('Failed to load Mii preview render');
    };

    // We don't dim the old image anymore for a "seamless" feel, 
    // unless we want a very subtle feedback pulse:
    // previewImg.style.opacity = '0.9'; 

    newImg.src = url;
  }

  // Alias for compatibility with existing code that calls fetch3DModel
  function fetch3DModel() {
    // Just trigger the render update
    fetchMiiRender();
  }

  function scheduleBlink() {
    if (blinkTimeout) clearTimeout(blinkTimeout);

    // Random interval between 2.5 and 6 seconds
    const interval = Math.random() * 3500 + 2500;

    blinkTimeout = setTimeout(() => {
      // Don't blink if we are currently updating the model from selection
      // (This is a bit hard to track perfectly, but usually fine)
      currentExpression = 'blink';
      fetchMiiRender(true);

      // Eye closed duration (very fast)
      setTimeout(() => {
        currentExpression = 'normal';
        fetchMiiRender(true);
        scheduleBlink();
      }, 100);
    }, interval);
  }

  function triggerMiiSpeech() {
    let bubble = container.querySelector('#mii-speech-bubble');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.id = 'mii-speech-bubble';
      bubble.style.cssText = `
        position: absolute;
        top: 45%;
        left: 20%;
        background: white;
        color: #333;
        padding: 20px 30px;
        border-radius: 60px;
        font-weight: 800;
        font-size: 15px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 1000;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        pointer-events: none;
        border: 4px solid #4facfe;
        transform: scale(0.8) rotate(-5deg);
        max-width: 280px;
        text-align: center;
        line-height: 1.4;
      `;
      container.querySelector('#mii-canvas-container').appendChild(bubble);
    }

    const msg = MII_MESSAGES[Math.floor(Math.random() * MII_MESSAGES.length)];
    bubble.innerHTML = `${msg}
      <!-- Tail pointing to Mii -->
      <div style="position: absolute; bottom: 15px; right: -25px; border-width: 15px 0 15px 30px; border-style: solid; border-color: transparent transparent transparent #4facfe; transform: rotate(-15deg);"></div>
      <div style="position: absolute; bottom: 18px; right: -18px; border-width: 12px 0 12px 25px; border-style: solid; border-color: transparent transparent transparent white; transform: rotate(-15deg);"></div>`;

    // Reset styles for immediate re-reveal
    bubble.style.transition = 'none';
    bubble.style.opacity = '0';
    bubble.style.transform = 'scale(0.5) translateY(20px)';
    
    // Force reflow
    bubble.offsetHeight;

    bubble.style.transition = 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
    bubble.style.opacity = '1';
    bubble.style.transform = 'scale(1) translateY(0)';
    
    playMiiSFX('SE_MII_UP');

    setTimeout(() => {
      bubble.style.opacity = '0';
      bubble.style.transform = 'scale(0.8) translateY(10px)';
    }, 4500);
  }

  function scheduleMiiSpeech() {
    if (miiSpeechTimeout) clearTimeout(miiSpeechTimeout);
    const interval = Math.random() * 12000 + 15000; // 15-27 seconds
    miiSpeechTimeout = setTimeout(() => {
      triggerMiiSpeech();
      scheduleMiiSpeech();
    }, interval);
  }

  // Start behaviors
  scheduleBlink();
  scheduleMiiSpeech();

  fetch3DModel();
}
