/**
 * Authentication System
 * Handles login, registration, and session management using Firebase Auth & Firestore.
 */

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

window.Auth = {
  currentUser: null,
  currentUsername: null,

  init() {
    // Listen to Firebase Auth state changes
    onAuthStateChanged(window.FirebaseAuth, async (user) => {
      if (user) {
        this.currentUser = user;
        // Fetch username from Firestore profile
        try {
          const docRef = doc(window.FirebaseDB, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            this.currentUsername = docSnap.data().username;
            localStorage.setItem('nostalgia_current_user', this.currentUsername);
            
            // Trigger UI updates in app.js if they are ready
            if (document.getElementById('top-username')) {
               document.getElementById('top-username').textContent = this.currentUsername;
               document.getElementById('auth-overlay').style.display = 'none';
               // Re-trigger loadUserMii via document event or direct call if available
               if (window.loadUserMii) window.loadUserMii();
            }
          }
        } catch(e) { console.error("Error fetching user profile:", e); }
      } else {
        this.currentUser = null;
        this.currentUsername = null;
        localStorage.removeItem('nostalgia_current_user');
      }
    });
  },

  getCurrentUser() {
    return this.currentUsername || localStorage.getItem('nostalgia_current_user');
  },

  // Note: hasMii will scan Firestore instead of local API
  async hasMii(username) {
    if (!username) return false;
    try {
      const avatarsRef = collection(window.FirebaseDB, "avatars");
      const qSnap = await getDocs(avatarsRef);
      // Client side filtering since we don't have complex queries setup yet
      let found = false;
      qSnap.forEach((doc) => {
        if (doc.data().username.toLowerCase() === username.toLowerCase()) {
          found = true;
        }
      });
      return found;
    } catch (e) {
      console.error("Error checking Mii:", e);
      return false;
    }
  },

  async register(username, password) {
    if (!username || !password) return { success: false, message: 'Nom d\'utilisateur et mot de passe requis.' };
    // Firebase Auth requires email format, so we fake one using the username
    const fakeEmail = `${username.toLowerCase()}@hyliaplaza.local`;
    
    try {
      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(window.FirebaseAuth, fakeEmail, password);
      const user = userCredential.user;
      
      // 2. Create User Profile Document in Firestore
      await setDoc(doc(window.FirebaseDB, "users", user.uid), {
        username: username,
        createdAt: new Date().toISOString()
      });

      return { success: true, message: 'Compte Firebase créé avec succès !' };
    } catch (e) {
      console.error(e);
      let errorMsg = 'Erreur lors de la création.';
      if (e.code === 'auth/email-already-in-use') errorMsg = 'Ce nom d\'utilisateur existe déjà.';
      if (e.code === 'auth/weak-password') errorMsg = 'Le mot de passe doit faire au moins 6 caractères.';
      return { success: false, message: errorMsg };
    }
  },

  async login(username, password) {
    if (!username || !password) return { success: false, message: 'Nom d\'utilisateur et mot de passe requis.' };
    const fakeEmail = `${username.toLowerCase()}@hyliaplaza.local`;

    try {
      await signInWithEmailAndPassword(window.FirebaseAuth, fakeEmail, password);
      return { success: true, message: 'Connexion réussie.' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Identifiants incorrects.' };
    }
  },

  async logout() {
    try {
      await signOut(window.FirebaseAuth);
      localStorage.removeItem('nostalgia_current_user');
      window.location.reload(); 
    } catch(e) {
      console.error("Logout Error:", e);
    }
  }
};

// Initialize listener
window.Auth.init();
