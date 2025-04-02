const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create/connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'minecraft_players.db'));

// Initialize database tables
db.serialize(() => {
  // Table for players
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT UNIQUE,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Table for player sessions
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    FOREIGN KEY (player_id) REFERENCES players(id)
  )`);
});

module.exports = db;