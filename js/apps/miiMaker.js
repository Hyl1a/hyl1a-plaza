// Mii Maker Implementation – Redesigned to match datkat21/mii-creator style
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.AppRegistry) {
      window.AppRegistry['miiMaker'].render = function(container) {
        initMiiMaker(container);
      };
    }
  }, 100);
});

// --- Asset Colors ---
const SKINS = ['#feedcf','#f7d3a0','#edb278','#d38b58','#9d6343','#834c31','#512f1f'];
const HAIRS = ['#1d1c1a','#3f3123','#663b21','#85512b','#7c6d66','#a98059','#b5a16d','#bc9c65'];
const EYES_COLORS = ['#3f3530','#7a818c','#533c30','#837b2d','#426899','#5d8050'];
const SHIRTS = ['#ff3333','#ff6600','#ffcc00','#33cc33','#3366ff','#66ccff','#9933cc','#ff66cc','#ffffff','#888888','#222222'];

// --- Category Definitions ---
const CATEGORIES = [
  { id:'face', icon:'😊', label:'Face' },
  { id:'hair', icon:'💇', label:'Hair' },
  { id:'eyebrows', icon:'🤨', label:'Brows' },
  { id:'eyes', icon:'👁️', label:'Eyes' },
  { id:'nose', icon:'👃', label:'Nose' },
  { id:'mouth', icon:'👄', label:'Mouth' },
  { id:'glasses', icon:'🤓', label:'Glasses' },
  { id:'body', icon:'👕', label:'Body' },
  { id:'profile', icon:'📝', label:'Profile' },
];

// --- Hair / Eye / Brow / Mouth / Nose style data (ALL valid values) ---
// Helper to generate style arrays from a range
function makeStyles(max) {
  const arr = [];
  for (let i = 0; i <= max; i++) arr.push({v:i, n:'Style ' + i});
  return arr;
}
const HAIR_STYLES = makeStyles(131);
const EYE_STYLES = makeStyles(59);
const BROW_STYLES = makeStyles(23);
const MOUTH_STYLES = makeStyles(35);
const NOSE_STYLES = makeStyles(17);
const GLASSES_STYLES = [{v:0,n:'None'}].concat(makeStyles(8).slice(1));
const FACE_STYLES = makeStyles(11);

let miiInstance = null;
let currentGLBModel = null;

function initMiiMaker(container) {
  if (!window.Mii) {
    setTimeout(() => initMiiMaker(container), 100);
    return;
  }

  // Build category buttons HTML
  const catBtns = CATEGORIES.map((c,i) =>
    `<button class="mii-cat-btn${i===0?' active':''}" data-cat="${c.id}" title="${c.label}">${c.icon}</button>`
  ).join('');

  container.innerHTML = `
    <div class="mii-topbar">
      <div class="mii-topbar-title">Mii Maker</div>
      ${catBtns}
      <div class="mii-topbar-spacer"></div>
      <button class="mii-music-toggle" id="mii-music-toggle" title="Couper/Activer la musique" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;border:2px solid #2a2a4a;background:#22223a;color:#7eb8ff;font-size:18px;cursor:pointer;margin-right:8px;transition:all 0.15s;">🔊</button>
      <button class="mii-close-btn" title="Close">✕</button>
    </div>
    <div class="mii-body">
      <div class="mii-canvas-area" id="mii-canvas-container">
        <div id="mii-loading-overlay">Loading 3D Model...</div>
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
    miiMusic = new Audio('Son/Mii Maker.mp3');
    miiMusic.volume = 0.3;
    miiMusic.loop = true;

    if (typeof AudioManager !== 'undefined' && AudioManager.isPlayingMusic) {
      mainMusicWasPlaying = true;
      AudioManager.fadeOut(800).then(() => {
        miiMusic.play().catch(() => {});
      });
    } else {
      mainMusicWasPlaying = false;
      miiMusic.play().catch(() => {});
    }
  }

  function stopMiiMusic() {
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

  // Start Mii music on open
  startMiiMusic();

  // Mute/unmute toggle
  const musicToggle = container.querySelector('#mii-music-toggle');
  musicToggle.addEventListener('click', () => {
    if (miiMusic) {
      if (miiMusic.paused) {
        miiMusic.play().catch(() => {});
        musicToggle.textContent = '🔊';
      } else {
        miiMusic.pause();
        musicToggle.textContent = '🔇';
      }
    }
  });

  // Close
  container.querySelector('.mii-close-btn').addEventListener('click', () => {
    stopMiiMusic();
    container.classList.add('closing');
    setTimeout(() => { if(container.parentNode) container.parentNode.removeChild(container); }, 300);
  });

  // State
  let activeCategory = 'face';
  let activeSubtab = 'type';

  // Default Mii
  const defaultMiiStr = "AwEAAAAAAAAAAAAAgP9wmQAAAAAAAAAAAABNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAhAQJoRBgmNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMNn";
  const rawData = atob(defaultMiiStr);
  const u8 = new Uint8Array(rawData.length);
  for(let i = 0; i < rawData.length; i++) u8[i] = rawData.charCodeAt(i);
  miiInstance = new window.Mii(u8);

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
  container.querySelectorAll('.mii-subtab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.mii-subtab').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      activeSubtab = tab.dataset.sub;
      renderPanel();
    });
  });

  const panel = container.querySelector('#mii-panel');

  // --- RENDER PANEL ---
  function renderPanel() {
    panel.innerHTML = '';

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
    switch(activeCategory) {
      case 'face':    items = FACE_STYLES;    stateKey = 'faceType'; break;
      case 'hair':    items = HAIR_STYLES;    stateKey = 'hairType'; break;
      case 'eyebrows':items = BROW_STYLES;    stateKey = 'eyebrowType'; break;
      case 'eyes':    items = EYE_STYLES;     stateKey = 'eyeType'; break;
      case 'nose':    items = NOSE_STYLES;    stateKey = 'noseType'; break;
      case 'mouth':   items = MOUTH_STYLES;   stateKey = 'mouthType'; break;
      case 'glasses': items = GLASSES_STYLES; stateKey = 'glassesType'; break;
      case 'body':    renderBodyPanel(); return;
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

      // Create a temporary Mii with this style applied for the thumbnail
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
      } catch(e) {
        btn.textContent = item.n;
      }

      btn.addEventListener('click', () => {
        grid.querySelectorAll('.mii-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        miiInstance[stateKey] = item.v;
        fetch3DModel();
      });
      grid.appendChild(btn);
    });
    panel.appendChild(grid);
  }

  function renderColorPanel() {
    let colors = []; let stateKey = '';
    switch(activeCategory) {
      case 'face':     colors = SKINS;       stateKey = 'skinColor'; break;
      case 'hair':     colors = HAIRS;       stateKey = 'hairColor'; break;
      case 'eyebrows': colors = HAIRS;       stateKey = 'eyebrowColor'; break;
      case 'eyes':     colors = EYES_COLORS; stateKey = 'eyeColor'; break;
      case 'mouth':    colors = ['#de7e58','#cc5544','#e87070','#d45e7e','#c94040','#a03030']; stateKey = 'mouthColor'; break;
      case 'body':     colors = SHIRTS;      stateKey = 'favoriteColor'; break;
      case 'glasses':  colors = ['#222222','#994433','#4455aa','#cc5555','#ffffff','#886644']; stateKey = 'glassesColor'; break;
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
    switch(activeCategory) {
      case 'eyes':
        sliders.push({label:'Vertical', key:'eyeVertical', min:0, max:18});
        sliders.push({label:'Size', key:'eyeScale', min:0, max:7});
        sliders.push({label:'Stretch', key:'eyeStretch', min:0, max:6});
        sliders.push({label:'Spacing', key:'eyeSpacing', min:0, max:12});
        sliders.push({label:'Rotation', key:'eyeRotation', min:0, max:7});
        break;
      case 'eyebrows':
        sliders.push({label:'Vertical', key:'eyebrowVertical', min:0, max:18});
        sliders.push({label:'Size', key:'eyebrowScale', min:0, max:8});
        sliders.push({label:'Stretch', key:'eyebrowStretch', min:0, max:6});
        sliders.push({label:'Spacing', key:'eyebrowSpacing', min:0, max:12});
        sliders.push({label:'Rotation', key:'eyebrowRotation', min:0, max:11});
        break;
      case 'nose':
        sliders.push({label:'Vertical', key:'noseVertical', min:0, max:18});
        sliders.push({label:'Size', key:'noseScale', min:0, max:8});
        break;
      case 'mouth':
        sliders.push({label:'Vertical', key:'mouthVertical', min:0, max:18});
        sliders.push({label:'Size', key:'mouthScale', min:0, max:8});
        sliders.push({label:'Stretch', key:'mouthStretch', min:0, max:6});
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

    // Height slider
    const hg = document.createElement('div'); hg.className = 'mii-slider-group';
    const hv = miiInstance.height || 64;
    hg.innerHTML = `<div class="mii-slider-label"><span>Height</span><span id="val-height">${hv}</span></div>
      <input type="range" class="mii-slider" min="0" max="127" value="${hv}">`;
    hg.querySelector('input').addEventListener('input', e => {
      miiInstance.height = parseInt(e.target.value);
      hg.querySelector('#val-height').textContent = e.target.value;
      fetch3DModel();
    });
    panel.appendChild(hg);

    // Build slider
    const bg = document.createElement('div'); bg.className = 'mii-slider-group';
    const bv = miiInstance.build || 64;
    bg.innerHTML = `<div class="mii-slider-label"><span>Build</span><span id="val-build">${bv}</span></div>
      <input type="range" class="mii-slider" min="0" max="127" value="${bv}">`;
    bg.querySelector('input').addEventListener('input', e => {
      miiInstance.build = parseInt(e.target.value);
      bg.querySelector('#val-build').textContent = e.target.value;
      fetch3DModel();
    });
    panel.appendChild(bg);

    // Shirt Color
    const sl = document.createElement('div'); sl.className = 'mii-section-label'; sl.textContent = 'Shirt Color'; sl.style.marginTop = '20px'; panel.appendChild(sl);
    const grid = document.createElement('div'); grid.className = 'mii-color-grid';
    SHIRTS.forEach((c, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'mii-color-swatch' + (miiInstance.favoriteColor === idx ? ' active' : '');
      swatch.style.backgroundColor = c;
      swatch.addEventListener('click', () => {
        grid.querySelectorAll('.mii-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        miiInstance.favoriteColor = idx;
        fetch3DModel();
      });
      grid.appendChild(swatch);
    });
    panel.appendChild(grid);
  }

  function renderProfilePanel() {
    panel.innerHTML = `
      <div class="mii-control-group"><label>First Name</label><input type="text" class="mii-input" id="inp-first" placeholder="e.g. Luigi"></div>
      <div class="mii-control-group"><label>Last Name</label><input type="text" class="mii-input" id="inp-last" placeholder="e.g. Mario"></div>
      <div class="mii-control-group"><label>Nickname</label><input type="text" class="mii-input" id="inp-nick" placeholder="e.g. Jumpman"></div>
      <div class="mii-control-group"><label>Birthday</label><input type="date" class="mii-input" id="inp-birth"></div>
      <div class="mii-control-group"><label>Short Bio</label><textarea class="mii-textarea" id="inp-bio" placeholder="It's-a me!"></textarea></div>
    `;
  }

  // Initial render
  renderPanel();

  // Base64 encoder
  function encodeMiiBase64() {
    const enc = miiInstance.encode();
    const limit = Math.min(enc.length, 96);
    let res = "";
    for(let i=0; i<limit; i++) res+=String.fromCharCode(enc[i]);
    return btoa(res);
  }

  // Profile data getter
  const getProfileData = () => ({
    first_name: (container.querySelector('#inp-first')?.value||'').trim(),
    last_name:  (container.querySelector('#inp-last')?.value||'').trim(),
    username:   (container.querySelector('#inp-nick')?.value||'').trim(),
    birthday:   (container.querySelector('#inp-birth')?.value||''),
    bio:        (container.querySelector('#inp-bio')?.value||'').trim(),
    visual_base64: encodeMiiBase64()
  });

  // Save
  container.querySelector('#btn-save').addEventListener('click', async () => {
    const btn = container.querySelector('#btn-save');
    const data = getProfileData();
    if (!data.username) { alert("Please enter a Nickname before saving!"); return; }
    if (data.first_name) miiInstance.miiName = data.first_name;
    try {
      btn.textContent = "Saving..."; btn.disabled = true;
      const res = await fetch('/api/avatars', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
      if (res.ok) {
        if (typeof AudioManager !== 'undefined') AudioManager.playPop();
        btn.textContent = "Saved!";
        setTimeout(() => container.querySelector('.mii-close-btn').click(), 1000);
      } else {
        const e = await res.json(); alert('Error: ' + (e.error||'Server error')); btn.textContent = "Save & Quit"; btn.disabled = false;
      }
    } catch(err) {
      console.error(err); alert("Failed to connect. Is server running?"); btn.textContent = "Save & Quit"; btn.disabled = false;
    }
  });

  // --- MII PREVIEW (Full body 2D render from API + arrow rotation) ---
  const canvasArea = container.querySelector('#mii-canvas-container');
  canvasArea.style.position = 'relative';
  
  // Create the preview image
  const previewImg = document.createElement('img');
  previewImg.id = 'mii-preview-img';
  previewImg.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;display:block;margin:auto;transition:opacity 0.2s;user-select:none;animation:miiFloat 3s ease-in-out infinite;';
  previewImg.alt = 'Mii Preview';
  previewImg.draggable = false;
  canvasArea.appendChild(previewImg);

  // Inject animation keyframes
  if (!document.getElementById('mii-anim-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'mii-anim-styles';
    styleEl.textContent = `
      @keyframes miiFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes miiBounce {
        0% { transform: scale(1) translateY(0); }
        20% { transform: scale(1.06) translateY(-12px); }
        40% { transform: scale(0.97) translateY(2px); }
        60% { transform: scale(1.02) translateY(-3px); }
        80% { transform: scale(0.99) translateY(1px); }
        100% { transform: scale(1) translateY(0); }
      }
      @keyframes miiEntrance {
        0% { transform: scale(0.3) translateY(40px); opacity: 0; }
        60% { transform: scale(1.08) translateY(-5px); opacity: 1; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
  }

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

  // Rotation state
  let rotationY = 0;

  leftBtn.addEventListener('click', () => { rotationY -= 30; fetchMiiRender(); });
  rightBtn.addEventListener('click', () => { rotationY += 30; fetchMiiRender(); });

  function fetchMiiRender() {
    const overlay = document.getElementById('mii-loading-overlay');
    const b64 = encodeMiiBase64();
    const angle = ((rotationY % 360) + 360) % 360;
    const url = `https://mii-unsecure.ariankordi.net/miis/image.png?data=${encodeURIComponent(b64)}&verifyCharInfo=0&type=all_body&width=720&clothesColor=default&shaderType=wiiu&characterYRotate=${Math.round(angle)}`;

    const newImg = new Image();
    newImg.onload = () => {
      previewImg.src = newImg.src;
      previewImg.style.opacity = '1';
      // Trigger bounce animation
      previewImg.style.animation = 'none';
      previewImg.offsetHeight; // force reflow
      previewImg.style.animation = 'miiBounce 0.5s ease-out, miiFloat 3s ease-in-out 0.5s infinite';
      if(overlay) overlay.style.display = 'none';
    };
    newImg.onerror = () => {
      if(overlay) overlay.textContent = 'Failed to load Mii preview.';
    };
    previewImg.style.opacity = '0.7';
    newImg.src = url;
  }

  // Alias for compatibility with existing code that calls fetch3DModel
  function fetch3DModel() {
    const overlay = document.getElementById('mii-loading-overlay');
    if(overlay) overlay.style.display = 'flex';
    // Entrance animation on first load
    previewImg.style.animation = 'miiEntrance 0.6s ease-out forwards';
    fetchMiiRender();
  }

  fetch3DModel();
}
