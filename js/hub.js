/* ============================================
   OTB Games Hub — Main Controller v2.1
   Integrates: Shop, Trophies, Challenges,
   Progress Map, Animations, Report Card, Pet,
   Daily Login Bonus, Background Music
   ============================================ */
(() => {
    let currentTab = 'home';

    // ========== BACKGROUND MUSIC SYSTEM ==========
    const HubMusic = (() => {
        let ctx = null;
        let masterGain = null;
        let bassGain = null;
        let isPlaying = false;
        let melodyInterval = null;
        let bassInterval = null;
        let enabled = localStorage.getItem('bbg_hub_music') !== 'off';

        // C major pentatonic: C4, D4, E4, G4, A4, C5
        const MELODY_NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        const BASS_NOTES = [130.81, 146.83, 164.81]; // C3, D3, E3
        const TEMPO_MS = Math.round(60000 / 70); // 70 BPM

        function initAudio() {
            if (ctx) return;
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = ctx.createGain();
                masterGain.gain.value = 0.15;
                masterGain.connect(ctx.destination);
                bassGain = ctx.createGain();
                bassGain.gain.value = 0.08;
                bassGain.connect(ctx.destination);
            } catch (e) {
                console.warn('[Hub Music] Web Audio not available:', e);
            }
        }

        function playNote(freq, gainNode, duration) {
            if (!ctx || !gainNode) return;
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            noteGain.gain.setValueAtTime(0, ctx.currentTime);
            noteGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.08);
            noteGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
            osc.connect(noteGain);
            noteGain.connect(gainNode);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration + 0.05);
        }

        function startMelody() {
            if (melodyInterval) return;
            let noteIndex = 0;
            // Play a note every beat with gentle wandering
            function tick() {
                // Pick a random pentatonic note, biased toward stepwise motion
                const step = Math.random() < 0.6 ? 1 : Math.floor(Math.random() * 3);
                noteIndex = (noteIndex + step) % MELODY_NOTES.length;
                playNote(MELODY_NOTES[noteIndex], masterGain, TEMPO_MS / 1000 * 1.8);

                // Schedule next note with slight swing
                const swing = TEMPO_MS + (Math.random() - 0.5) * 200;
                melodyInterval = setTimeout(tick, swing);
            }
            tick();
        }

        function startBass() {
            if (bassInterval) return;
            let bassIndex = 0;
            function tick() {
                playNote(BASS_NOTES[bassIndex], bassGain, TEMPO_MS / 1000 * 3.5);
                bassIndex = (bassIndex + 1) % BASS_NOTES.length;
                bassInterval = setTimeout(tick, TEMPO_MS * 4);
            }
            tick();
        }

        function start() {
            if (isPlaying || !enabled) return;
            initAudio();
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume();
            isPlaying = true;
            startMelody();
            startBass();
        }

        function stop() {
            isPlaying = false;
            if (melodyInterval) { clearTimeout(melodyInterval); melodyInterval = null; }
            if (bassInterval) { clearTimeout(bassInterval); bassInterval = null; }
        }

        function toggle() {
            enabled = !enabled;
            localStorage.setItem('bbg_hub_music', enabled ? 'on' : 'off');
            if (enabled) { start(); } else { stop(); }
            updateToggleBtn();
            return enabled;
        }

        function updateToggleBtn() {
            const btn = document.getElementById('music-toggle');
            if (btn) btn.textContent = enabled ? '\u{1F3B5}' : '\u{1F507}';
        }

        return { start, stop, toggle, updateToggleBtn, isEnabled: () => enabled };
    })();

    // ========== DAILY LOGIN BONUS ==========
    function checkDailyLoginBonus() {
        if (typeof OTBEcosystem === 'undefined') return;
        const profile = OTBEcosystem.getProfile();
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = localStorage.getItem('bbg_last_login_bonus');

        if (lastLogin === today) return; // Already claimed today

        localStorage.setItem('bbg_last_login_bonus', today);

        // Calculate reward based on streak
        const streak = profile.dailyStreak || 1;
        let coins, xp, message, emoji;

        if (streak >= 7) {
            coins = 20; xp = 50; message = 'Week Warrior!'; emoji = '\u{1F3C6}';
        } else if (streak >= 5) {
            coins = 15; xp = 30; message = 'On fire!'; emoji = '\u{1F525}';
        } else if (streak >= 3) {
            coins = 10; xp = 20; message = 'Great streak!'; emoji = '\u2B50';
        } else {
            coins = 5; xp = 10; message = 'Welcome back!'; emoji = '\u{1F44B}';
        }

        OTBEcosystem.addCoins(coins, 'daily-login');
        const xpResult = OTBEcosystem.addXP(xp, 'daily-login');

        showLoginBonus(coins, xp, message, emoji, streak, xpResult.leveledUp);
    }

    function showLoginBonus(coins, xp, message, emoji, streak, leveledUp) {
        // Build modal dynamically
        const overlay = document.createElement('div');
        overlay.className = 'login-bonus-overlay';
        overlay.innerHTML = `
            <div class="login-bonus-card">
                <div class="login-bonus-emoji">${emoji}</div>
                <div class="login-bonus-message">${message}</div>
                <div class="login-bonus-streak">${streak} day streak</div>
                <div class="login-bonus-rewards">
                    <div class="login-bonus-reward">
                        <span class="login-bonus-reward-icon">\u{1FA99}</span>
                        <span class="login-bonus-reward-amount">+${coins}</span>
                        <span class="login-bonus-reward-label">Coins</span>
                    </div>
                    <div class="login-bonus-reward">
                        <span class="login-bonus-reward-icon">\u2728</span>
                        <span class="login-bonus-reward-amount">+${xp}</span>
                        <span class="login-bonus-reward-label">XP</span>
                    </div>
                </div>
                <button class="login-bonus-collect otb-btn otb-btn-primary">Collect!</button>
            </div>`;
        document.body.appendChild(overlay);

        // Fire confetti and coin rain
        setTimeout(() => {
            HubAnimations.confetti(3000);
            HubAnimations.coinRain(coins);
        }, 300);

        // Collect button
        const collectBtn = overlay.querySelector('.login-bonus-collect');
        function dismiss() {
            overlay.classList.add('login-bonus-fadeout');
            setTimeout(() => overlay.remove(), 400);
            loadProfile(); // Refresh coin/xp display
            if (leveledUp) {
                setTimeout(() => HubAnimations.levelUp(OTBEcosystem.getLevelInfo().level), 500);
            }
        }
        collectBtn.addEventListener('click', dismiss);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });

        // Auto-dismiss after 5 seconds
        setTimeout(() => { if (overlay.parentNode) dismiss(); }, 5000);
    }

    // ========== MAIN INIT ==========
    function init() {
        // Set game card URLs from config
        document.querySelectorAll('[data-game]').forEach(card => {
            const gameId = card.dataset.game;
            if (typeof OTBConfig !== 'undefined') {
                card.href = OTBConfig.getGameUrl(gameId);
            }
        });

        // Inject music toggle button into header
        const brand = document.querySelector('.hub-brand');
        if (brand) {
            const musicBtn = document.createElement('button');
            musicBtn.id = 'music-toggle';
            musicBtn.className = 'hub-music-toggle';
            musicBtn.title = 'Toggle music';
            musicBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                HubMusic.toggle();
            });
            brand.appendChild(musicBtn);
            HubMusic.updateToggleBtn();
        }

        // Start music on first user interaction
        const startMusicOnce = () => {
            HubMusic.start();
            document.removeEventListener('click', startMusicOnce);
            document.removeEventListener('touchstart', startMusicOnce);
        };
        document.addEventListener('click', startMusicOnce);
        document.addEventListener('touchstart', startMusicOnce);

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
                // Daily login bonus after everything loads
                setTimeout(() => checkDailyLoginBonus(), 600);
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
