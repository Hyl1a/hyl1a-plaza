const GBA_GAMES = [
  { name: 'Pokémon Émeraude', file: '/gba app/assets/roms/gba/Pokemon - Version Emeraude (France).gba', playtime: '12h 45m', cover: 'assets/icons/pkmnemeraude.jpg' },
  { name: 'Pokémon Rouge Feu', file: '/gba app/assets/roms/gba/Pokemon - Version Rouge Feu (France).gba', playtime: '4h 30m', cover: 'assets/icons/pkmnrouge.jpg' },
  { name: 'Kirby & the Amazing Mirror', file: '/gba app/assets/roms/gba/Kirby & the Amazing Mirror (Europe) (En,Fr,De,Es,It).zip', playtime: '0h 00m' },
  { name: 'The Legend of Zelda: The Minish Cap', file: '/gba app/assets/roms/gba/Legend of Zelda, The - The Minish Cap (Europe) (En,Fr,De,Es,It).zip', playtime: '0h 00m' }
];

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.AppRegistry && window.AppRegistry['gba']) {
      window.AppRegistry['gba'].render = function (container) {
        renderGbaMenu(container);
      };
    }
  }, 100);
});

let currentCoverIndex = 0;

function renderGbaMenu(container) {
  // Add CSS for Advanced Cover Flow if not exists
  if (!document.getElementById('gba-adv-cover-styles')) {
    const style = document.createElement('style');
    style.id = 'gba-adv-cover-styles';
    style.textContent = `
      .gba-cf-container {
        display: flex; flex-direction: column; width: 100%; height: 100%; font-family: 'Inter', sans-serif;
        background: transparent; color: #fff; overflow: hidden; position: relative;
        animation: gbaFadeIn 0.5s ease-out;
      }
      @keyframes gbaFadeIn {
        from { opacity: 0; transform: scale(1.05); }
        to { opacity: 1; transform: scale(1); }
      }
      .gba-cf-viewport {
        flex: 1; perspective: 1200px; perspective-origin: 50% 50%; display: flex;
        justify-content: center; align-items: center; position: relative; overflow: hidden;
      }
      .gba-cf-track {
        position: relative; width: 0; height: 0; transform-style: preserve-3d;
      }
      .gba-cf-cover {
        position: absolute; width: 220px; height: 320px; top: -160px; left: -110px; border-radius: 8px;
        transform-style: preserve-3d; cursor: pointer; will-change: transform, opacity;
        transform-origin: center center; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.7));
        transition: filter 0.3s ease;
      }
      .gba-cf-cover.active {
        filter: drop-shadow(0 0 30px rgba(90,180,255,0.7)) drop-shadow(0 25px 50px rgba(0,0,0,0.8));
        animation: gbaCoverIdle 3s ease-in-out infinite;
      }
      @keyframes gbaCoverIdle {
        0%, 100% { margin-top: 0px; }
        50%      { margin-top: -10px; }
      }
      .gba-cf-face {
        position: absolute; inset: 0; border-radius: 8px; overflow: hidden;
        border: 2.5px solid rgba(255,255,255,0.2); background: #111;
        box-shadow: inset 0 0 60px rgba(0,0,0,0.5);
      }
      .gba-cf-img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .gba-cf-fallback {
        width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 16px; padding: 20px; text-align: center;
      }
      .gba-cf-shine {
        position: absolute; inset: 0; z-index: 2; border-radius: 8px; pointer-events: none;
        background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.00) 100%);
      }
      .gba-cf-spine {
        position: absolute; right: -20px; top: 0; width: 20px; height: 100%; display: flex; align-items: center; justify-content: center;
        border-radius: 0 4px 4px 0; z-index: 0; overflow: hidden; transform: rotateY(-90deg) translateZ(-10px); transform-origin: left center;
        background: linear-gradient(to bottom, #7e1fff, #3a2b71);
        border: 2px solid rgba(255,255,255,0.1);
      }
      .gba-cf-spine span {
        writing-mode: vertical-rl; text-orientation: mixed; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.9);
        letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-height: 90%;
      }
      .gba-cf-arrow {
        position: absolute; top: 50%; transform: translateY(-50%); z-index: 10000; width: 80px; height: 120px;
        border-radius: 12px; border: none; background: rgba(255,255,255,0.1); backdrop-filter: blur(15px);
        color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; box-shadow: 0 5px 35px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
      }
      .gba-cf-arrow:hover { background: rgba(255,255,255,0.25); transform: translateY(-50%) scale(1.05); }
      #gba-cf-arrow-left { left: 20px; }
      #gba-cf-arrow-right { right: 20px; }
      .gba-cf-arrow svg { width: 40px; height: 40px; }

      .gba-cf-info {
        height: 140px; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        border-top: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px;
      }
      .gba-cf-title { font-size: 34px; font-weight: 800; color: white; text-shadow: 0 2px 20px rgba(0,0,0,1); letter-spacing: 0.02em; margin: 0; }
      .gba-cf-playtime { font-size: 15px; color: #7ec4ff; font-weight: 600; margin-bottom: 10px; }
      .gba-cf-controls { display: flex; gap: 30px; }
      .gba-cf-btn {
        display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.2);
        border-radius: 40px; padding: 8px 24px; font-size: 15px; color: #eee; font-weight: 700; cursor: pointer; transition: all 0.2s;
      }
      .gba-cf-btn:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); border-color: rgba(255,255,255,0.4); }
      .gba-cf-btn.primary { background: rgba(0, 150, 255, 0.25); border-color: rgba(0, 150, 255, 0.6); color: #fff; }
      .gba-cf-btn.primary:hover { background: rgba(0, 150, 255, 0.4); border-color: rgba(0, 150, 255, 0.8); }
      .gba-cf-btn b { background: #fff; color: #000; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; }
    `;
    document.head.appendChild(style);
  }

  // Enforce limits
  if (currentCoverIndex < 0) currentCoverIndex = 0;
  if (currentCoverIndex >= GBA_GAMES.length) currentCoverIndex = GBA_GAMES.length - 1;

  let html = `
    <div class="gba-cf-container">
      <div class="gba-cf-viewport" id="gba-cf-viewport">
        <button id="gba-cf-arrow-left" class="gba-cf-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button id="gba-cf-arrow-right" class="gba-cf-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="gba-cf-track" id="gba-cf-track">
  `;

  GBA_GAMES.forEach((game, index) => {
    const coverHtml = game.cover 
      ? `<img src="${game.cover}" class="gba-cf-img" onerror="this.style.display='none'; this.nextSibling.style.display='flex';"/>
         <div class="gba-cf-fallback" style="display:none; background: linear-gradient(165deg, #3a2b71, #1a1a2e);">
           <span style="font-size: 56px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">🎮</span>
           <span style="font-size: 14px; font-weight: 800; opacity: 0.9; text-transform: uppercase;">Game Boy Advance</span>
         </div>` 
      : `<div class="gba-cf-fallback" style="background: linear-gradient(165deg, #3a2b71, #1a1a2e);">
           <span style="font-size: 56px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">🎮</span>
           <span style="font-size: 14px; font-weight: 800; opacity: 0.9; text-transform: uppercase;">Game Boy Advance</span>
           <div style="margin-top: 10px; font-size: 18px; font-weight: 700;">${game.name}</div>
         </div>`;
    
    html += `
      <div class="gba-cf-cover" id="gba-cover-${index}" data-index="${index}">
        <div class="gba-cf-shine"></div>
        <div class="gba-cf-face">
          ${coverHtml}
        </div>
        <div class="gba-cf-spine">
          <span>${game.name}</span>
        </div>
      </div>
    `;
  });

  html += `
        </div>
      </div>
      <div class="gba-cf-info">
        <h2 class="gba-cf-title" id="gba-game-title">${GBA_GAMES[currentCoverIndex].name}</h2>
        <div class="gba-cf-playtime" id="gba-game-playtime">Temps de jeu : ${GBA_GAMES[currentCoverIndex].playtime}</div>
        <div class="gba-cf-controls">
           <div class="gba-cf-btn primary" id="gba-btn-play">
              <b>A</b> DÉMARRER
           </div>
           <div class="gba-cf-btn" id="gba-btn-back">
              <b>B</b> QUITTER
           </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  if (GBA_GAMES.length > 0) {
    updateCarouselTransforms();

    const covers = container.querySelectorAll('.gba-cf-cover');
    covers.forEach(cover => {
      cover.addEventListener('click', () => {
        const index = parseInt(cover.getAttribute('data-index'), 10);
        if (currentCoverIndex === index) {
          if (typeof AudioManager !== 'undefined') AudioManager.playClick();
          launchEmulator(container, GBA_GAMES[currentCoverIndex]);
        } else {
          currentCoverIndex = index;
          if (typeof AudioManager !== 'undefined') AudioManager.playHover();
          updateCarouselTransforms();
        }
      });
    });

    document.getElementById('gba-cf-arrow-left').addEventListener('click', () => navigateGba(-1));
    document.getElementById('gba-cf-arrow-right').addEventListener('click', () => navigateGba(1));
    document.getElementById('gba-btn-play').addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      launchEmulator(container, GBA_GAMES[currentCoverIndex]);
    });

    const keyHandler = (e) => {
      if (!document.querySelector('.gba-cf-container')) {
        window.removeEventListener('keydown', keyHandler);
        return;
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigateGba(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); navigateGba(-1); }
      else if (e.key === 'Enter') { 
        e.preventDefault(); 
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        launchEmulator(container, GBA_GAMES[currentCoverIndex]); 
      }
      else if (e.key === 'b' || e.key === 'Escape') {
        e.preventDefault();
        document.getElementById('gba-btn-back').click();
      }
    };
    
    if (window._gbaKeyHandler) window.removeEventListener('keydown', window._gbaKeyHandler);
    window._gbaKeyHandler = keyHandler;
    window.addEventListener('keydown', keyHandler);
  }

  document.getElementById('gba-btn-back').addEventListener('click', () => {
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    if (window._gbaKeyHandler) window.removeEventListener('keydown', window._gbaKeyHandler);
    if (window.AppRegistry['gba'] && window.AppRegistry['gba'].close) {
      window.AppRegistry['gba'].close();
    }
  });
}

function navigateGba(dir) {
  const newIndex = currentCoverIndex + dir;
  console.log("GBA: Navigate", dir, "Current:", currentCoverIndex, "New:", newIndex, "Length:", GBA_GAMES.length);
  if (newIndex >= 0 && newIndex < GBA_GAMES.length) {
    currentCoverIndex = newIndex;
    if (typeof AudioManager !== 'undefined') AudioManager.playHover();
    updateCarouselTransforms();
  }
}

function updateCarouselTransforms() {
  const title = document.getElementById('gba-game-title');
  const playtime = document.getElementById('gba-game-playtime');
  if (title && GBA_GAMES[currentCoverIndex]) title.textContent = GBA_GAMES[currentCoverIndex].name;
  if (playtime && GBA_GAMES[currentCoverIndex]) playtime.textContent = `Temps de jeu : ${GBA_GAMES[currentCoverIndex].playtime}`;

  const COVER_WIDTH = 220;
  const GAP = 80;
  const ANGLE_SIDE = 75;
  const Z_ACTIVE = 150;
  const Z_SIDE = -180;

  GBA_GAMES.forEach((game, index) => {
    const cover = document.getElementById(`gba-cover-${index}`);
    if (!cover) return;
    
    const offset = index - currentCoverIndex;
    const absOff = Math.abs(offset);
    
    const hidden = absOff > 5;
    cover.style.display = hidden ? 'none' : 'block';
    
    const tx = offset * (COVER_WIDTH + GAP);
    const tz = offset === 0 ? Z_ACTIVE : Z_SIDE - absOff * 50;
    const ry = offset === 0 ? 0 : (offset > 0 ? -ANGLE_SIDE : ANGLE_SIDE);
    const scale = offset === 0 ? 1.1 : Math.max(0.6, 0.9 - absOff * 0.08);
    const opacity = offset === 0 ? 1.0 : Math.max(0, 0.9 - absOff * 0.2);
    
    cover.style.transition = 'transform 0.5s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.5s ease, filter 0.5s ease';
    cover.style.transform  = `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`;
    cover.style.opacity    = opacity;
    cover.style.zIndex     = 100 - absOff;
    
    if (offset === 0) cover.classList.add('active');
    else cover.classList.remove('active');
  });
}

function launchEmulator(container, game) {
  const romUrl = encodeURIComponent(game.file);
  const gameName = encodeURIComponent(game.name);
  
  // Clean up global key listener before iframe takes over
  if (window._gbaKeyHandler) window.removeEventListener('keydown', window._gbaKeyHandler);

  // Pause background music to avoid overlap
  if (typeof AudioManager !== 'undefined') {
    console.log("GBA: Pausing background music...");
    AudioManager.pauseMusic();
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; width: 100%; height: 100%; background: #000; overflow: hidden; animation: gbaFadeIn 0.3s ease-out;">
      <div style="padding: 12px 20px; background: rgba(30,30,30,0.9); backdrop-filter: blur(10px); display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(255,255,255,0.1); z-index: 100;">
        <div id="emu-back-btn" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.2); border-radius: 40px; padding: 6px 18px; color: white; cursor: pointer; font-weight: 700; transition: 0.2s;">
           <span style="background: white; color: black; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 13px;">B</span> Quitter
        </div>
        <h3 style="margin: 0; color: white; font-size: 20px; font-weight: 400; letter-spacing: 1px;">${game.name}</h3>
        <div style="width: 100px;"></div>
      </div>
      <div style="flex: 1; position: relative; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #222, #000);">
        <iframe src="/gba%20app/gba_player.html#rom=${romUrl}&name=${gameName}" style="border: none; width: 100%; height: 100%; max-width: 1280px;" allow="autoplay; fullscreen"></iframe>
      </div>
    </div>
  `;

  const backBtn = container.querySelector('#emu-back-btn');
  backBtn.addEventListener('mouseover', () => backBtn.style.background = 'rgba(255,255,255,0.2)');
  backBtn.addEventListener('mouseout', () => backBtn.style.background = 'rgba(255,255,255,0.1)');
  backBtn.addEventListener('click', () => {
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    renderGbaMenu(container); 
  });
}
