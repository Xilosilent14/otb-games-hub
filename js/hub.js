/* ============================================
   OTB Games Hub — Main Controller
   ============================================ */
(() => {
    function init() {
        // Set game card URLs from config
        document.querySelectorAll('[data-game]').forEach(card => {
            const gameId = card.dataset.game;
            if (typeof OTBConfig !== 'undefined') {
                card.href = OTBConfig.getGameUrl(gameId);
            }
        });

        // Splash timeout
        setTimeout(() => {
            const splash = document.getElementById('splash');
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                document.getElementById('hub').style.display = 'block';
                loadProfile();
                loadAchievements();
                checkGameAvailability();
            }, 500);
        }, 1800);
    }

    function checkGameAvailability() {
        document.querySelectorAll('[data-game]').forEach(card => {
            const url = card.href;
            if (!url || url === '#') return;
            fetch(url, { mode: 'no-cors', cache: 'no-cache' })
                .then(() => { card.classList.remove('hub-game-offline'); })
                .catch(() => {
                    card.classList.add('hub-game-offline');
                    const info = card.querySelector('.hub-game-desc');
                    if (info) info.textContent = 'Not available right now';
                });
        });
    }

    function loadProfile() {
        if (typeof OTBEcosystem === 'undefined') return;
        const profile = OTBEcosystem.getProfile();
        const level = OTBEcosystem.getLevelInfo();
        const summary = OTBEcosystem.getSummary();
        const streak = OTBEcosystem.checkDailyStreak();

        // Player info
        const nameEl = document.getElementById('player-name');
        if (profile.playerName) nameEl.textContent = profile.playerName;

        document.getElementById('player-level').textContent = `Lv. ${level.level}`;
        document.getElementById('xp-fill').style.width = (level.progress * 100) + '%';
        document.getElementById('coins-display').textContent = `🪙 ${profile.coins}`;
        document.getElementById('streak-display').textContent = `🔥 ${streak.streak} day${streak.streak !== 1 ? 's' : ''}`;

        // Progress bars
        const mathPct = Math.round(summary.mathAccuracy * 100);
        const readPct = Math.round(summary.readingAccuracy * 100);
        document.getElementById('math-progress').style.width = mathPct + '%';
        document.getElementById('math-accuracy').textContent = mathPct + '%';
        document.getElementById('reading-progress').style.width = readPct + '%';
        document.getElementById('reading-accuracy').textContent = readPct + '%';

        // Total stats
        document.getElementById('total-answers').textContent = summary.totalAnswers + ' answers';
        document.getElementById('total-playtime').textContent = Math.round(summary.totalPlayTime / 60) + ' min played';
        document.getElementById('games-played').textContent = summary.gamesPlayed + ' game' + (summary.gamesPlayed !== 1 ? 's' : '');
    }

    function loadAchievements() {
        const container = document.getElementById('achievements-list');
        const achievements = [];

        // Pull achievements from each game's localStorage
        try {
            const tfSave = localStorage.getItem('thinkfast_progress');
            if (tfSave) {
                const tf = JSON.parse(tfSave);
                if (tf.achievements) {
                    tf.achievements.forEach(a => {
                        achievements.push({ ...a, source: 'Think Fast', icon: '🏎️' });
                    });
                }
            }
        } catch (e) { /* ignore */ }

        try {
            const wmSave = localStorage.getItem('wordmine_progress');
            if (wmSave) {
                const wm = JSON.parse(wmSave);
                if (wm.achievements) {
                    wm.achievements.forEach(id => {
                        achievements.push({ id, name: id, source: 'Word Mine', icon: '⛏️' });
                    });
                }
            }
        } catch (e) { /* ignore */ }

        if (achievements.length === 0) {
            container.innerHTML = '<div class="hub-empty-state">Play some games to earn achievements!</div>';
            return;
        }

        // Show last 5 achievements
        const recent = achievements.slice(-5).reverse();
        container.innerHTML = recent.map(a => `
            <div class="hub-achievement">
                <span class="hub-achievement-icon">${a.icon || '⭐'}</span>
                <div class="hub-achievement-info">
                    <div class="hub-achievement-name">${a.name || a.id}</div>
                    <div class="hub-achievement-desc">${a.desc || ''}</div>
                </div>
                <span class="hub-achievement-source">${a.source}</span>
            </div>
        `).join('');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
