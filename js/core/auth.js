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
            
            // Apply default theme if requested or initialize theme manager
            if (window.ThemeManager) {
               window.ThemeManager.apply('default', false);
               window.ThemeManager.init();
            }

             // Trigger UI updates in app.js if they are ready
             if (document.getElementById('top-username')) {
                document.getElementById('top-username').textContent = this.currentUsername;
                document.getElementById('auth-overlay').style.display = 'none';
 
                // Only show welcome message and play SFX once per session
                if (!sessionStorage.getItem('hylia_welcome_shown')) {
                  sessionStorage.setItem('hylia_welcome_shown', 'true');

                  // Play welcome SFX
                  if (window.AudioManager && window.AudioManager.playConnectSuccess) {
                    window.AudioManager.playConnectSuccess();
                  }
 
                  // Show welcome message
                  const welcomeMsg = document.createElement('div');
                  welcomeMsg.id = 'login-welcome-msg';
                  welcomeMsg.style.cssText = `
                    position: fixed;
                    top: 20%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(35px) saturate(180%);
                    color: white;
                    padding: 20px 40px;
                    border-radius: 40px;
                    font-size: 32px;
                    font-weight: 900;
                    z-index: 20000;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 
                                inset 0 0 20px rgba(255,255,255,0.2),
                                0 0 0 1px rgba(255,255,255,0.4);
                    pointer-events: none;
                    text-shadow: 0 5px 15px rgba(0,0,0,0.5);
                    letter-spacing: -1px;
                    text-align: center;
                    animation: welcomeCinematic 3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                  `;
                  welcomeMsg.innerHTML = `Welcome <span style="background: linear-gradient(135deg, #7ec4ff, #4a9fff, #7ec4ff); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: textShine 3s linear infinite;">${this.currentUsername}</span> ! :)`;
                  
                  // Add animation keyframes
                  if (!document.getElementById('welcome-anim-style')) {
                    const style = document.createElement('style');
                    style.id = 'welcome-anim-style';
                    style.textContent = `
                      @keyframes welcomeCinematic {
                        0% { opacity: 0; transform: translate(-50%, -10%) scale(0.7); filter: blur(15px) brightness(1.5); }
                        15% { opacity: 1; transform: translate(-50%, -20%) scale(1); filter: blur(0px) brightness(1); }
                        85% { opacity: 1; transform: translate(-50%, -20%) scale(1.02); filter: blur(0px) brightness(1); }
                        100% { opacity: 0; transform: translate(-50%, -30%) scale(1.05); filter: blur(20px) brightness(0.8); }
                      }
                      @keyframes textShine {
                        to { background-position: 200% center; }
                      }
                    `;
                    document.head.appendChild(style);
                  }
  
                  document.body.appendChild(welcomeMsg);
                  setTimeout(() => welcomeMsg.remove(), 2800);
                }

               // Re-trigger loadUserMii via document event or direct call if available
               if (window.loadUserMii) window.loadUserMii();
               if (window.checkForcedMiiCreation) window.checkForcedMiiCreation();
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
