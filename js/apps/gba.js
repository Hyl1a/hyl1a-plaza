/**
 * GBA Emulator App
 * Uses EmulatorJS via an iframe.
 */

// User can add games here. Ensure the ROM files (.gba) are placed in the correct folder,
// for example relative to the index.html file: 'roms/gba/mygame.gba'
const GBA_GAMES = [
  { name: 'Pokémon Émeraude', file: 'roms/gba/Pokemon - Version Emeraude (France).gba' },
  { name: 'Pokémon Rouge Feu', file: 'roms/gba/Pokemon - Version Rouge Feu (France).gba' }
];

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.AppRegistry) {
      window.AppRegistry['gba'].render = function (container) {
        renderGbaMenu(container);
      };
    }
  }, 100);
});

function renderGbaMenu(container) {
  let html = `
    <div class="gba-app-container" style="display: flex; flex-direction: column; width: 100%; height: 100%; font-family: sans-serif; background: #222; color: #fff; border-radius: 8px; overflow: hidden;">
      <div style="padding: 15px; background: #333; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #555;">
        <h2 style="margin: 0; font-size: 20px;">🎮 Émulateur GBA</h2>
        <span style="font-size: 12px; opacity: 0.7;">Sélectionnez un jeu pour jouer</span>
      </div>
      <div style="flex: 1; overflow-y: auto; padding: 20px;">
  `;

  if (GBA_GAMES.length === 0) {
    html += `<div style="text-align: center; padding: 40px; color: #aaa;">Aucun jeu disponible. Veuillez configurer GBA_GAMES dans js/apps/gba.js.</div>`;
  } else {
    html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">`;
    GBA_GAMES.forEach((game, index) => {
      html += `
        <div class="gba-game-card" data-index="${index}" style="background: #444; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; transition: transform 0.2s, background 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);" onmouseover="this.style.background='#5a4ca1'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='#444'; this.style.transform='scale(1)';">
          <div style="font-size: 40px; margin-bottom: 10px;">🕹️</div>
          <div style="font-weight: bold; font-size: 15px;">${game.name}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  html += `
        <div style="margin-top: 30px; padding: 20px; background: #333; border-radius: 8px; font-size: 13px; color: #ccc; line-height: 1.5; border-left: 4px solid #7a5cf2;">
          <strong style="color: white; font-size: 14px;">Comment ajouter vos propres jeux :</strong><br>
          1. Créez un dossier <code>roms/gba</code> à la racine de votre projet.<br>
          2. Placez vos fichiers <code>.gba</code> à l'intérieur de ce dossier.<br>
          3. Pour modifier la liste des jeux affichés, ouvrez le fichier <code>js/apps/gba.js</code> et modifiez la variable <strong>GBA_GAMES</strong> située tout en haut.
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Add click listeners
  const cards = container.querySelectorAll('.gba-game-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt(card.getAttribute('data-index'), 10);
      const game = GBA_GAMES[index];
      launchEmulator(container, game);
    });
  });
}

function launchEmulator(container, game) {
  const romUrl = encodeURIComponent(game.file);
  const gameName = encodeURIComponent(game.name);
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; width: 100%; height: 100%; background: #000; border-radius: 8px; overflow: hidden;">
      <div style="padding: 10px 15px; background: #222; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
        <button class="gba-back-btn" style="background: #555; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.2s;" onmouseover="this.style.background='#666';" onmouseout="this.style.background='#555';">🔙 Retour</button>
        <h3 style="margin: 0; color: white; font-size: 16px;">${game.name}</h3>
        <div style="width: 80px;"></div> <!-- Spacer so title is centered -->
      </div>
      <div style="flex: 1; position: relative;">
        <iframe src="gba_player.html?rom=${romUrl}&name=${gameName}" style="border: none; width: 100%; height: 100%;" allow="autoplay; fullscreen"></iframe>
      </div>
    </div>
  `;

  // Back button listener
  container.querySelector('.gba-back-btn').addEventListener('click', () => {
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    renderGbaMenu(container); // Go back to menu
  });
}
