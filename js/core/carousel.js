/**
 * Arch Carousel Manager
 * Handles the positioning and rotation of icons in a bell-shaped arc.
 */

const CarouselManager = {
  lastNavTime: 0,
  navCooldown: 300, 
  
  // Arc Configuration
  arcWidth: 1000,
  arcHeight: 220, // Lowered arch base for better "bridge" feel
  baseY: 250,
  
  init: function() {
    this.tiles = Array.from(document.querySelectorAll('.grid-tile:not(.gif-tile)'));
    if (this.tiles.length === 0) return;
    
    this.setupInputs();
    this.update();
    
    // Initial active state for the first tile
    this.setActive(0, true);
  },
  
  setupInputs: function() {
    document.addEventListener('keydown', (e) => {
      if (document.getElementById('auth-overlay').style.display !== 'none') return;
      if (document.body.classList.contains('app-open-active')) return;
      if (document.querySelector('.mii-fullscreen-container')) return;

      if (e.key === 'ArrowRight') {
        this.next();
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      } else if (e.key === 'Enter' || e.key === ' ') {
        this.tiles[this.currentIndex].click();
      }
    });

    // Mouse wheel support
    window.addEventListener('wheel', (e) => {
      if (document.body.classList.contains('app-open-active')) return;
      if (Math.abs(e.deltaY) < 10) return;
      
      if (e.deltaY > 0) this.next();
      else this.prev();
    }, { passive: true });
    
    // On-screen Arrow Buttons
    const btnPrev = document.getElementById('carousel-nav-prev');
    const btnNext = document.getElementById('carousel-nav-next');
    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prev();
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.next();
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      });
    }

    // Mouse click/hover transfers focus
    this.tiles.forEach((tile, i) => {
      tile.addEventListener('click', (e) => {
        if (this.currentIndex !== i) {
          // If not centered, click to center it
          e.preventDefault();
          this.setActive(i);
          if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        } else {
          // If already centered, trigger launch logic in app.js
          if (window.handleAppLaunch) {
            window.handleAppLaunch(tile);
          }
        }
      });
      
      tile.addEventListener('mouseenter', () => {
        // Just play subtle click/hover sound, don't move the carousel
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      });
    });
  },
  
  next: function() {
    this.setActive((this.currentIndex + 1) % this.tiles.length);
  },
  
  prev: function() {
    this.setActive((this.currentIndex - 1 + this.tiles.length) % this.tiles.length);
  },
  
  setActive: function(index, force = false) {
    if (this.currentIndex === index && !force) return;
    
    this.currentIndex = index;
    this.lastNavTime = Date.now();
    this.update();
    
    // Update Title Pill
    const tile = this.tiles[index];
    const title = tile.getAttribute('data-title');
    const dynamicTitle = document.getElementById('dynamic-title-pill');
    if (dynamicTitle && title) {
      dynamicTitle.textContent = title;
    }

    // Update Global Accent Color
    if (window.setGlobalHueFromIndex) {
      window.setGlobalHueFromIndex(index);
    }
  },
  
  update: function() {
    const total = this.tiles.length;
    
    this.tiles.forEach((tile, i) => {
      // Calculate circular relative position (-total/2 to total/2)
      let offset = i - this.currentIndex;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
      
      // Control horizontal spread
      const x = offset * 220;
      
      // Parabolic Y: steeper curve
      const k = 3.5; 
      const yNorm = 1 - Math.pow(offset / k, 2);
      const y = -yNorm * this.arcHeight;
      
      // Rotation: tilt icons to follow the arc
      const rotation = offset * 12;
      
      // Depth / Z-index (strict priority for center)
      const absOffset = Math.abs(offset);
      const zIndex = 110 - Math.round(absOffset * 10);
      const scale = i === this.currentIndex ? 1.0 : Math.max(0.4, 1 - absOffset * 0.2);
      
      // Fade out icons that are too far (but keep bridge visible)
      const opacityFactor = i === this.currentIndex ? 1 : 0.75; 
      const opacity = Math.max(0.2, opacityFactor - absOffset * 0.15);
      
      tile.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotation}deg)`;
      tile.style.zIndex = zIndex;
      tile.style.opacity = opacity;
      tile.style.pointerEvents = opacity < 0.2 ? 'none' : 'auto';
      
      if (i === this.currentIndex) {
        tile.classList.add('active-carousel-tile');
      } else {
        tile.classList.remove('active-carousel-tile');
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
    CarouselManager.init();
});
