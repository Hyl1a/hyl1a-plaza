/**
 * Circular Audio Visualizer
 * Reacts to AudioManager analyzer data using HTML5 Canvas.
 */

const CircularVisualizer = {
  canvas: null,
  ctx: null,
  container: null,
  animationId: null,
  bars: 140, // More bars for larger circle
  
  // Design config
  centerRadius: 95,
  maxBarHeight: 80,
  glowStrength: 20,
  
  init: function() {
    this.container = document.getElementById('circular-visualizer-container');
    this.canvas = document.getElementById('visualizer-canvas');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.setupControls();
    this.startLoop();
  },
  
  resize: function() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  },
  
  setupControls: function() {
    const playBtn = document.getElementById('vis-play');
    const nextBtn = document.getElementById('vis-next');
    const prevBtn = document.getElementById('vis-prev');
    const trackTitle = document.getElementById('vis-track-title');

    if (!playBtn || typeof AudioManager === 'undefined') return;

    window.updateVisualizerDisplay = () => {
      const centerEl = document.querySelector('.visualizer-center');
      if (AudioManager.isPlayingMusic && AudioManager.playlist[AudioManager.currentTrackIndex]) {
        const newTitle = AudioManager.playlist[AudioManager.currentTrackIndex].name;
        
        // Trigger animation only if title changed or play was pressed
        if (trackTitle.textContent !== newTitle || trackTitle.style.opacity === "0") {
             trackTitle.textContent = newTitle;
             
             // Remove class, force reflow, re-add class to trigger animation perfectly
             trackTitle.classList.remove('track-animate-in');
             void trackTitle.offsetWidth; 
             trackTitle.classList.add('track-animate-in');
        }

        playBtn.textContent = '⏸';
        if (centerEl) centerEl.classList.add('playing');
        
        // Update album art if we have it, else use default icon
        const albumArt = document.querySelector('.visualizer-center img');
        if (albumArt && AudioManager.playlist[AudioManager.currentTrackIndex].cover) {
           albumArt.src = AudioManager.playlist[AudioManager.currentTrackIndex].cover;
        } else if (albumArt) {
           albumArt.src = 'assets/icons/music.png'; // Fallback
        }
      } else {
        trackTitle.textContent = 'Aucune musique';
        trackTitle.classList.remove('track-animate-in');
        playBtn.textContent = '▶';
        if (centerEl) centerEl.classList.remove('playing');
      }
    };

    playBtn.addEventListener('click', () => {
      if (AudioManager.isPlayingMusic) {
        AudioManager.pauseMusic();
      } else {
        AudioManager.playNextMusic();
      }
      window.updateVisualizerDisplay();
    });

    nextBtn.addEventListener('click', () => {
      AudioManager.playNextMusic();
      window.updateVisualizerDisplay();
    });

    prevBtn.addEventListener('click', () => {
      if (AudioManager.currentTrackIndex <= 0) {
        AudioManager.currentTrackIndex = AudioManager.playlist.length - 1;
      } else {
        AudioManager.currentTrackIndex -= 2;
      }
      AudioManager.playNextMusic();
      window.updateVisualizerDisplay();
    });

    window.updateVisualizerDisplay();
  },
  
  startLoop: function() {
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      this.render();
    };
    draw();
  },
  
  render: function() {
    if (!this.ctx || typeof AudioManager === 'undefined' || !AudioManager.analyser) return;
    
    const bufferLength = AudioManager.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    AudioManager.analyser.getByteFrequencyData(dataArray);
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    this.ctx.clearRect(0, 0, width, height);
    
    // Calculate bass energy for pulse effect
    let bassSum = 0;
    for (let i = 0; i < 5; i++) bassSum += dataArray[i];
    const bassLevel = bassSum / 5 / 255; // 0 to 1
    
    const centerEl = document.querySelector('.visualizer-center');
    if (centerEl) {
      const pulseScale = 1 + (bassLevel * 0.15); // Max 15% growth
      centerEl.style.transform = `scale(${pulseScale})`;
    }
    
    // Draw visualizer bars
    const radius = this.centerRadius + (bassLevel * 5);
    
    for (let i = 0; i < this.bars; i++) {
      const angle = (i / this.bars) * Math.PI * 2;
      
      // Symmetrical Mapping: Map the first 60% of frequencies (most active) 
      // around the circle by mirroring them.
      const halfBars = this.bars / 2;
      const relativeIdx = i < halfBars ? i : (this.bars - i);
      const dataIdx = Math.floor((relativeIdx / halfBars) * (bufferLength * 0.6));
      
      const value = dataArray[dataIdx];
      const barHeight = (value / 255) * this.maxBarHeight;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight + 5);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight + 5);
      
      // Dynamic color (Purple -> Blue -> Cyan -> Pink)
      const hue = (angle * 180 / Math.PI + (Date.now() / 50)) % 360;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
      
      // Neon glow
      this.ctx.shadowBlur = this.glowStrength;
      this.ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.5)`;
      
      this.ctx.stroke();
    }

    // Progress bar update
    this.updateProgress();
  },

  updateProgress: function() {
    const circle = document.querySelector('.progress-ring__circle');
    if (!circle || typeof AudioManager === 'undefined' || !AudioManager.currentMusicAudio) return;
    
    const audio = AudioManager.currentMusicAudio;
    const percent = (audio.currentTime / audio.duration) * 100 || 0;
    
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  CircularVisualizer.init();
});
