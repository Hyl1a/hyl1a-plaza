/**
 * Authentication System
 * Handles login, registration, and session management using localStorage.
 */

window.Auth = {
  API_BASE: 'http://localhost:3000',

  init() {
    const users = this.getUsers();
    // Pre-create 'hyl1a' account if it doesn't exist yet
    if (!users.find(u => u.username.toLowerCase() === 'hyl1a')) {
      users.push({ username: 'hyl1a', password: '375513' });
      this.saveUsers(users);
    }
  },

  getUsers() {
    return JSON.parse(localStorage.getItem('nostalgia_users') || '[]');
  },

  saveUsers(users) {
    localStorage.setItem('nostalgia_users', JSON.stringify(users));
  },

  getCurrentUser() {
    return localStorage.getItem('nostalgia_current_user');
  },

  setCurrentUser(username) {
    if (username) {
      localStorage.setItem('nostalgia_current_user', username);
    } else {
      localStorage.removeItem('nostalgia_current_user');
    }
  },

  async hasMii(username) {
    if (!username) return false;
    try {
      const response = await fetch(`${this.API_BASE}/api/avatars`);
      if (!response.ok) return false;
      const avatars = await response.json();
      return avatars.some(av => av.username.toLowerCase() === username.toLowerCase());
    } catch (e) {
      console.error("Error checking Mii:", e);
      return false;
    }
  },

  register(username, password) {
    if (!username || !password) return { success: false, message: 'Nom d\'utilisateur et mot de passe requis.' };
    
    const users = this.getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Ce nom d\'utilisateur existe déjà.' };
    }

    users.push({ username, password });
    this.saveUsers(users);
    
    return { success: true, message: 'Compte créé avec succès !' };
  },

  login(username, password) {
    if (!username || !password) return { success: false, message: 'Nom d\'utilisateur et mot de passe requis.' };

    const users = this.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
      this.setCurrentUser(user.username);
      return { success: true, message: 'Connexion réussie.' };
    } else {
      return { success: false, message: 'Identifiants incorrects.' };
    }
  },

  logout() {
    this.setCurrentUser(null);
    localStorage.removeItem('nostalgia_current_user'); // Explicitly remove to be safe
    window.location.reload(); 
  }
};

// Initialize immediately to seed accounts before UI attaches
window.Auth.init();
