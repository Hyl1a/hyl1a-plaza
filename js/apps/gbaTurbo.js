/**
 * GBA Turbo App
 * A performance-focused version of the GBA emulator using the gpSP core.
 */
window.gbaTurbo = {
  id: 'gbaTurbo',
  title: 'GBA Turbo',
  
  open: function(container) {
    // We can reuse the rendering logic from GBA but with a different flag
    // For simplicity, I'll copy the core parts and modify the core parameter
    this.render(container);
  },

  render: function(container) {
    if (window.GBA_GAMES && window.GBA_GAMES.length > 0) {
      this.renderTurboMenu(container);
    } else {
      container.innerHTML = '<div style="color:white; padding:20px; font-family: sans-serif; text-align:center; margin-top:50px;">' +
        '<div class="loading-spinner"></div><br>Chargement des jeux...</div>';
      setTimeout(() => this.render(container), 200);
    }
  },

  renderTurboMenu: function(container) {
    // Independent index for Turbo
    if (this.currentCoverIndex === undefined) this.currentCoverIndex = 0;
    
    const GBA_GAMES = window.GBA_GAMES;
    let coversHtml = '';
    GBA_GAMES.forEach((game, index) => {
      coversHtml += `
        <div class="gba-cover-item ${index === this.currentCoverIndex ? 'active' : ''}" data-index="${index}">
           <img src="${game.cover}" class="gba-cover-img" onerror="this.src='assets/icons/guestbook.png'" />
        </div>
      `;
    });

    container.innerHTML = `
      <div class="gba-menu-wrapper turbo-theme" tabindex="-1" style="background: radial-gradient(circle, #400, #000);">
        <button id="turbo-btn-prev" class="gba-arrow" style="background: rgba(255,0,0,0.1);"><svg viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="3"><polyline points="15 18 9 12 15 6"/></svg></button>
        <button id="turbo-btn-next" class="gba-arrow" style="background: rgba(255,0,0,0.1);"><svg viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg></button>
        <div class="gba-covers-row" id="turbo-scroll-row" style="padding: 0 500px;">
          ${coversHtml}
        </div>
        <div class="gba-info-panel" style="background: linear-gradient(to top, rgba(139,0,0,0.9), transparent);">
          <h2 class="gba-title" style="color: #ff4b4b; text-shadow: 0 0 15px rgba(255,0,0,0.5);">GBA TURBO : ${GBA_GAMES[this.currentCoverIndex].name}</h2>
          <div class="gba-playtime" style="color: #ff9999;">PERFORMANCE MAXIMALE (GPSP)</div>
          <div class="gba-controls">
             <button class="gba-btn primary" id="turbo-launch-btn" style="background: rgba(255,0,0,0.4); border-color: red;"><b>A</b> TURBO START</button>
             <button class="gba-btn" id="turbo-quit-btn"><b>B</b> RETOUR</button>
          </div>
        </div>
      </div>
    `;

    // Internal navigation logic (simplified for reliability)
    const update = () => {
        const title = container.querySelector('.gba-title');
        title.textContent = "GBA TURBO : " + GBA_GAMES[this.currentCoverIndex].name;
        container.querySelectorAll('.gba-cover-item').forEach((item, i) => {
            item.classList.toggle('active', i === this.currentCoverIndex);
        });
        const row = container.querySelector('#turbo-scroll-row');
        row.scrollTo({ left: (this.currentCoverIndex * 260) + 110, behavior: 'smooth' });
    };

    container.querySelector('#turbo-btn-prev').onclick = () => {
        if (this.currentCoverIndex > 0) { this.currentCoverIndex--; update(); }
    };
    container.querySelector('#turbo-btn-next').onclick = () => {
        if (this.currentCoverIndex < GBA_GAMES.length - 1) { this.currentCoverIndex++; update(); }
    };
    container.querySelector('#turbo-launch-btn').onclick = () => {
        this.launchTurbo(container, GBA_GAMES[this.currentCoverIndex]);
    };
    container.querySelector('#turbo-quit-btn').onclick = () => {
        window.AppRegistry['gbaTurbo'].close();
    };
    
    // Initial scroll
    setTimeout(update, 100);
  },

  launchTurbo: function(container, game) {
    const romUrl = encodeURIComponent(game.file);
    const gameName = encodeURIComponent(game.name);
    
    // Stop background music
    if (typeof AudioManager !== 'undefined') {
      AudioManager.pauseMusic();
      if (AudioManager.appBgm) {
        AudioManager.appBgm.pause();
        AudioManager.appBgm.currentTime = 0;
        AudioManager.appBgm = null;
      }
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; width: 100%; height: 100%; background: #000; overflow: hidden; animation: gbaFadeIn 0.3s ease-out;">
        <div style="padding: 12px 20px; background: rgba(180,20,20,0.9); backdrop-filter: blur(10px); display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(255,100,100,0.3); z-index: 100;">
          <div id="emu-back-btn" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.2); border-radius: 40px; padding: 6px 18px; color: white; cursor: pointer; font-weight: 700; transition: 0.2s;">
             <span style="background: white; color: black; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 13px;">B</span> Quitter
          </div>
          <h3 style="margin: 0; color: white; font-size: 20px; font-weight: 800; letter-spacing: 1px; text-shadow: 0 0 10px rgba(255,0,0,0.5);">GBA TURBO : ${game.name}</h3>
          <div style="width: 100px; color: #ff4b4b; font-size: 10px; font-weight: 900;">CORE: GPSP</div>
        </div>
        <div style="flex: 1; position: relative; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #300, #000);">
          <iframe src="/gba%20app/gba_player.html#rom=${romUrl}&name=${gameName}&core=gpsp" style="border: none; width: 100%; height: 100%; max-width: 1280px;" allow="autoplay; fullscreen"></iframe>
        </div>
      </div>
    `;

    const backBtn = container.querySelector('#emu-back-btn');
    backBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playClick();
        AudioManager.playAppLaunchTransition(null, 'gbaBgm');
      }
      this.render(container); 
    });
  }
};
