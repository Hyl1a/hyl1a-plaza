/**
 * WindowManager handles opening, closing, dragging, and z-indexing
 * of the Frutiger Aero floating application panels.
 */
const WindowManager = {
  windows: {},
  zIndexCounter: 100,
  
  openWindow: function(appId, title, contentRenderFn) {
    if (typeof AudioManager !== 'undefined') AudioManager.playWindowOpen();
    
    // If window already open, focus it instead of duplicating
    if (this.windows[appId]) {
      this.focusWindow(appId);
      // add a little bounce effect on the existing window to feedback the click
      this.windows[appId].classList.remove('anim-pop');
      void this.windows[appId].offsetWidth; // trigger reflow
      this.windows[appId].classList.add('anim-pop');
      return;
    }
    
    const layer = document.getElementById('window-layer');
    
    // Create element
    const win = document.createElement('div');
    win.className = 'app-window glossy-panel open anim-window-open';
    win.id = `window-${appId}`;
    
    this.zIndexCounter++;
    win.style.zIndex = this.zIndexCounter;
    
    // Visual HTML Structure
    win.innerHTML = `
      <div class="window-header bar-glint">
        <span class="window-title">${title}</span>
        <button class="window-close-btn" aria-label="Close"></button>
      </div>
      <div class="window-content" id="content-${appId}">
        <!-- App content injected here -->
      </div>
    `;
    
    layer.appendChild(win);
    this.windows[appId] = win;
    
    // Offset position for multiple windows so they don't completely overlap
    const offset = (Object.keys(this.windows).length * 20) % 100;
    // We update the translation in the transform because CSS sets it to -50% -50%
    win.style.transform = `translate(calc(-50% + ${offset}px), calc(-50% + ${offset}px)) scale(1)`;
    // Wait for insertion to set custom translations cleanly later when dragging.
    
    // Render the App Content
    const contentArea = win.querySelector(`#content-${appId}`);
    if (contentRenderFn) {
      contentRenderFn(contentArea);
    }
    
    // Event Listeners
    win.addEventListener('mousedown', () => this.focusWindow(appId));
    
    const closeBtn = win.querySelector('.window-close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeWindow(appId);
    });
    
    this.setupDraggable(win, win.querySelector('.window-header'));
    this.focusWindow(appId);
  },
  
  closeWindow: function(appId) {
    if (typeof AudioManager !== 'undefined') AudioManager.playWindowClose();
    
    const win = this.windows[appId];
    if (win) {
      win.classList.remove('anim-window-open');
      win.classList.add('anim-window-close');
      
      if (window.restoreCoverflow) window.restoreCoverflow();

      // Wait for bounce out animation
      setTimeout(() => {
        if (win.parentNode) win.parentNode.removeChild(win);
        delete this.windows[appId];
      }, 300);
    }
  },
  
  focusWindow: function(appId) {
    const win = this.windows[appId];
    if (win) {
      this.zIndexCounter++;
      win.style.zIndex = this.zIndexCounter;
      
      // Clear active state on all windows
      Object.values(this.windows).forEach(w => w.classList.remove('active'));
      win.classList.add('active');
    }
  },
  
  setupDraggable: function(winElement, handleElement) {
    let isDragging = false;
    let startX, startY, initialTranslateX, initialTranslateY;
    
    handleElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Parse current transform
      const style = window.getComputedStyle(winElement);
      const matrix = new DOMMatrixReadOnly(style.transform);
      initialTranslateX = matrix.m41;
      initialTranslateY = matrix.m42;
      
      winElement.style.transition = 'none'; // Disable transition while dragging
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault(); // keep text from selecting
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      winElement.style.transform = `translate(${initialTranslateX + dx}px, ${initialTranslateY + dy}px) scale(1)`;
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        winElement.style.transition = 'box-shadow 0.3s ease'; // Restore shadow transition
      }
    });
  }
};
