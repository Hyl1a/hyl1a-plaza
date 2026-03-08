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

// --- Hair / Eye / Brow / Mouth / Nose style data ---
const HAIR_STYLES = [
  {v:33,n:'Normal'},{v:14,n:'Spiky'},{v:13,n:'Messy'},{v:46,n:'Swept'},{v:18,n:'Short'},
  {v:90,n:'Bowl'},{v:73,n:'Long'},{v:57,n:'Pigtails'},{v:26,n:'Ponytail'},{v:34,n:'Cap'},
  {v:76,n:'Curly'},{v:0,n:'Bald'}
];
const EYE_STYLES = [
  {v:2,n:'Normal'},{v:4,n:'Thick'},{v:23,n:'Narrow'},{v:8,n:'Round'},
  {v:11,n:'Wink'},{v:18,n:'Star'},{v:36,n:'Cute'},{v:47,n:'Sad'}
];
const BROW_STYLES = [
  {v:0,n:'Normal'},{v:1,n:'Thick'},{v:4,n:'Thin'},{v:6,n:'Angled'},
  {v:7,n:'Round'},{v:9,n:'Short'},{v:12,n:'Flat'},{v:14,n:'Sad'}
];
const MOUTH_STYLES = [
  {v:0,n:'Normal'},{v:3,n:'Smile'},{v:6,n:'Wide'},{v:13,n:'Open'},
  {v:19,n:'Thin'},{v:23,n:'Pout'},{v:30,n:'Grin'},{v:35,n:'Cat'}
];
const NOSE_STYLES = [
  {v:0,n:'Normal'},{v:1,n:'Button'},{v:3,n:'Pointed'},{v:5,n:'Wide'},
  {v:7,n:'Long'},{v:9,n:'Low'},{v:11,n:'Flat'},{v:17,n:'Round'}
];
const GLASSES_STYLES = [
  {v:0,n:'None'},{v:1,n:'Classic'},{v:2,n:'Round'},{v:3,n:'Oval'},
  {v:4,n:'Square'},{v:5,n:'Half'},{v:6,n:'Narrow'},{v:8,n:'Sporty'}
];
const FACE_STYLES = [
  {v:0,n:'Round'},{v:1,n:'Oval'},{v:2,n:'Square'},{v:3,n:'Wide'},
  {v:4,n:'Long'},{v:5,n:'Narrow'},{v:6,n:'Triangle'},{v:7,n:'Heart'},
  {v:8,n:'Diamond'},{v:9,n:'Flat'},{v:10,n:'Sharp'},{v:11,n:'Soft'}
];

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

  // Close
  container.querySelector('.mii-close-btn').addEventListener('click', () => {
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
      btn.textContent = item.n;
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

  // --- THREE.JS SCENE ---
  const canvasArea = container.querySelector('#mii-canvas-container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, canvasArea.clientWidth / canvasArea.clientHeight, 0.1, 500);
  camera.position.set(0, 5, 18);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(canvasArea.clientWidth, canvasArea.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);
  canvasArea.appendChild(renderer.domElement);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3, 10, 8);
  dir.castShadow = true;
  scene.add(dir);
  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-5, 3, -5);
  scene.add(backLight);

  // Platform disc
  const padGeo = new THREE.CylinderGeometry(3, 3, 0.12, 48);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x333355, roughness: 0.7, metalness: 0.1 });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.y = -0.06;
  pad.receiveShadow = true;
  scene.add(pad);

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.minDistance = 5;
  controls.maxDistance = 40;
  controls.target.set(0, 4, 0);

  // Resize
  const onResize = () => {
    if (!container.parentNode) return;
    const w = canvasArea.clientWidth; const h = canvasArea.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);
  setTimeout(onResize, 50);

  // GLTF Loader
  const loader = new THREE.GLTFLoader();

  function fetch3DModel() {
    const overlay = document.getElementById('mii-loading-overlay');
    if(overlay) overlay.style.display = 'flex';

    const b64 = encodeMiiBase64();
    const url = `https://mii-unsecure.ariankordi.net/miis/image.glb?data=${encodeURIComponent(b64)}&verifyCharInfo=0&shaderType=wiiu&type=all_body`;

    loader.load(url, (gltf) => {
      if (currentGLBModel) scene.remove(currentGLBModel);
      const model = gltf.scene;

      // Auto-fit: compute bounding box and scale to a target height of 8 units
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const targetHeight = 8;
      const scaleFactor = targetHeight / size.y;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Re-center: put feet on the platform
      const box2 = new THREE.Box3().setFromObject(model);
      model.position.y = -box2.min.y; // align feet to y=0
      model.position.x = -center.x * scaleFactor;
      model.position.z = -center.z * scaleFactor;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if(child.material) child.material.side = THREE.DoubleSide;
        }
      });
      scene.add(model);
      currentGLBModel = model;

      // Adjust camera target to center of the model
      controls.target.set(0, targetHeight / 2, 0);
      controls.update();

      if(overlay) overlay.style.display = 'none';
    }, undefined, (error) => {
      console.error('Error loading GLB:', error);
      if(overlay) overlay.textContent = 'Failed to load model.';
    });
  }

  fetch3DModel();

  // Animation
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
