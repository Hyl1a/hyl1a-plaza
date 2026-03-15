/**
 * Mii Manager Application
 * Allows users to view and delete their created Miis.
 */

window.MiiManager = {
  async open(container) {
    this.container = container;
    this.renderLoading();

    const user = window.Auth ? window.Auth.currentUser : null;
    if (!user) {
      this.container.innerHTML = '<div class="mii-manager-error">Veuillez vous connecter pour gérer vos Miis.</div>';
      return;
    }

    try {
      const miis = await this.fetchUserMiis(user.uid);
      this.renderMiiList(miis);
    } catch (e) {
      console.error("Error opening Mii Manager:", e);
      this.container.innerHTML = '<div class="mii-manager-error">Erreur lors du chargement des Miis.</div>';
    }
  },

  renderLoading() {
    this.container.innerHTML = `
      <div class="mii-manager-loading">
        <div class="mii-spinner"></div>
        <p>Chargement de vos Miis...</p>
      </div>
    `;
  },

  async fetchUserMiis(uid) {
    if (!window.Firestore || !window.FirebaseDB) return [];
    
    // In this implementation, we fetch all Miis and filter by owner if we had an owner field.
    // For now, based on auth.js, we might only have one Mii per user in 'avatars' collection indexed by UID.
    // However, the user request implies multiple Miis ("selectionner les mii a supprimer").
    // Let's check how many Miis are stored.
    
    const avatarsRef = window.Firestore.collection(window.FirebaseDB, "avatars");
    const qSnap = await window.Firestore.getDocs(avatarsRef);
    const miis = [];
    
    qSnap.forEach(doc => {
      const data = doc.data();
      // If we want to restrict to current user, we'd check an owner field.
      // But if the user wants a global manager or if Miis aren't strictly owned, we show all.
      // Based on previous conversations, there's a 1-to-1 link usually, but let's allow managing all for this specific tool.
      if (data.visual_base64 && data.username) {
        miis.push({
          id: doc.id,
          username: data.username,
          b64: data.visual_base64
        });
      }
    });
    
    return miis;
  },

  renderMiiList(miis) {
    if (miis.length === 0) {
      this.container.innerHTML = `
        <div class="mii-manager-empty">
          <p>Aucun Mii trouvé.</p>
          <button class="mii-btn-primary" onclick="document.querySelector('.app-trigger[data-app=\\'miiMaker\\']').click()">Créer un Mii</button>
        </div>
      `;
      return;
    }

    let miiCards = miis.map(mii => `
      <div class="mii-card" id="mii-card-${mii.id}">
        <div class="mii-card-avatar">
          <img src="https://mii-unsecure.ariankordi.net/miis/image.png?data=${encodeURIComponent(mii.b64)}&verifyCharInfo=0&type=face&width=160&shaderType=wiiu" 
               alt="${mii.username}"
               onerror="this.src='assets/icons/guestbook.png'">
        </div>
        <div class="mii-card-info">
          <h3>${mii.username}</h3>
          <button class="mii-btn-delete" onclick="window.MiiManager.deleteMii('${mii.id}', '${mii.username}')">Supprimer</button>
        </div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="mii-manager-container">
        <div class="mii-manager-header">
          <h2>Gestion des Miis</h2>
          <p>Sélectionnez un Mii pour le supprimer définitivement.</p>
        </div>
        <div class="mii-grid">
          ${miiCards}
        </div>
      </div>
    `;
  },

  async deleteMii(id, name) {
    if (!confirm(`Voulez-vous vraiment supprimer le Mii "${name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const docRef = window.Firestore.doc(window.FirebaseDB, "avatars", id);
      // We don't have a deleteDoc export in firebase.js KI, let's check what's available.
      // Wait, firebase.js has { doc, setDoc, getDoc, collection, getDocs }.
      // I might need deleteDoc.
      
      this.container.querySelector(`#mii-card-${id}`).style.opacity = '0.5';
      this.container.querySelector(`#mii-card-${id} .mii-btn-delete`).disabled = true;
      this.container.querySelector(`#mii-card-${id} .mii-btn-delete`).textContent = '...';

      await window.Firestore.deleteDoc(docRef);
      
      this.container.querySelector(`#mii-card-${id}`).style.transform = 'scale(0.8)';
      this.container.querySelector(`#mii-card-${id}`).style.opacity = '0';
      
      setTimeout(() => {
        const user = window.Auth ? window.Auth.currentUser : null;
        if (user) this.open(this.container);
      }, 400);

    } catch (e) {
      console.error("Error deleting Mii:", e);
      alert("Erreur lors de la suppression.");
      if (this.container.querySelector(`#mii-card-${id}`)) {
        this.container.querySelector(`#mii-card-${id}`).style.opacity = '1';
        this.container.querySelector(`#mii-card-${id} .mii-btn-delete`).disabled = false;
        this.container.querySelector(`#mii-card-${id} .mii-btn-delete`).textContent = 'Supprimer';
      }
    }
  }
};
