// Mii Plaza Implementation
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.AppRegistry) {
      window.AppRegistry['miiPlaza'].render = function(container) {
        initMiiPlaza(container);
      };
    }
  }, 100);
});

async function initMiiPlaza(container) {
  container.innerHTML = `
    <button class="mii-close-btn" title="Close Mii Plaza">✖</button>
    <div id="plaza-loading">Loading Avatars...</div>
    <div class="mii-canvas-area" id="plaza-canvas-container" style="width: 100vw; height: 100vh;"></div>
    <div id="plaza-labels" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden;"></div>
  `;

  // Close Button
  container.querySelector('.mii-close-btn').addEventListener('click', () => {
    container.classList.add('closing');
    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 400);
  });

  // Fetch Avatars
  let avatars = [];
  try {
    const res = await fetch('http://localhost:3000/api/avatars');
    if (res.ok) {
      avatars = await res.json();
    } else {
      console.error("Failed to fetch avatars");
    }
  } catch(e) {
    console.error("API not reachable", e);
  }
  
  container.querySelector('#plaza-loading').style.display = 'none';

  // --- THREE.JS SCENE SETUP ---
  const canvasArea = container.querySelector('#plaza-canvas-container');
  const labelsArea = container.querySelector('#plaza-labels');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd4e1ed); // Sky color
  scene.fog = new THREE.Fog(0xd4e1ed, 20, 60);
  
  const camera = new THREE.PerspectiveCamera(45, canvasArea.clientWidth / canvasArea.clientHeight, 0.1, 100);
  camera.position.set(0, 10, 25);
  
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
  renderer.setSize(canvasArea.clientWidth, canvasArea.clientHeight);
  renderer.shadowMap.enabled = true;
  canvasArea.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(20, 30, 10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  scene.add(dirLight);

  // Plaza Ground
  const groundGeo = new THREE.CylinderGeometry(25, 25, 1, 64);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x88cc88, roughness: 0.8 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2 - 0.1; // Don't go below ground
  controls.minDistance = 5;
  controls.maxDistance = 40;
  controls.target.set(0, 2, 0);

  // Resize handler
  const onResize = () => {
    if (!container.parentNode) return;
    const w = canvasArea.clientWidth || window.innerWidth;
    const h = canvasArea.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);
  
  // Force initial resize safely
  setTimeout(onResize, 50);

  // Populate Avatars
  const miiEntities = [];

  avatars.forEach(av => {
    let mesh;
    if (window.MiiBuilder) {
      mesh = window.MiiBuilder.buildAvatar(av.visual_data);
    } else {
      mesh = new THREE.Group(); // fallback
    }
    
    // Random position in circle
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 15;
    mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    scene.add(mesh);

    // Create 2D Label
    const label = document.createElement('div');
    label.textContent = av.username;
    label.style.position = 'absolute';
    label.style.background = 'rgba(255,255,255,0.8)';
    label.style.padding = '4px 8px';
    label.style.borderRadius = '12px';
    label.style.fontSize = '12px';
    label.style.fontWeight = 'bold';
    label.style.transform = 'translate(-50%, -50%)';
    label.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    label.style.color = '#333';
    labelsArea.appendChild(label);

    miiEntities.push({
      mesh,
      label,
      targetX: mesh.position.x,
      targetZ: mesh.position.z,
      state: 'idle', // idle, walk
      timer: Math.random() * 100
    });
  });

  // Animation Loop
  let reqId;
  function animate() {
    if (!container.parentNode) return; // Stop if closed
    reqId = requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Animate avatars
    miiEntities.forEach(ent => {
      ent.timer--;

      if (ent.timer <= 0) {
        // State switch
        if (ent.state === 'idle') {
          ent.state = 'walk';
          ent.timer = 100 + Math.random() * 200;
          // Pick new target
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 18;
          ent.targetX = Math.cos(angle) * radius;
          ent.targetZ = Math.sin(angle) * radius;
        } else {
          ent.state = 'idle';
          ent.timer = 50 + Math.random() * 150;
        }
      }

      const ud = ent.mesh.userData;

      if (ent.state === 'walk') {
        const dx = ent.targetX - ent.mesh.position.x;
        const dz = ent.targetZ - ent.mesh.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist > 0.1) {
          // Move
          ent.mesh.position.x += (dx/dist) * 0.05;
          ent.mesh.position.z += (dz/dist) * 0.05;
          
          // Rotate towards target
          const targetRot = Math.atan2(dx, dz);
          // Simple rotation smoothing
          ent.mesh.rotation.y += (targetRot - ent.mesh.rotation.y) * 0.1;

          // Walk animation (swing limbs)
          ud.walkCycle += 0.2;
          ud.leftLeg.rotation.x = Math.sin(ud.walkCycle) * 0.5;
          ud.rightLeg.rotation.x = Math.sin(ud.walkCycle + Math.PI) * 0.5;
          ud.leftArm.rotation.x = Math.sin(ud.walkCycle + Math.PI) * 0.5;
          ud.rightArm.rotation.x = Math.sin(ud.walkCycle) * 0.5;
        } else {
          ent.state = 'idle';
        }
      } else {
        // Idle animation (return limbs to normal)
        ud.walkCycle = 0;
        ud.leftLeg.rotation.x *= 0.8;
        ud.rightLeg.rotation.x *= 0.8;
        ud.leftArm.rotation.x *= 0.8;
        ud.rightArm.rotation.x *= 0.8;
      }

      // Update 2D Label position
      const vector = new THREE.Vector3();
      const heightOffset = 6 * (ent.mesh.scale.y); // dynamic depending on config.height
      vector.setFromMatrixPosition(ent.mesh.matrixWorld);
      vector.y += heightOffset;
      vector.project(camera);

      // Map to 2D screen coordinates
      const x = (vector.x * .5 + .5) * canvasArea.clientWidth;
      const y = (vector.y * -.5 + .5) * canvasArea.clientHeight;

      // Only show if in front of camera
      if (vector.z < 1) {
        ent.label.style.display = 'block';
        ent.label.style.left = `${x}px`;
        ent.label.style.top = `${y}px`;
      } else {
        ent.label.style.display = 'none';
      }
    });

    renderer.render(scene, camera);
  }
  animate();
}
