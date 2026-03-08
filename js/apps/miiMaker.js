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

// Options for Mii Generator
const SKINS = ['#ffdfc4', '#f0d0b0', '#e0c0a0', '#c09070', '#8d5524', '#c68642'];
const HAIRS = ['#111111', '#4a3000', '#7b4f2c', '#c79d46', '#e0e0e0', '#ff5555', '#44a0e5', '#88e060'];
const EYES_COLORS = ['#222222', '#3b5998', '#4b8b3b', '#6b4f2c', '#8b1c1c', '#66ccff'];
const SHIRTS = ['#ff3333', '#3366ff', '#33cc33', '#ffcc00', '#ff6600', '#9933cc', '#ffffff', '#222222'];

function initMiiMaker(container) {
  // 1. Build DOM Structure for iframe embedding
  container.innerHTML = `
    <button class="mii-close-btn" title="Close Mii Maker" style="z-index: 10000; position: absolute; top: 20px; right: 20px;">✖</button>
    <iframe src="/mii-creator/index.html" style="width: 100%; height: 100%; border: none; display: block;"></iframe>
  `;

  // Close Button
  container.querySelector('.mii-close-btn').addEventListener('click', () => {
    container.classList.add('closing');
    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 400); // Wait for CSS animation
  });
}
