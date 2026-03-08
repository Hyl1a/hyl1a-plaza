const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve the static frontend files
app.use(express.static(path.join(__dirname)));
// Serve Mii Creator app static files
app.use('/mii-creator', express.static(path.join(__dirname, 'mii-creator', 'public')));

// Fallback to index.html for SPA-like behavior if needed (Optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected!');
    db.run(`
      CREATE TABLE IF NOT EXISTS avatars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT,
        last_name TEXT,
        username TEXT,
        birthday TEXT,
        bio TEXT,
        visual_data TEXT
      )
    `);
  }
});

// API Routes
app.get('/api/avatars', (req, res) => {
  db.all('SELECT * FROM avatars', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse the JSON string of visual_data back into an object
    const avatars = rows.map(row => {
      try {
        row.visual_data = JSON.parse(row.visual_data);
      } catch (e) {
        // keep as string if not valid JSON
      }
      return row;
    });
    res.json(avatars);
  });
});

app.post('/api/avatars', (req, res) => {
  const { first_name, last_name, username, birthday, bio, visual_data } = req.body;
  const visual_data_str = JSON.stringify(visual_data || {});
  
  const sql = `INSERT INTO avatars (first_name, last_name, username, birthday, bio, visual_data) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [first_name, last_name, username, birthday, bio, visual_data_str];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'Avatar saved successfully',
      id: this.lastID
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
