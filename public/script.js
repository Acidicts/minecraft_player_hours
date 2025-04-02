document.addEventListener('DOMContentLoaded', function() {
    fetchPlayerStats();
    
    // Refresh data every minute
    setInterval(fetchPlayerStats, 60000);
  });
  
  function fetchPlayerStats() {
    fetch('/stats')
      .then(response => response.json())
      .then(data => {
        displayPlayerStats(data);
      })
      .catch(error => {
        console.error('Error fetching player stats:', error);
        document.getElementById('playerStats').innerHTML = '<p>Error loading data</p>';
      });
  }
  
  function displayPlayerStats(data) {
    const container = document.getElementById('playerStats');
    
    if (data.length === 0) {
      container.innerHTML = '<p>No player data available yet</p>';
      return;
    }
    
    // Group by player
    const players = {};
    
    data.forEach(row => {
      if (!players[row.player_name]) {
        players[row.player_name] = {
          sessions: [],
          totalTime: 0
        };
      }
      
      const session = {
        login: new Date(row.login_time),
        logout: row.logout_time ? new Date(row.logout_time) : null,
        duration: row.seconds_played
      };
      
      players[row.player_name].sessions.push(session);
      players[row.player_name].totalTime += row.seconds_played;
    });
    
    // Build HTML
    let html = '';
    
    Object.keys(players).sort().forEach(playerName => {
      const player = players[playerName];
      
      html += `
        <div class="player-card">
          <div class="player-name">${playerName}</div>
          <div class="sessions">
      `;
      
      // Sort sessions by login time (newest first)
      player.sessions.sort((a, b) => b.login - a.login);
      
      player.sessions.forEach(session => {
        const isActive = !session.logout;
        const loginTime = formatDate(session.login);
        const logoutTime = session.logout ? formatDate(session.logout) : 'Still online';
        const duration = formatDuration(session.duration);
        
        html += `
          <div class="session ${isActive ? 'active' : ''}">
            <div>Login: ${loginTime}</div>
            <div>Logout: ${logoutTime}</div>
            <div>Duration: ${duration}</div>
          </div>
        `;
      });
      
      const totalHours = Math.floor(player.totalTime / 3600);
      const totalMinutes = Math.floor((player.totalTime % 3600) / 60);
      
      html += `
          </div>
          <div class="total-time">
            Total time: ${totalHours} hours, ${totalMinutes} minutes
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  }
  
  function formatDate(date) {
    return date.toLocaleString();
  }
  
  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours}h ${minutes}m ${secs}s`;
  }
  function displayPlayerStats(data) {
    const container = document.getElementById('playerStats');
    
    if (data.length === 0) {
      container.innerHTML = '<p>No player data available yet</p>';
      return;
    }
    
    // Group by player
    const players = {};
    
    data.forEach(row => {
      if (!players[row.player_name]) {
        players[row.player_name] = {
          sessions: [],
          totalTime: 0
        };
      }
      
      const session = {
        login: new Date(row.login_time),
        logout: row.logout_time ? new Date(row.logout_time) : null,
        duration: row.seconds_played
      };
      
      players[row.player_name].sessions.push(session);
      players[row.player_name].totalTime += row.seconds_played;
    });
    
    // Build HTML
    let html = '';
    
    Object.keys(players).sort().forEach(playerName => {
      const player = players[playerName];
      const isOnline = player.sessions.some(session => !session.logout);
      
      html += `
        <div class="player-card">
          <div class="player-name">
            <a href="/${encodeURIComponent(playerName)}" class="player-link">
              ${playerName} ${isOnline ? '🟢' : '⚫'}
            </a>
          </div>
          <div class="sessions">
      `;
      
      // Sort sessions by login time (newest first)
      player.sessions.sort((a, b) => b.login - a.login);
      
      // Only show the most recent 3 sessions
      const recentSessions = player.sessions.slice(0, 3);
      
      recentSessions.forEach(session => {
        const isActive = !session.logout;
        const loginTime = formatDate(session.login);
        const logoutTime = session.logout ? formatDate(session.logout) : 'Still online';
        const duration = formatDuration(session.duration);
        
        html += `
          <div class="session ${isActive ? 'active' : ''}">
            <div>Login: ${loginTime}</div>
            <div>Logout: ${logoutTime}</div>
            <div>Duration: ${duration}</div>
          </div>
        `;
      });
      
      if (player.sessions.length > 3) {
        html += `<div class="more-sessions"><a href="/${encodeURIComponent(playerName)}">View all ${player.sessions.length} sessions</a></div>`;
      }
      
      const totalHours = Math.floor(player.totalTime / 3600);
      const totalMinutes = Math.floor((player.totalTime % 3600) / 60);
      
      html += `
          </div>
          <div class="total-time">
            Total time: ${totalHours} hours, ${totalMinutes} minutes
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  }