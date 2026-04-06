/* ============================================
   OTB Games Hub — Main Controller v2.0
   Integrates: Shop, Trophies, Challenges,
   Progress Map, Animations, Report Card, Pet
   ============================================ */
(() => {
    let currentTab = 'home';

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
                loadHomeTab();
                applyTheme();
                checkGameAvailability();
                HubReportCard.takeSnapshot();
                checkForCelebrations();
            }, 500);
        }, 1800);

        // Tab navigation
        document.querySelectorAll('.hub-nav-tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
    }

    function switchTab(tabId) {
        currentTab = tabId;

        // Update nav
        document.querySelectorAll('.hub-nav-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabId);
        });

        // Update content
        document.querySelectorAll('.hub-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === 'tab-' + tabId);
        });

        // Load tab content
        if (tabId === 'home') loadHomeTab();
        else if (tabId === 'trophies') loadTrophies();
        else if (tabId === 'shop') loadShop();
        else if (tabId === 'journey') loadJourney();
        else if (tabId === 'pet') loadPet();
        else if (tabId === 'report') loadReport();
    }

    function loadHomeTab() {
        // Daily challenges
        const challengeEl = document.getElementById('daily-challenges');
        if (challengeEl) challengeEl.innerHTML = HubChallenges.renderChallenges();
    }

    function loadTrophies() {
        const el = document.getElementById('trophy-room');
        if (el) el.innerHTML = HubTrophies.renderTrophyRoom();
    }

    function loadShop() {
        const el = document.getElementById('coin-shop');
        if (el) {
            el.innerHTML = HubShop.renderShop();
            HubShop.bindShopEvents(el);
        }
    }

    function loadJourney() {
        const el = document.getElementById('progress-map');
        if (el) el.innerHTML = HubProgressMap.renderProgressMap();
    }

    function loadPet() {
        const el = document.getElementById('pet-area');
        if (el) {
            el.innerHTML = HubPet.renderPet();
            HubPet.bindPetEvents(el);
        }
    }

    function loadReport() {
        const el = document.getElementById('report-card-area');
        if (el) el.innerHTML = HubReportCard.renderReportCard();
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

        // Avatar
        const avatarEl = document.getElementById('player-avatar');
        if (avatarEl) avatarEl.textContent = HubShop.getAvatarEmoji();

        // Name color
        const eq = HubShop.getEquipped();
        if (eq.nameColor === 'rainbow') {
            nameEl.classList.add('rainbow');
            nameEl.style.color = '';
        } else {
            nameEl.classList.remove('rainbow');
            nameEl.style.color = eq.nameColor || 'var(--otb-coin)';
        }

        // Title
        const titleEl = document.getElementById('player-title');
        if (titleEl) titleEl.textContent = eq.title || '';

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

    function applyTheme() {
        const eq = HubShop.getEquipped();
        // Remove all theme classes
        document.body.classList.remove('theme-space', 'theme-ocean', 'theme-forest', 'theme-lava', 'theme-candy');
        if (eq.hubTheme && eq.hubTheme !== 'default') {
            document.body.classList.add('theme-' + eq.hubTheme);
        }
    }

    function checkForCelebrations() {
        const streak = OTBEcosystem.checkDailyStreak();
        if (streak.isNew && streak.streak > 1) {
            setTimeout(() => {
                HubAnimations.fireStreak(streak.streak);
                HubAnimations.showToast(`${streak.streak} day streak!`, '🔥');
            }, 800);
        }
    }

    // Global refresh functions for sub-modules to call
    window.refreshHub = function() {
        loadProfile();
        applyTheme();
    };

    window.refreshShop = function() {
        loadShop();
        loadProfile();
    };

    window.refreshPet = function() {
        loadPet();
    };

    // Re-check challenges when returning from a game (page gets focus)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadProfile();
            if (currentTab === 'home') loadHomeTab();
            HubChallenges.checkProgress();
        }
    });

    document.addEventListener('DOMContentLoaded', init);
})();
