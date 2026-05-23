/* ============================================
   OTB Games Hub — Virtual Pet / Mascot
   Growth stages, tricks, mood hearts, accessories
   ============================================ */
const HubPet = (() => {
    // Legacy raw key kept for one-time migration via OTBEcosystem.getScopedItem.
    // Active reads/writes go through the profile-scoped key so Oliver's pet
    // and Asher's pet are separate creatures.
    const PET_KEY = 'otb_pet_state';

    const MOODS = [
        { min: 0,  name: 'sad',       emoji: '😢', label: 'Sad',        bg: '#e74c3c' },
        { min: 20, name: 'tired',     emoji: '😴', label: 'Sleepy',     bg: '#95a5a6' },
        { min: 40, name: 'okay',      emoji: '😐', label: 'Okay',       bg: '#f39c12' },
        { min: 60, name: 'happy',     emoji: '😊', label: 'Happy',      bg: '#2ecc71' },
        { min: 80, name: 'excited',   emoji: '😄', label: 'Excited',    bg: '#27ae60' },
        { min: 95, name: 'ecstatic',  emoji: '🤩', label: 'Ecstatic!',  bg: '#ffd700' },
    ];

    const PET_BODIES = ['🐱', '🐶', '🐰', '🐼', '🦊', '🐸', '🐧', '🦉'];

    const GROWTH_STAGES = [
        { min: 0,  name: 'Baby',  label: 'Just hatched!', size: '2.5rem' },
        { min: 10, name: 'Kid',   label: 'Growing up!',   size: '3rem' },
        { min: 30, name: 'Teen',  label: 'Getting strong!', size: '3.5rem' },
        { min: 60, name: 'Adult', label: 'Fully grown!',  size: '4rem' },
    ];

    const TRICKS = ['pet-trick-spin', 'pet-trick-bounce', 'pet-trick-wiggle', 'pet-trick-dance'];

    const THOUGHTS = {
        sad: [
            "I miss you... come play!",
            "It's been a while...",
            "I'm lonely without you!"
        ],
        tired: [
            "Play a game to wake me up!",
            "*yawn* Let's do something...",
            "I need some brain food!"
        ],
        okay: [
            "Let's play a game!",
            "I could use some fun!",
            "Ready when you are!"
        ],
        happy: [
            "Yay, you're here!",
            "Let's learn something cool!",
            "I love game time!"
        ],
        excited: [
            "You're doing amazing!",
            "I'm so proud of you!",
            "We make a great team!"
        ],
        ecstatic: [
            "YOU'RE THE BEST EVER!",
            "UNSTOPPABLE!!!",
            "I'm SO happy right now!"
        ]
    };

    function _getState() {
        let pet = (typeof OTBEcosystem !== 'undefined' && OTBEcosystem.getScopedItem)
            ? OTBEcosystem.getScopedItem('pet_state', null, PET_KEY)
            : null;
        if (!pet) {
            pet = {
                body: PET_BODIES[0],
                name: 'Buddy',
                mood: 50,
                lastFed: null,
                lastPlayed: null,
                totalFed: 0,
                totalPlayed: 0,
                hatched: Date.now(),
                equippedAccessory: null
            };
            _saveState(pet);
        }
        // Forward-compat migrations
        if (typeof pet.totalPlayed !== 'number') pet.totalPlayed = 0;
        if (!pet.equippedAccessory) pet.equippedAccessory = null;
        if (typeof pet.hatched !== 'number') pet.hatched = Date.now();
        return pet;
    }

    function _saveState(pet) {
        if (typeof OTBEcosystem !== 'undefined' && OTBEcosystem.setScopedItem) {
            OTBEcosystem.setScopedItem('pet_state', pet);
        } else {
            try { localStorage.setItem(PET_KEY, JSON.stringify(pet)); } catch (_) {}
        }
    }

    function getGrowthStage(pet) {
        const total = (pet.totalFed || 0) + (pet.totalPlayed || 0);
        let stage = GROWTH_STAGES[0];
        for (const s of GROWTH_STAGES) {
            if (total >= s.min) stage = s;
        }
        return stage;
    }

    function getMood(moodValue) {
        let result = MOODS[0];
        for (const m of MOODS) {
            if (moodValue >= m.min) result = m;
        }
        return result;
    }

    // Mood decays over time, increases with play
    function updateMood() {
        const pet = _getState();
        const now = Date.now();
        const profile = OTBEcosystem.getProfile();

        // Decay: lose 1 mood per hour of not playing (max 15 points per check)
        if (pet.lastPlayed) {
            const hoursSince = (now - pet.lastPlayed) / (1000 * 60 * 60);
            if (hoursSince > 1) {
                pet.mood = Math.max(0, pet.mood - Math.min(Math.floor(hoursSince), 15));
            }
        }

        // Boost from recent activity
        const lastPlay = profile.lastPlayDate;
        const today = new Date().toISOString().slice(0, 10);
        if (lastPlay === today) {
            pet.mood = Math.min(100, pet.mood + 5);
            pet.lastPlayed = now;
        }

        // Streak bonus
        if ((profile.dailyStreak || 0) >= 3) {
            pet.mood = Math.min(100, pet.mood + 2);
        }

        _saveState(pet);
        return pet;
    }

    function feedPet() {
        const pet = _getState();

        // Costs 5 coins to feed
        const result = OTBEcosystem.spendCoins(5);
        if (!result.success) return { success: false, reason: 'Need 5 coins to feed!' };

        pet.mood = Math.min(100, pet.mood + 15);
        pet.lastFed = Date.now();
        pet.totalFed = (pet.totalFed || 0) + 1;

        // Variable reward: 12% chance of a "surprise gift" — pet returns a
        // small bonus of coins after a meal. Reinforces the feeding loop.
        let coinGift = 0;
        if (Math.random() < 0.12) {
            coinGift = 3 + Math.floor(Math.random() * 4); // 3-6 coins back
            OTBEcosystem.addCoins(coinGift, 'pet-gift');
        }

        _saveState(pet);

        try {
            if (window.BBGAnalytics) window.BBGAnalytics.event('pet_feed', { mood: pet.mood, coinGift });
        } catch (_) {}

        return {
            success: true,
            newMood: pet.mood,
            trick: TRICKS[Math.floor(Math.random() * TRICKS.length)],
            coinGift
        };
    }

    function playWithPet() {
        const pet = _getState();
        pet.mood = Math.min(100, pet.mood + 8);
        pet.lastPlayed = Date.now();
        pet.totalPlayed = (pet.totalPlayed || 0) + 1;
        _saveState(pet);
        return pet.mood;
    }

    function setPetBody(body) {
        const pet = _getState();
        pet.body = body;
        _saveState(pet);
    }

    function setPetName(name) {
        const pet = _getState();
        pet.name = name.slice(0, 12);
        _saveState(pet);
    }

    function equipAccessory(accId) {
        const pet = _getState();
        pet.equippedAccessory = accId;
        _saveState(pet);
    }

    function getEquippedAccessory() {
        const pet = _getState();
        return pet.equippedAccessory;
    }

    function getThought(mood) {
        const moodInfo = getMood(mood);
        const thoughts = THOUGHTS[moodInfo.name] || THOUGHTS.okay;
        return thoughts[Math.floor(Math.random() * thoughts.length)];
    }

    function _moodHearts(moodPct) {
        const filled = Math.round(moodPct / 20); // 0-5 hearts
        let html = '';
        for (let i = 0; i < 5; i++) {
            if (i < filled) html += '<span class="pet-heart-filled">&#10084;&#65039;</span>';
            else html += '<span class="pet-heart-empty">&#9825;</span>';
        }
        return html;
    }

    function renderPet() {
        const pet = updateMood();
        const moodInfo = getMood(pet.mood);
        const thought = getThought(pet.mood);
        const profile = OTBEcosystem.getProfile();
        const coins = profile.coins || 0;
        const stage = getGrowthStage(pet);

        // Accessory display
        let accessoryEmoji = '';
        if (pet.equippedAccessory) {
            const accItem = (typeof HubShop !== 'undefined' ? HubShop.CATALOG : []).find(i => i.id === pet.equippedAccessory);
            if (accItem) accessoryEmoji = accItem.emoji;
        }

        // Animation class based on mood
        let animClass = 'pet-idle';
        if (pet.mood >= 80) animClass = 'pet-bounce';
        else if (pet.mood >= 60) animClass = 'pet-sway';
        else if (pet.mood < 30) animClass = 'pet-droop';

        let html = `<div class="pet-container">
            <div class="pet-thought-bubble">
                <span class="pet-thought">${thought}</span>
            </div>

            <div class="pet-character ${animClass}" id="pet-character">
                <div class="pet-body" style="font-size:${stage.size}">${pet.body}${accessoryEmoji ? `<span class="pet-accessory">${accessoryEmoji}</span>` : ''}</div>
                <div class="pet-face">${moodInfo.emoji}</div>
            </div>

            <div class="pet-info">
                <div class="pet-name">${pet.name}</div>
                <div class="pet-stage">${stage.name} - ${stage.label}</div>
                <div class="pet-mood-hearts">${_moodHearts(pet.mood)}</div>
            </div>

            <div class="pet-actions" role="group" aria-label="Pet actions">
                <button class="pet-btn pet-btn-feed" aria-label="Feed your pet (costs 5 coins)" ${coins < 5 ? 'disabled title="Need 5 coins"' : ''}>
                    \u{1F34E} Feed (\u{1FA99}5)
                </button>
                <button class="pet-btn pet-btn-play" aria-label="Play with your pet">
                    \u{1F3BE} Play
                </button>
                <button class="pet-btn pet-btn-customize" aria-label="Customize your pet" aria-expanded="false" aria-controls="pet-customize-panel">
                    ✏️ Customize
                </button>
            </div>

            <div class="pet-customize-panel" id="pet-customize-panel" style="display:none" aria-label="Pet customization">
                <div class="pet-body-picker" role="radiogroup" aria-label="Choose pet body">
                    ${PET_BODIES.map(b => `<button class="pet-body-option ${b === pet.body ? 'selected' : ''}" data-body="${b}" role="radio" aria-checked="${b === pet.body ? 'true' : 'false'}" aria-label="Pet body ${b}">${b}</button>`).join('')}
                </div>
                <div class="pet-name-edit">
                    <input class="pet-name-input" type="text" value="${pet.name}" maxlength="12" placeholder="Pet name" aria-label="Pet name">
                    <button class="pet-name-save otb-btn otb-btn-small otb-btn-primary" aria-label="Save pet name">Save</button>
                </div>
            </div>
        </div>`;

        return html;
    }

    function _doTrick(container, trickClass) {
        const charEl = container.querySelector('#pet-character');
        if (!charEl) return;
        charEl.classList.remove(...TRICKS);
        // Force reflow
        void charEl.offsetWidth;
        charEl.classList.add(trickClass);
        setTimeout(() => charEl.classList.remove(trickClass), 1000);
    }

    function bindPetEvents(container) {
        const feedBtn = container.querySelector('.pet-btn-feed');
        const playBtn = container.querySelector('.pet-btn-play');
        const customizeBtn = container.querySelector('.pet-btn-customize');
        const panel = container.querySelector('.pet-customize-panel');

        if (feedBtn) {
            feedBtn.addEventListener('click', () => {
                const result = feedPet();
                if (result.success) {
                    if (typeof HubSFX !== 'undefined') HubSFX.petBoop();
                    HubAnimations.showToast('Yum! Your pet feels better!', '\u{1F34E}');
                    // Do a random trick
                    if (result.trick) _doTrick(container, result.trick);
                    // Surprise coin gift feedback (variable reward)
                    if (result.coinGift && result.coinGift > 0) {
                        setTimeout(() => {
                            HubAnimations.showToast(`Your pet brought you ${result.coinGift} coins!`, '\u{1FA99}');
                            HubAnimations.coinRain(result.coinGift);
                            if (typeof HubSFX !== 'undefined') HubSFX.coinCollect();
                        }, 600);
                    }
                    setTimeout(() => {
                        if (typeof refreshPet === 'function') refreshPet();
                        if (typeof refreshHub === 'function') refreshHub();
                    }, 1000);
                } else {
                    HubAnimations.showToast(result.reason, '\u{1F63F}');
                }
            });
        }

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (typeof HubSFX !== 'undefined') HubSFX.petBoop();
                playWithPet();
                HubAnimations.showToast('Your pet had fun!', '🎾');
                HubAnimations.confetti(1500);
                if (typeof refreshPet === 'function') refreshPet();
            });
        }

        if (customizeBtn && panel) {
            customizeBtn.addEventListener('click', () => {
                if (typeof HubSFX !== 'undefined') HubSFX.click();
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            });
        }

        container.querySelectorAll('.pet-body-option').forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof HubSFX !== 'undefined') HubSFX.click();
                setPetBody(btn.dataset.body);
                if (typeof refreshPet === 'function') refreshPet();
            });
        });

        const nameInput = container.querySelector('.pet-name-input');
        const nameSave = container.querySelector('.pet-name-save');
        if (nameInput && nameSave) {
            nameSave.addEventListener('click', () => {
                const name = nameInput.value.trim();
                if (name) {
                    if (typeof HubSFX !== 'undefined') HubSFX.click();
                    setPetName(name);
                    HubAnimations.showToast(`Renamed to ${name}!`, '✏️');
                    if (typeof refreshPet === 'function') refreshPet();
                }
            });
        }
    }

    return {
        renderPet,
        bindPetEvents,
        updateMood,
        feedPet,
        playWithPet,
        getMood,
        getGrowthStage,
        equipAccessory,
        getEquippedAccessory,
        PET_BODIES
    };
})();
