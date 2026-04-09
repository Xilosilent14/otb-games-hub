/* ============================================
   OTB Games Hub — Main Controller v2.5
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

        return { start, stop, toggle, updateToggleBtn, isEnabled: () => enabled, get _ctx() { return ctx; } };
    })();

    // ========== UI SOUND EFFECTS ==========
    const HubSFX = (() => {
        let sfxEnabled = localStorage.getItem('bbg_hub_sfx') !== 'off';

        function getCtx() {
            // Reuse HubMusic's AudioContext if available, otherwise create one
            if (HubMusic._ctx) return HubMusic._ctx;
            if (!HubSFX._ctx) {
                try {
                    HubSFX._ctx = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e) { return null; }
            }
            return HubSFX._ctx;
        }

        function _tone(freq, duration, vol, type, startDelay) {
            if (!sfxEnabled) return;
            const ctx = getCtx();
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume();
            const t = ctx.currentTime + (startDelay || 0);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(vol, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + duration + 0.02);
        }

        // 1. Button / tab click - soft sine pop ~800Hz, 0.06s
        function click() {
            _tone(800, 0.06, 0.18, 'sine');
        }

        // 2. Achievement unlock - triumphant ascending 3-note chime (C5, E5, G5)
        function achievementUnlock() {
            _tone(523.25, 0.25, 0.22, 'sine', 0);      // C5
            _tone(659.25, 0.25, 0.22, 'sine', 0.12);    // E5
            _tone(783.99, 0.4,  0.25, 'sine', 0.24);    // G5 (held longer)
        }

        // 3. Coin collection - bright metallic ding ~1200Hz, short decay
        function coinCollect() {
            _tone(1200, 0.15, 0.2, 'triangle');
            _tone(2400, 0.1,  0.08, 'sine', 0.02);  // harmonic shimmer
        }

        // 4. Level up - 4-note ascending fanfare with harmony
        function levelUp() {
            _tone(523.25, 0.2, 0.2,  'sine', 0);       // C5
            _tone(659.25, 0.2, 0.2,  'sine', 0.15);     // E5
            _tone(783.99, 0.2, 0.2,  'sine', 0.30);     // G5
            _tone(1046.5, 0.5, 0.25, 'sine', 0.45);     // C6
            // Harmony layer
            _tone(392.0,  0.3, 0.1,  'triangle', 0);    // G4
            _tone(523.25, 0.3, 0.1,  'triangle', 0.15); // C5
            _tone(659.25, 0.3, 0.1,  'triangle', 0.30); // E5
            _tone(783.99, 0.4, 0.12, 'triangle', 0.45); // G5
        }

        // 5. Challenge complete - success 2-note chime
        function challengeComplete() {
            _tone(659.25, 0.2, 0.2, 'sine', 0);     // E5
            _tone(880.0,  0.35, 0.22, 'sine', 0.12); // A5
        }

        // 6. Shop purchase - cash register descending ding
        function shopPurchase() {
            _tone(1400, 0.1,  0.2,  'triangle', 0);
            _tone(1100, 0.1,  0.18, 'triangle', 0.08);
            _tone(880,  0.15, 0.15, 'triangle', 0.16);
            _tone(660,  0.25, 0.22, 'sine',     0.22);
        }

        // 7. Pet interaction - cute boop, soft sine pop ~600Hz
        function petBoop() {
            _tone(600, 0.08, 0.18, 'sine');
            _tone(900, 0.06, 0.08, 'sine', 0.04);
        }

        // 8. Daily login bonus - special celebratory fanfare (longer)
        function dailyLoginFanfare() {
            // Rising arpeggio
            _tone(392.0,  0.18, 0.18, 'sine', 0);       // G4
            _tone(523.25, 0.18, 0.18, 'sine', 0.1);     // C5
            _tone(659.25, 0.18, 0.2,  'sine', 0.2);     // E5
            _tone(783.99, 0.18, 0.2,  'sine', 0.3);     // G5
            _tone(1046.5, 0.5,  0.25, 'sine', 0.4);     // C6 held
            // Sparkle harmony
            _tone(523.25, 0.3,  0.08, 'triangle', 0.1);
            _tone(783.99, 0.3,  0.08, 'triangle', 0.3);
            _tone(1318.5, 0.4,  0.06, 'triangle', 0.5); // E6 shimmer
        }

        function toggle() {
            sfxEnabled = !sfxEnabled;
            localStorage.setItem('bbg_hub_sfx', sfxEnabled ? 'on' : 'off');
            if (sfxEnabled) click(); // Play a sample click as feedback
            return sfxEnabled;
        }

        function isEnabled() { return sfxEnabled; }

        return {
            click,
            achievementUnlock,
            coinCollect,
            challengeComplete,
            levelUp,
            shopPurchase,
            petBoop,
            dailyLoginFanfare,
            toggle,
            isEnabled
        };
    })();

    // Expose HubSFX globally so other modules can use it
    window.HubSFX = HubSFX;

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

        // Fire confetti, coin rain, and fanfare SFX
        setTimeout(() => {
            HubSFX.dailyLoginFanfare();
            HubAnimations.confetti(3000);
            HubAnimations.coinRain(coins);
        }, 300);

        // Collect button
        const collectBtn = overlay.querySelector('.login-bonus-collect');
        function dismiss() {
            HubSFX.coinCollect();
            overlay.classList.add('login-bonus-fadeout');
            setTimeout(() => overlay.remove(), 400);
            loadProfile(); // Refresh coin/xp display
            if (leveledUp) {
                setTimeout(() => {
                    HubSFX.levelUp();
                    HubAnimations.levelUp(OTBEcosystem.getLevelInfo().level);
                }, 500);
            }
        }
        collectBtn.addEventListener('click', dismiss);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });

        // Auto-dismiss after 5 seconds
        setTimeout(() => { if (overlay.parentNode) dismiss(); }, 5000);
    }

    // ========== PROFILE SELECTION ==========
    function showProfileSelect() {
        document.getElementById('hub').style.display = 'none';
        const screen = document.getElementById('profile-select');
        screen.style.display = 'flex';
        renderProfileCards();
    }

    function renderProfileCards() {
        const container = document.getElementById('profile-cards');
        const profiles = ProfileManager.getProfiles();
        container.innerHTML = '';

        profiles.forEach(p => {
            // Load this profile's data for stats
            let level = 1, streak = 0;
            try {
                const data = JSON.parse(localStorage.getItem('bbg_profile_' + p.id) || '{}');
                level = data.globalLevel || 1;
                streak = data.dailyStreak || 0;
            } catch {}

            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = `
                <span class="profile-card-avatar">${p.avatar}</span>
                <div class="profile-card-name">${p.name}</div>
                <div class="profile-card-stats">Lv. ${level} \u{2022} \u{1F525} ${streak} day${streak !== 1 ? 's' : ''}</div>
            `;
            card.addEventListener('click', () => { HubSFX.click(); selectProfile(p.id); });
            container.appendChild(card);
        });
    }

    function selectProfile(id) {
        ProfileManager.setActiveProfile(id);
        document.getElementById('profile-select').style.display = 'none';
        document.getElementById('hub').style.display = 'block';
        loadProfile();
        loadHomeTab();
        applyTheme();
        checkGameAvailability();
        HubReportCard.takeSnapshot();
        checkForCelebrations();
        setTimeout(() => checkDailyLoginBonus(), 600);
        setTimeout(() => HubTutorial.start(), 1200);
    }

    function initAddPlayerModal() {
        const addBtn = document.getElementById('add-profile-btn');
        const modal = document.getElementById('add-player-modal');
        const createBtn = document.getElementById('create-player-btn');
        const cancelBtn = document.getElementById('cancel-player-btn');
        const nameInput = document.getElementById('new-player-name');
        const picker = document.getElementById('avatar-picker');
        let selectedAvatar = '\u{1F60E}';

        addBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            nameInput.value = '';
            nameInput.focus();
        });

        picker.addEventListener('click', (e) => {
            const opt = e.target.closest('.avatar-option');
            if (!opt) return;
            picker.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
            opt.classList.add('selected');
            selectedAvatar = opt.dataset.avatar;
        });

        createBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (!name) { nameInput.focus(); return; }
            HubSFX.click();
            const result = ProfileManager.createProfile(name, selectedAvatar);
            if (!result) {
                nameInput.value = '';
                nameInput.placeholder = 'Name already taken!';
                nameInput.focus();
                return;
            }
            modal.style.display = 'none';
            renderProfileCards();
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // ========== FIRST-TIME TUTORIAL ==========
    const HubTutorial = (() => {
        const STEPS = [
            { emoji: '\u{1F3AE}', text: 'Welcome to Blake Boys Gaming! This is your game hub.', target: '#hub', position: 'center' },
            { emoji: '\u{1F3B2}', text: 'Pick a game to play! Each one helps you learn.', target: '.hub-games-grid', position: 'below' },
            { emoji: '\u2B50', text: 'Complete daily challenges to earn coins!', target: '#daily-challenges', position: 'below' },
            { emoji: '\u{1F6CD}\uFE0F', text: 'Visit the shop to customize your look!', target: '[data-tab="shop"]', position: 'below' },
            { emoji: '\u{1F431}', text: 'Take care of your pet friend!', target: '[data-tab="pet"]', position: 'below' }
        ];

        let currentStep = 0;
        let overlay, backdrop, spotlight, card, textEl, emojiEl, dotsEl, nextBtn, skipBtn;

        function shouldShow() {
            return !localStorage.getItem('bbg_hub_tutorial_done');
        }

        function start() {
            if (!shouldShow()) return;
            overlay = document.getElementById('hub-tutorial');
            backdrop = document.getElementById('tutorial-backdrop');
            spotlight = document.getElementById('tutorial-spotlight');
            card = document.getElementById('tutorial-card');
            textEl = document.getElementById('tutorial-text');
            emojiEl = document.getElementById('tutorial-emoji');
            dotsEl = document.getElementById('tutorial-dots');
            nextBtn = document.getElementById('tutorial-next');
            skipBtn = document.getElementById('tutorial-skip');

            if (!overlay) return;

            currentStep = 0;
            overlay.style.display = 'block';

            // Build dots
            dotsEl.innerHTML = STEPS.map((_, i) => `<span class="tutorial-dot" data-i="${i}"></span>`).join('');

            nextBtn.addEventListener('click', next);
            skipBtn.addEventListener('click', finish);

            showStep(0);
        }

        function showStep(idx) {
            currentStep = idx;
            const step = STEPS[idx];

            emojiEl.textContent = step.emoji;
            textEl.textContent = step.text;

            // Update dots
            dotsEl.querySelectorAll('.tutorial-dot').forEach((dot, i) => {
                dot.className = 'tutorial-dot';
                if (i < idx) dot.classList.add('done');
                if (i === idx) dot.classList.add('active');
            });

            // Update button text
            nextBtn.textContent = idx === STEPS.length - 1 ? "Let's Go!" : 'Next';

            // Position spotlight on target
            const targetEl = document.querySelector(step.target);
            if (targetEl && step.position !== 'center') {
                const rect = targetEl.getBoundingClientRect();
                const pad = 8;
                spotlight.style.display = 'block';
                spotlight.style.top = (rect.top - pad) + 'px';
                spotlight.style.left = (rect.left - pad) + 'px';
                spotlight.style.width = (rect.width + pad * 2) + 'px';
                spotlight.style.height = (rect.height + pad * 2) + 'px';
                backdrop.style.background = 'transparent';

                // Position card relative to spotlight
                const cardHeight = 220;
                if (step.position === 'below') {
                    const top = rect.bottom + 16;
                    card.style.top = Math.min(top, window.innerHeight - cardHeight - 16) + 'px';
                    card.style.bottom = 'auto';
                } else {
                    card.style.bottom = (window.innerHeight - rect.top + 16) + 'px';
                    card.style.top = 'auto';
                }
            } else {
                // Center card, no spotlight
                spotlight.style.display = 'none';
                backdrop.style.background = 'rgba(0,0,0,0.75)';
                card.style.top = '50%';
                card.style.bottom = 'auto';
                card.style.transform = 'translate(-50%, -50%)';
            }

            // Re-trigger card animation
            card.style.animation = 'none';
            card.offsetHeight;
            card.style.animation = '';
        }

        function next() {
            HubSFX.click();
            if (currentStep < STEPS.length - 1) {
                showStep(currentStep + 1);
            } else {
                finish();
            }
        }

        function finish() {
            HubSFX.click();
            localStorage.setItem('bbg_hub_tutorial_done', '1');
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.style.opacity = '';
                    overlay.style.transition = '';
                }, 300);
            }
        }

        return { start, shouldShow };
    })();

    // ========== MAIN INIT ==========
    function init() {
        // Run profile migration on first load
        ProfileManager.migrateIfNeeded();

        // Set game card URLs from config, add click SFX
        document.querySelectorAll('[data-game]').forEach(card => {
            const gameId = card.dataset.game;
            if (typeof OTBConfig !== 'undefined') {
                card.href = OTBConfig.getGameUrl(gameId);
            }
            card.addEventListener('click', () => HubSFX.click());
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
                HubSFX.click();
                HubMusic.toggle();
            });
            brand.appendChild(musicBtn);
            HubMusic.updateToggleBtn();
        }

        // Profile switch button in header
        const switchBtn = document.getElementById('switch-profile-btn');
        if (switchBtn) {
            switchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                HubSFX.click();
                showProfileSelect();
            });
        }

        // Init add player modal
        initAddPlayerModal();

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

                const profiles = ProfileManager.getProfiles();
                const activeId = ProfileManager.getActiveProfileId();

                // If only 1 profile, auto-select and go to hub
                if (profiles.length === 1) {
                    ProfileManager.setActiveProfile(profiles[0].id);
                    document.getElementById('hub').style.display = 'block';
                    loadProfile();
                    loadHomeTab();
                    applyTheme();
                    checkGameAvailability();
                    HubReportCard.takeSnapshot();
                    checkForCelebrations();
                    setTimeout(() => checkDailyLoginBonus(), 600);
                    setTimeout(() => HubTutorial.start(), 1200);
                } else if (profiles.length > 1) {
                    // If returning from a game (hash #home), skip picker and use active profile
                    const skipPicker = window.location.hash === '#home' || new URLSearchParams(window.location.search).has('skip');
                    if (skipPicker && activeId) {
                        document.getElementById('hub').style.display = 'block';
                        loadProfile();
                        loadHomeTab();
                        applyTheme();
                        checkGameAvailability();
                        HubReportCard.takeSnapshot();
                        checkForCelebrations();
                        setTimeout(() => checkDailyLoginBonus(), 600);
                    } else {
                        showProfileSelect();
                    }
                } else {
                    // No profiles at all (shouldn't happen after migration, but fallback)
                    document.getElementById('hub').style.display = 'block';
                    loadProfile();
                    loadHomeTab();
                    applyTheme();
                    checkGameAvailability();
                }
            }, 500);
        }, 1800);

        // Tab navigation
        document.querySelectorAll('.hub-nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                HubSFX.click();
                switchTab(tab.dataset.tab);
            });
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
        else if (tabId === 'progress') { loadReport(); loadTrophies(); }
        else if (tabId === 'pet') { loadPet(); }
        else if (tabId === 'shop') loadShop();
    }

    function getGreeting(name) {
        const hour = new Date().getHours();
        if (hour < 12) return `Good morning, ${name}! ☀️`;
        if (hour < 17) return `Good afternoon, ${name}! 🌤️`;
        return `Good evening, ${name}! 🌙`;
    }

    function loadHomeTab() {
        // Render daily challenges (compact pill row, no greeting banner)
        const challengeEl = document.getElementById('daily-challenges');
        if (challengeEl) {
            challengeEl.innerHTML = HubChallenges.renderChallenges();
        }

        // Add NEW badges to potion-lab and spidey-academy cards
        addNewBadges();

        // Populate progress bars and last-played from ecosystem data
        updateGameCardProgress();
    }

    function updateGameCardProgress() {
        const profile = typeof OTBEcosystem !== 'undefined' ? OTBEcosystem.getProfile() : null;
        if (!profile) return;
        const gameMap = {
            'card-thinkfast': 'think-fast',
            'card-wordmine': 'word-mine',
            'card-rhythmblast': 'rhythm-blast',
            'card-potionlab': 'potion-lab',
            'card-creaturecards': 'creature-cards',
            'card-spideyacademy': 'spidey-academy'
        };
        Object.entries(gameMap).forEach(([cardId, gameId]) => {
            const card = document.getElementById(cardId);
            if (!card) return;
            const gameData = profile.games && profile.games[gameId];
            const fill = card.querySelector('.hub-game-progress-fill');
            const lastEl = card.querySelector('.hub-game-last-played');
            if (gameData) {
                // Progress: use level or XP-based percentage (cap at 100)
                const pct = Math.min(100, Math.floor((gameData.xp || 0) / 50));
                if (fill) fill.style.width = pct + '%';
                // Last played
                if (lastEl && gameData.lastPlayed) {
                    const d = new Date(gameData.lastPlayed);
                    const now = new Date();
                    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
                    if (diff === 0) lastEl.textContent = 'Played today';
                    else if (diff === 1) lastEl.textContent = 'Played yesterday';
                    else if (diff < 7) lastEl.textContent = `Played ${diff} days ago`;
                    else lastEl.textContent = '';
                }
            }
        });
    }

    function addNewBadges() {
        const newGames = ['card-potionlab', 'card-spideyacademy'];
        newGames.forEach(cardId => {
            const card = document.getElementById(cardId);
            if (!card) return;
            const title = card.querySelector('.hub-game-title');
            if (!title) return;
            if (title.querySelector('.game-new-badge')) return;
            const badge = document.createElement('span');
            badge.className = 'game-new-badge';
            badge.textContent = 'NEW';
            title.appendChild(badge);
        });
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
            const rawHref = card.getAttribute('href');
            if (!rawHref || rawHref === '#') return;
            const url = card.href; // fully resolved
            // Same-origin games (production sub-paths) are always available
            try {
                const gameOrigin = new URL(url).origin;
                if (gameOrigin === window.location.origin) {
                    card.classList.remove('hub-game-offline');
                    return;
                }
            } catch(e) {}
            // Cross-origin: try to reach the game (local dev with separate ports)
            fetch(url, { mode: 'no-cors', cache: 'no-cache' })
                .then(r => {
                    // no-cors gives opaque response (type 'opaque', status 0) on success
                    card.classList.remove('hub-game-offline');
                })
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

        // Player info from active profile
        const nameEl = document.getElementById('player-name');
        const activeProfile = typeof ProfileManager !== 'undefined' ? ProfileManager.getActiveProfile() : null;
        if (activeProfile) {
            nameEl.textContent = activeProfile.name;
        } else if (profile.playerName) {
            nameEl.textContent = profile.playerName;
        }

        // Avatar: use profile avatar, fallback to shop avatar
        const avatarEl = document.getElementById('player-avatar');
        if (avatarEl) {
            if (activeProfile && activeProfile.avatar) {
                avatarEl.textContent = activeProfile.avatar;
            } else {
                avatarEl.textContent = HubShop.getAvatarEmoji();
            }
        }

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

        // Progress bars (only if elements exist, moved to Report tab)
        const mathPct = Math.round(summary.mathAccuracy * 100);
        const readPct = Math.round(summary.readingAccuracy * 100);
        const mathEl = document.getElementById('math-progress');
        if (mathEl) {
            mathEl.style.width = mathPct + '%';
            document.getElementById('math-accuracy').textContent = mathPct + '%';
            document.getElementById('reading-progress').style.width = readPct + '%';
            document.getElementById('reading-accuracy').textContent = readPct + '%';
        }

        // Total stats (only if elements exist)
        const totalEl = document.getElementById('total-answers');
        if (totalEl) {
            totalEl.textContent = summary.totalAnswers + ' answers';
            document.getElementById('total-playtime').textContent = Math.round(summary.totalPlayTime / 60) + ' min played';
            document.getElementById('games-played').textContent = summary.gamesPlayed + ' game' + (summary.gamesPlayed !== 1 ? 's' : '');
        }
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

// Global error handler for Hub resilience
window.onerror = function(msg, source, line, col, error) {
    console.error('Hub error:', msg, 'at', source, line + ':' + col);
    return false;
};
window.addEventListener('unhandledrejection', function(event) {
    console.error('Hub unhandled rejection:', event.reason);
});
