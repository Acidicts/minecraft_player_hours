const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');

// Log player login
router.get('/on', (req, res) => {
  const playerName = req.query.player;
  
  if (!playerName) {
    return res.status(400).json({ error: 'Player name is required' });
  }
  
  // Check if player exists, if not add them
  db.get('SELECT id FROM players WHERE player_name = ?', [playerName], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    let playerId;
    
    if (!row) {
      // Add new player
      db.run('INSERT INTO players (player_name) VALUES (?)', [playerName], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Could not add player' });
        }
        playerId = this.lastID;
        createSession(playerId, res);
      });
    } else {
      playerId = row.id;
      createSession(playerId, res);
    }
  });
});


// Log off all active players
router.get('/all-off', (req, res) => {
  db.run(
    'UPDATE sessions SET logout_time = CURRENT_TIMESTAMP WHERE logout_time IS NULL',
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to log off players' });
      }
      res.json({ 
        success: true, 
        message: 'All players logged off', 
        playersLoggedOff: this.changes 
      });
    }
  );
});

// Helper function to create a session
function createSession(playerId, res) {
  db.run('INSERT INTO sessions (player_id) VALUES (?)', [playerId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Could not create session' });
    }
    res.json({ success: true, message: 'Player login recorded' });
  });
}

// Log player logout
router.get('/off', (req, res) => {
  const playerName = req.query.player;
  
  if (!playerName) {
    return res.status(400).json({ error: 'Player name is required' });
  }
  
  // Find the player
  db.get('SELECT id FROM players WHERE player_name = ?', [playerName], (err, player) => {
    if (err || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Find the player's latest active session
    db.get(
      'SELECT id FROM sessions WHERE player_id = ? AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1',
      [player.id],
      (err, session) => {
        if (err || !session) {
          return res.status(404).json({ error: 'No active session found' });
        }
        
        // Update the session with logout time
        db.run(
          'UPDATE sessions SET logout_time = CURRENT_TIMESTAMP WHERE id = ?',
          [session.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to update session' });
            }
            res.json({ success: true, message: 'Player logout recorded' });
          }
        );
      }
    );
  });
});

// Get player stats for the web interface
router.get('/stats', (req, res) => {
  db.all(`
    SELECT 
      p.player_name, 
      s.login_time, 
      s.logout_time,
      ROUND((JULIANDAY(IFNULL(s.logout_time, CURRENT_TIMESTAMP)) - JULIANDAY(s.login_time)) * 24 * 60 * 60) as seconds_played
    FROM 
      players p
    LEFT JOIN 
      sessions s ON p.id = s.player_id
    ORDER BY 
      p.player_name, 
      s.login_time DESC
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});


// ...existing code...

// Get stats for individual player
router.get('/:playerName', (req, res) => {
  const playerName = req.params.playerName;
  
  // Check if player exists
  db.get('SELECT id FROM players WHERE player_name = ?', [playerName], (err, player) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!player) {
      return res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
    }
    
    // Serve the player page
    res.sendFile(path.join(__dirname, '../public/player.html'));
  });
});

// Get API data for individual player
router.get('/api/player/:playerName', (req, res) => {
  const playerName = req.params.playerName;
  
  db.all(`
    SELECT 
      p.player_name, 
      s.login_time, 
      s.logout_time,
      ROUND((JULIANDAY(IFNULL(s.logout_time, CURRENT_TIMESTAMP)) - JULIANDAY(s.login_time)) * 24 * 60 * 60) as seconds_played
    FROM 
      players p
    LEFT JOIN 
      sessions s ON p.id = s.player_id
    WHERE
      p.player_name = ?
    ORDER BY 
      s.login_time DESC
  `, [playerName], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// ...existing code...

module.exports = router;