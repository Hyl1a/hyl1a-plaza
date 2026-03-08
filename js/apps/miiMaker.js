// Mii Maker Implementation
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.AppRegistry) {
      window.AppRegistry['miiMaker'].render = function(container) {
        initMiiMaker(container);
      };
    }
  }, 100);
});

// --- Mii Maker (Custom UI + Native FFSD Encoding) ---
const SKINS = ['#feedcf', '#f7d3a0', '#edb278', '#d38b58', '#9d6343', '#834c31', '#512f1f'];
const HAIRS = ['#1d1c1a', '#3f3123', '#663b21', '#85512b', '#7c6d66', '#a98059', '#b5a16d', '#bc9c65'];
const EYES_COLORS = ['#3f3530', '#7a818c', '#533c30', '#837b2d', '#426899', '#5d8050'];
const SHIRTS = ['#ff3333', '#3366ff', '#33cc33', '#ffcc00', '#ff6600', '#9933cc', '#ffffff', '#222222'];

let miiInstance = null;
let currentGLBModel = null;

function initMiiMaker(container) {
  // Wait for the Mii module to be globally available
  if (!window.Mii) {
    setTimeout(() => initMiiMaker(container), 100);
    return;
  }

  // 1. Build DOM Structure
  container.innerHTML = `
    <button class="mii-close-btn" title="Close Mii Maker">✖</button>
    <div class="mii-canvas-area" id="mii-canvas-container">
      <div id="mii-loading-overlay" style="position:absolute; inset:0; display:flex; justify-content:center; align-items:center; background:rgba(255,255,255,0.7); font-weight:bold; font-size:18px; color:#555; z-index:10; border-radius:12px;">Loading 3D Model...</div>
    </div>
    <div class="mii-controls-area">
      <div class="mii-header">Mii Maker</div>
      <div class="mii-subtitle">Detailed Customization</div>
      
      <div class="mii-tabs" style="flex-wrap: wrap;">
        <div class="mii-tab active" data-tab="head" style="font-size: 13px;">Head</div>
        <div class="mii-tab" data-tab="hair" style="font-size: 13px;">Hair</div>
        <div class="mii-tab" data-tab="eyes" style="font-size: 13px;">Eyes</div>
        <div class="mii-tab" data-tab="brows" style="font-size: 13px;">Brows</div>
        <div class="mii-tab" data-tab="mouth" style="font-size: 13px;">Mouth</div>
        <div class="mii-tab" data-tab="body" style="font-size: 13px;">Body</div>
        <div class="mii-tab" data-tab="profile" style="font-size: 13px;">Profile</div>
      </div>
      
      <!-- Head Tab -->
      <div class="mii-tab-content active" id="tab-head">
        <div class="mii-control-group">
          <label>Skin Color</label>
          <div class="mii-btn-grid" id="grid-skin"></div>
        </div>
      </div>

      <!-- Hair Tab -->
      <div class="mii-tab-content" id="tab-hair">
        <div class="mii-control-group">
          <label>Hair Style</label>
          <div class="mii-btn-grid" id="grid-hair-style">
            <button class="mii-color-btn" style="background:#ddd" data-val="33">Normal</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="14">Spiky</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="13">Messy</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="46">Swept</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="18">Bald</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="90">Bowl</button>
          </div>
        </div>
        <div class="mii-control-group">
          <label>Hair Color</label>
          <div class="mii-btn-grid" id="grid-hair-color"></div>
        </div>
      </div>

      <!-- Eyes Tab -->
      <div class="mii-tab-content" id="tab-eyes">
        <div class="mii-control-group">
          <label>Eye Style</label>
          <div class="mii-btn-grid" id="grid-eye-style">
            <button class="mii-color-btn" style="background:#ddd" data-val="2">Normal</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="14">Big</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="8">Dots</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="16">Angry</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="36">Sleepy</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="52">Happy</button>
          </div>
        </div>
        <div class="mii-control-group">
          <label>Eye Color</label>
          <div class="mii-btn-grid" id="grid-eye-color"></div>
        </div>
      </div>

      <!-- Brows Tab -->
      <div class="mii-tab-content" id="tab-brows">
        <div class="mii-control-group">
          <label>Eyebrow Style</label>
          <div class="mii-btn-grid" id="grid-brow-style">
            <button class="mii-color-btn" style="background:#ddd" data-val="6">Arc</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="1">Thick</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="9">Dot</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="13">Angry</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="4">Sad</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="24">None</button>
          </div>
        </div>
        <div class="mii-control-group">
          <label>Eyebrow Color</label>
          <div class="mii-btn-grid" id="grid-brow-color"></div>
        </div>
      </div>

      <!-- Mouth & Nose Tab -->
      <div class="mii-tab-content" id="tab-mouth">
        <div class="mii-control-group">
          <label>Mouth Style</label>
          <div class="mii-btn-grid" id="grid-mouth-style">
            <button class="mii-color-btn" style="background:#ddd" data-val="23">Smile</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="2">Open</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="10">Teeth</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="18">Frown</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="21">Line</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="13">Surprise</button>
          </div>
        </div>
        <div class="mii-control-group">
          <label>Nose Style</label>
          <div class="mii-btn-grid" id="grid-nose-style">
            <button class="mii-color-btn" style="background:#ddd" data-val="1">Normal</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="2">Pointy</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="8">Big</button>
            <button class="mii-color-btn" style="background:#ddd" data-val="0">Button</button>
          </div>
        </div>
      </div>
      
      <!-- Body Tab -->
      <div class="mii-tab-content" id="tab-body">
        <div class="mii-control-group">
          <label>Favorite Color (Shirt)</label>
          <div class="mii-btn-grid" id="grid-shirt"></div>
        </div>
      </div>
      
      <!-- Profile Tab -->
      <div class="mii-tab-content" id="tab-profile">
        <div class="mii-control-group">
          <label>First Name</label>
          <input type="text" class="mii-input" id="inp-first" placeholder="e.g. Mario">
        </div>
        <div class="mii-control-group">
          <label>Last Name</label>
          <input type="text" class="mii-input" id="inp-last" placeholder="e.g. Mario">
        </div>
        <div class="mii-control-group">
          <label>Nickname</label>
          <input type="text" class="mii-input" id="inp-nick" placeholder="e.g. Jumpman">
        </div>
        <div class="mii-control-group">
          <label>Birthday</label>
          <input type="date" class="mii-input" id="inp-birth">
        </div>
        <div class="mii-control-group">
          <label>Short Bio</label>
          <textarea class="mii-textarea" id="inp-bio" placeholder="It's-a me!"></textarea>
        </div>
      </div>
      
      <button class="mii-save-btn" id="btn-save">Save & Quit</button>
    </div>
  `;

  // Close Button
  container.querySelector('.mii-close-btn').addEventListener('click', () => {
    container.classList.add('closing');
    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 400); // Wait for CSS animation
  });

  // Tabs Logic
  const tabs = container.querySelectorAll('.mii-tab');
  const contents = container.querySelectorAll('.mii-tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      container.querySelector('#tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Default Base64 Mii Studio representation of a blank Mii Maker Mii
  const defaultMiiStr = "AwEAAAAAAAAAAAAAgP9wmQAAAAAAAAAAAABNAGkAaQAAAAAAAAAAAAAAAAAAAEBAAAAhAQJoRBgmNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMNn";
  const rawData = atob(defaultMiiStr);
  const u8 = new Uint8Array(rawData.length);
  for(let i = 0; i < rawData.length; i++) u8[i] = rawData.charCodeAt(i);
  miiInstance = new window.Mii(u8);

  // Populate Color Grids
  function populateGrid(gridId, colors, stateKey) {
    const grid = container.querySelector('#' + gridId);
    if (!grid) return;
    colors.forEach((c, index) => {
      const btn = document.createElement('div');
      let defaultIdx = 0;
      if (stateKey === 'eyeColor') defaultIdx = 1;
      if (stateKey === 'shirtColor') defaultIdx = 0; // usually red

      btn.className = 'mii-color-btn' + (index === defaultIdx ? ' active' : '');
      btn.style.backgroundColor = c;
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.mii-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Update Mii Instance Value
        if(stateKey === "skinColor") miiInstance.skinColor = index;
        if(stateKey === "hairColor") miiInstance.hairColor = index;
        if(stateKey === "eyeColor") miiInstance.eyeColor = index;
        if(stateKey === "eyebrowColor") miiInstance.eyebrowColor = index;
        if(stateKey === "shirtColor") miiInstance.favoriteColor = index;
        fetch3DModel();
      });
      grid.appendChild(btn);
    });
  }
  populateGrid('grid-skin', SKINS, 'skinColor');
  populateGrid('grid-hair-color', HAIRS, 'hairColor');
  populateGrid('grid-eye-color', EYES_COLORS, 'eyeColor');
  populateGrid('grid-brow-color', HAIRS, 'eyebrowColor');
  populateGrid('grid-shirt', SHIRTS, 'shirtColor');

  // Option Grid Helpers
  function bindOptionGrid(gridId, stateKey) {
    const grid = container.querySelector('#' + gridId);
    if (!grid) return;
    const btns = grid.querySelectorAll('button');
    btns.forEach(btn => {
      if (parseInt(btn.getAttribute('data-val')) === miiInstance[stateKey]) btn.classList.add('active');
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        miiInstance[stateKey] = parseInt(btn.getAttribute('data-val'));
        fetch3DModel();
      });
    });
  }
  bindOptionGrid('grid-hair-style', 'hairType');
  bindOptionGrid('grid-eye-style', 'eyeType');
  bindOptionGrid('grid-brow-style', 'eyebrowType');
  bindOptionGrid('grid-mouth-style', 'mouthType');
  bindOptionGrid('grid-nose-style', 'noseType');

  // Helper to re-encode the Mii into base64 for saving or rendering
  function encodeMiiBase64() {
    const enc = miiInstance.encode();
    let res = "";
    for(let i=0; i<enc.length; i++) res+=String.fromCharCode(enc[i]);
    return btoa(res);
  }

  // Profile Data Fetcher
  const getProfileData = () => ({
    first_name: container.querySelector('#inp-first').value.trim(),
    last_name: container.querySelector('#inp-last').value.trim(),
    username: container.querySelector('#inp-nick').value.trim(),
    birthday: container.querySelector('#inp-birth').value, // YYYY-MM-DD
    bio: container.querySelector('#inp-bio').value.trim(),
    visual_base64: encodeMiiBase64()
  });

  // Save via API
  container.querySelector('#btn-save').addEventListener('click', async () => {
    const btn = container.querySelector('#btn-save');
    const data = getProfileData();
    if (!data.username) {
      alert("Please enter a Nickname before saving!");
      return;
    }

    // Set Mii name byte encoding safely
    if (data.first_name) miiInstance.miiName = data.first_name;

    try {
      btn.textContent = "Saving...";
      btn.disabled = true;
      const res = await fetch('http://localhost:3000/api/avatars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        if (typeof AudioManager !== 'undefined') AudioManager.playPop(); // Play success
        btn.textContent = "Saved!";
        setTimeout(() => {
          container.querySelector('.mii-close-btn').click();
        }, 1000);
      } else {
        const errInfo = await res.json();
        alert('Error saving avatar: ' + (errInfo.error || 'Server error'));
        btn.textContent = "Save & Quit";
        btn.disabled = false;
      }
    } catch(err) {
      console.error(err);
      alert("Failed to connect to the local Node server. Have you run 'node server.js'?");
      btn.textContent = "Save & Quit";
      btn.disabled = false;
    }
  });

  // --- THREE.JS SCENE SETUP ---
  const canvasArea = container.querySelector('#mii-canvas-container');
  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(45, canvasArea.clientWidth / canvasArea.clientHeight, 0.1, 100);
  camera.position.set(0, 4, 15);
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(canvasArea.clientWidth, canvasArea.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  canvasArea.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(2, 5, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-5, 0, -5);
  scene.add(backLight);

  // Platform
  const padGeo = new THREE.CylinderGeometry(3, 3, 0.2, 32);
  const padMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.y = -0.1;
  pad.receiveShadow = true;
  scene.add(pad);

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.minDistance = 3;
  controls.maxDistance = 20;
  controls.target.set(0, 3.5, 0);

  // Resize handler
  const onResize = () => {
    if (!container.parentNode) return;
    const w = canvasArea.clientWidth || window.innerWidth - 420; // fallback if flex layout isn't ready
    const h = canvasArea.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);
  setTimeout(onResize, 50);

  // GLTF Loader instance
  const loader = new THREE.GLTFLoader();

  // Async model fetcher from authentic API
  function fetch3DModel() {
    const loadingOverlay = document.getElementById('mii-loading-overlay');
    if(loadingOverlay) loadingOverlay.style.display = 'flex';

    const b64 = encodeMiiBase64();
    const url = `https://mii-unsecure.ariankordi.net/miis/image.glb?data=${encodeURIComponent(b64)}&verifyCharInfo=0&shaderType=wiiu&type=face`;

    loader.load(url, (gltf) => {
      // Remove previous model
      if (currentGLBModel) {
        scene.remove(currentGLBModel);
      }
      
      const model = gltf.scene;
      model.position.y = 0; // API usually provides the neck correctly
      
      // Make it slightly bigger
      model.scale.set(1.5, 1.5, 1.5);
      
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if(child.material) {
            child.material.side = THREE.DoubleSide;
          }
        }
      });
      
      scene.add(model);
      currentGLBModel = model;
      if(loadingOverlay) loadingOverlay.style.display = 'none';

    }, undefined, (error) => {
      console.error('An error happened loading the remote GLB', error);
      if(loadingOverlay) loadingOverlay.textContent = 'Failed to load model.';
    });
  }

  // Load the first preview 
  fetch3DModel();

  // Animation Loop
  let reqId;
  function animate() {
    reqId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
