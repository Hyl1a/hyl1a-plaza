/**
 * Theme Manager
 * Handles switching between visual themes (backgrounds + color accents).
 * Themes: Default, Zelda (Link), Mario, Dragon Ball
 */
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const ThemeManager = {
  themes: {
    default: {
      name: 'Default',
      emoji: '🏠',
      bgGradient: 'linear-gradient(135deg, #f0f0f0 0%, #e0e4e8 50%, #d5dce3 100%)',
      accentColor: '#00d2ff',
      textColor: '#555',
      pillBg: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(240,240,240,0.9))'
    },
    zelda: {
      name: 'Hyrule',
      emoji: '🗡️',
      bgGradient: 'linear-gradient(135deg, #4a7c3f 0%, #2d5a27 40%, #1a3d15 70%, #99a031fc 100%)',
      accentColor: '#b89e0bff',
      textColor: '#2d5016',
      pillBg: 'linear-gradient(to bottom, rgba(255,248,220,0.95), rgba(209, 218, 130, 0.9))'
    },
    mario: {
      name: 'Mario',
      emoji: '🍄',
      bgGradient: 'linear-gradient(135deg, #e52521 0%, #c41e1a 30%, #d96b4aff 60%, #ebb487ff 100%)',
      accentColor: '#e52521',
      textColor: '#c41e1a',
      pillBg: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,230,230,0.9))'
    },
    dragonball: {
      name: 'Dragon Ball',
      emoji: '🐉',
      bgGradient: 'linear-gradient(135deg, #2d0d35ff 0%, #9422a3ff 35%, #871fa7ff 65%, #3b0739ff 100%)',
      accentColor: '#b700ffff',
      textColor: '#661088ff',
      pillBg: 'linear-gradient(to bottom, rgba(241, 220, 255, 0.95), rgba(232, 140, 255, 0.9))'
    }
  },

  currentTheme: 'default',

  async init() {
    // Load saved theme
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    const fbUser = window.Auth ? window.Auth.currentUser : null;
    
    if (fbUser) {
      try {
        const docRef = doc(window.FirebaseDB, "settings", fbUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.theme_id && this.themes[data.theme_id]) {
            this.apply(data.theme_id, false); // false = don't save back
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch theme from DB", e);
      }
    }
    
    // Fallback
    const saved = localStorage.getItem('nostalgia-theme');
    if (saved && this.themes[saved]) {
      this.apply(saved, false);
    }
  },

  async apply(themeId, saveToDb = true) {
    const theme = this.themes[themeId];
    if (!theme) return;

    this.currentTheme = themeId;
    localStorage.setItem('nostalgia-theme', themeId); // Keep as local fallback

    if (saveToDb) {
      const fbUser = window.Auth ? window.Auth.currentUser : null;
      if (fbUser) {
        try {
          await setDoc(doc(window.FirebaseDB, "settings", fbUser.uid), {
            theme_id: themeId
          }, { merge: true });
        } catch (e) {
          console.error("Failed to save theme to DB", e);
        }
      }
    }

    const root = document.documentElement.style;

    // Background
    document.body.style.background = theme.bgGradient;

    // Accent color for hover borders
    root.setProperty('--theme-accent', theme.accentColor);
    root.setProperty('--theme-tile-overlay', theme.tileOverlay);
    root.setProperty('--theme-pill-bg', theme.pillBg);

    // Update the title pill styling
    const pill = document.getElementById('dynamic-title-pill');
    if (pill) {
      pill.style.background = theme.pillBg;
      pill.style.color = theme.textColor;
    }

    // Mark active theme in selector if open
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === themeId);
    });
  },

  openSelector() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'theme-overlay';
    overlay.innerHTML = `
      <div class="theme-modal glossy-glass">
        <h2>🎨 Choose a Theme</h2>
        <div class="theme-grid">
          ${Object.entries(this.themes).map(([id, t]) => `
            <div class="theme-option ${this.currentTheme === id ? 'active' : ''}" data-theme="${id}">
              <div class="theme-preview" style="background: ${t.bgGradient};">
                <span class="theme-emoji">${t.emoji}</span>
              </div>
              <div class="theme-name">${t.name}</div>
            </div>
          `).join('')}
        </div>
        <button class="theme-close-btn">✕ Close</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('visible'));

    // Event listeners
    overlay.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        if (typeof AudioManager !== 'undefined') AudioManager.playPop();
        this.apply(opt.dataset.theme);
      });
    });

    overlay.querySelector('.theme-close-btn').addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
      }
    });
  }
};

// Make it global so it can be called elsewhere
window.ThemeManager = ThemeManager;

// Register the theme selector as an app
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
});
