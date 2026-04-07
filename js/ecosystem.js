/**
 * BBG Profile Manager — Multi-player profile switching
 * Manages multiple player profiles (Oliver, Asher, etc.) with separate
 * localStorage keys for each player's ecosystem data.
 */
const ProfileManager = (() => {
    const PROFILES_KEY = 'bbg_profiles';
    const ACTIVE_KEY = 'bbg_active_profile';

    function getProfiles() {
        try {
            return JSON.parse(localStorage.getItem(PROFILES_KEY)) || [];
        } catch { return []; }
    }

    function saveProfiles(profiles) {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    function getActiveProfileId() {
        return localStorage.getItem(ACTIVE_KEY) || null;
    }

    function setActiveProfile(id) {
        localStorage.setItem(ACTIVE_KEY, id);
    }

    function createProfile(name, avatar) {
        const profiles = getProfiles();
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (profiles.find(p => p.id === id)) return null; // already exists
        const profile = { id, name, avatar: avatar || '\u{1F60E}', createdAt: Date.now() };
        profiles.push(profile);
        saveProfiles(profiles);
        // Initialize empty profile data
        localStorage.setItem('bbg_profile_' + id, JSON.stringify({
            version: 1, playerName: name, globalXP: 0, globalLevel: 1,
            coins: 0, totalCoinsEarned: 0, mathMastery: {}, readingMastery: {},
            dailyStreak: 0, lastPlayDate: null, totalPlayTime: 0,
            gamesPlayed: {}, globalAchievements: [],
            createdAt: Date.now(), updatedAt: Date.now()
        }));
        return profile;
    }

    function getProfileKey() {
        const id = getActiveProfileId();
        return id ? 'bbg_profile_' + id : 'bbg_shared_profile';
    }

    function getActiveProfile() {
        const id = getActiveProfileId();
        if (!id) return null;
        return getProfiles().find(p => p.id === id) || null;
    }

    // Migration: if no profiles exist but old data does, create Oliver + Asher
    function migrateIfNeeded() {
        const profiles = getProfiles();
        if (profiles.length > 0) return;

        const oldData = localStorage.getItem('bbg_shared_profile') || localStorage.getItem('otb_shared_profile');
        if (oldData) {
            // Create Oliver from existing data
            const oliver = { id: 'oliver', name: 'Oliver', avatar: '\u{1F60E}', createdAt: Date.now() };
            const asher = { id: 'asher', name: 'Asher', avatar: '\u{1F9B8}', createdAt: Date.now() };
            saveProfiles([oliver, asher]);
            localStorage.setItem('bbg_profile_oliver', oldData);
            // Initialize Asher with empty data
            localStorage.setItem('bbg_profile_asher', JSON.stringify({
                version: 1, playerName: 'Asher', globalXP: 0, globalLevel: 1,
                coins: 0, totalCoinsEarned: 0, mathMastery: {}, readingMastery: {},
                dailyStreak: 0, lastPlayDate: null, totalPlayTime: 0,
                gamesPlayed: {}, globalAchievements: [],
                createdAt: Date.now(), updatedAt: Date.now()
            }));
            setActiveProfile('oliver');
        } else {
            // No old data, create both fresh
            const oliver = { id: 'oliver', name: 'Oliver', avatar: '\u{1F60E}', createdAt: Date.now() };
            const asher = { id: 'asher', name: 'Asher', avatar: '\u{1F9B8}', createdAt: Date.now() };
            saveProfiles([oliver, asher]);
            _initEmptyProfile('oliver', 'Oliver');
            _initEmptyProfile('asher', 'Asher');
        }
    }

    function _initEmptyProfile(id, name) {
        localStorage.setItem('bbg_profile_' + id, JSON.stringify({
            version: 1, playerName: name, globalXP: 0, globalLevel: 1,
            coins: 0, totalCoinsEarned: 0, mathMastery: {}, readingMastery: {},
            dailyStreak: 0, lastPlayDate: null, totalPlayTime: 0,
            gamesPlayed: {}, globalAchievements: [],
            createdAt: Date.now(), updatedAt: Date.now()
        }));
    }

    return { getProfiles, getActiveProfileId, setActiveProfile, createProfile, getProfileKey, getActiveProfile, migrateIfNeeded };
})();

/**
 * BBG Ecosystem — Shared cross-game profile and mastery tracking
 * (Blake Boys Gaming)
 *
 * Each game stores its own save data separately. This library manages
 * a shared profile (bbg_shared_profile) that aggregates data across games,
 * enabling cross-game mastery, unified XP, daily streaks, and coins.
 *
 * Usage: Include this script before your game's main.js, then call
 * OTBEcosystem methods alongside your game-specific progress tracking.
 */
const OTBEcosystem = (() => {
    const VERSION = 1;

    // XP curve: each level requires more XP
    const XP_PER_LEVEL = 100;
    const XP_GROWTH = 1.15;

    function _getDefault() {
        return {
            version: VERSION,
            playerName: '',
            globalXP: 0,
            globalLevel: 1,
            coins: 0,
            totalCoinsEarned: 0,
            mathMastery: {},
            readingMastery: {},
            dailyStreak: 0,
            lastPlayDate: null,
            totalPlayTime: 0,
            gamesPlayed: {},
            globalAchievements: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    function _load() {
        // Migration: copy old OTB profile to new BBG key
        if (!localStorage.getItem('bbg_shared_profile') && localStorage.getItem('otb_shared_profile')) {
            localStorage.setItem('bbg_shared_profile', localStorage.getItem('otb_shared_profile'));
        }
        try {
            const key = typeof ProfileManager !== 'undefined' ? ProfileManager.getProfileKey() : 'bbg_shared_profile';
            const raw = localStorage.getItem(key);
            if (!raw) return _getDefault();
            const data = JSON.parse(raw);
            // Merge with defaults for forward compat
            return Object.assign(_getDefault(), data);
        } catch (e) {
            console.warn('[BBG Ecosystem] Failed to load profile, using defaults:', e);
            return _getDefault();
        }
    }

    function _save(profile) {
        try {
            profile.updatedAt = Date.now();
            const key = typeof ProfileManager !== 'undefined' ? ProfileManager.getProfileKey() : 'bbg_shared_profile';
            localStorage.setItem(key, JSON.stringify(profile));
        } catch (e) {
            console.warn('[BBG Ecosystem] Failed to save profile:', e);
        }
    }

    function _xpForLevel(level) {
        return Math.floor(XP_PER_LEVEL * Math.pow(XP_GROWTH, level - 1));
    }

    function _recalcLevel(profile) {
        let xpRemaining = profile.globalXP;
        let level = 1;
        while (xpRemaining >= _xpForLevel(level)) {
            xpRemaining -= _xpForLevel(level);
            level++;
        }
        profile.globalLevel = level;
        return profile;
    }

    function _todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    return {
        /** Get the full shared profile */
        getProfile() {
            return _load();
        },

        /** Set the player name */
        setPlayerName(name) {
            const p = _load();
            p.playerName = name;
            _save(p);
        },

        /**
         * Record an answer from any game.
         * @param {string} topic - e.g. 'addition', 'sight-words'
         * @param {string} domain - 'math' or 'reading'
         * @param {boolean} correct
         * @param {number} level - difficulty level (0-7)
         * @param {string} source - game ID e.g. 'corvette-racer', 'word-mine'
         */
        recordAnswer(topic, domain, correct, level, source) {
            const p = _load();
            const mastery = domain === 'math' ? p.mathMastery : p.readingMastery;
            if (!mastery[topic]) {
                mastery[topic] = { correct: 0, total: 0, level: 0, lastSeen: null };
            }
            mastery[topic].total++;
            if (correct) mastery[topic].correct++;
            mastery[topic].level = Math.max(mastery[topic].level, level);
            mastery[topic].lastSeen = Date.now();

            // Track which games are played
            if (!p.gamesPlayed[source]) p.gamesPlayed[source] = 0;
            p.gamesPlayed[source]++;

            _save(p);
        },

        /**
         * Add XP from any game. Returns { newXP, newLevel, leveledUp }
         */
        addXP(amount, source) {
            const p = _load();
            const oldLevel = p.globalLevel;
            p.globalXP += amount;
            _recalcLevel(p);
            _save(p);
            return {
                newXP: p.globalXP,
                newLevel: p.globalLevel,
                leveledUp: p.globalLevel > oldLevel
            };
        },

        /**
         * Add coins from any game. Returns new total.
         */
        addCoins(amount, source) {
            const p = _load();
            p.coins += amount;
            p.totalCoinsEarned += amount;
            _save(p);
            return p.coins;
        },

        /**
         * Spend coins. Returns { success, remaining }
         */
        spendCoins(amount) {
            const p = _load();
            if (p.coins < amount) return { success: false, remaining: p.coins };
            p.coins -= amount;
            _save(p);
            return { success: true, remaining: p.coins };
        },

        /**
         * Get mastery data for a specific topic.
         * Returns { correct, total, accuracy, level } or null
         */
        getTopicMastery(topic, domain) {
            const p = _load();
            const mastery = domain === 'math' ? p.mathMastery : p.readingMastery;
            const m = mastery[topic];
            if (!m) return null;
            return {
                correct: m.correct,
                total: m.total,
                accuracy: m.total > 0 ? m.correct / m.total : 0,
                level: m.level,
                lastSeen: m.lastSeen
            };
        },

        /**
         * Get recommended starting level for a topic based on cross-game mastery.
         * Returns 0-7
         */
        getRecommendedLevel(topic, domain) {
            const m = this.getTopicMastery(topic, domain);
            if (!m || m.total < 5) return 0;
            if (m.accuracy >= 0.9) return Math.min(m.level + 1, 7);
            if (m.accuracy >= 0.7) return m.level;
            return Math.max(m.level - 1, 0);
        },

        /**
         * Check and update daily streak. Returns { streak, isNew }
         */
        checkDailyStreak() {
            const p = _load();
            const today = _todayStr();

            if (p.lastPlayDate === today) {
                return { streak: p.dailyStreak, isNew: false };
            }

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);

            if (p.lastPlayDate === yesterdayStr) {
                p.dailyStreak++;
            } else {
                p.dailyStreak = 1;
            }

            p.lastPlayDate = today;
            _save(p);
            return { streak: p.dailyStreak, isNew: true };
        },

        /**
         * Add play time (in seconds) from a session.
         */
        addPlayTime(seconds) {
            const p = _load();
            p.totalPlayTime += seconds;
            _save(p);
        },

        /**
         * Get global level info. Returns { level, xp, xpForNext, progress }
         */
        getLevelInfo() {
            const p = _load();
            let xpRemaining = p.globalXP;
            let level = 1;
            while (xpRemaining >= _xpForLevel(level)) {
                xpRemaining -= _xpForLevel(level);
                level++;
            }
            const xpNeeded = _xpForLevel(level);
            return {
                level: level,
                xp: p.globalXP,
                xpInLevel: xpRemaining,
                xpForNext: xpNeeded,
                progress: xpRemaining / xpNeeded
            };
        },

        /**
         * Export profile as JSON string (for backup)
         */
        exportProfile() {
            return JSON.stringify(_load(), null, 2);
        },

        /**
         * Import profile from JSON string
         */
        importProfile(jsonStr) {
            try {
                const data = JSON.parse(jsonStr);
                if (data.version) {
                    _save(Object.assign(_getDefault(), data));
                    return true;
                }
                return false;
            } catch (e) {
                console.warn('[OTB Ecosystem] Import failed:', e);
                return false;
            }
        },

        /**
         * Get summary stats for parent dashboard
         */
        getSummary() {
            const p = _load();
            const mathTopics = Object.keys(p.mathMastery).length;
            const readingTopics = Object.keys(p.readingMastery).length;
            let mathTotal = 0, mathCorrect = 0;
            let readingTotal = 0, readingCorrect = 0;

            for (const t of Object.values(p.mathMastery)) {
                mathTotal += t.total;
                mathCorrect += t.correct;
            }
            for (const t of Object.values(p.readingMastery)) {
                readingTotal += t.total;
                readingCorrect += t.correct;
            }

            return {
                globalLevel: p.globalLevel,
                globalXP: p.globalXP,
                coins: p.coins,
                dailyStreak: p.dailyStreak,
                totalPlayTime: p.totalPlayTime,
                mathAccuracy: mathTotal > 0 ? mathCorrect / mathTotal : 0,
                readingAccuracy: readingTotal > 0 ? readingCorrect / readingTotal : 0,
                mathTopics,
                readingTopics,
                gamesPlayed: Object.keys(p.gamesPlayed).length,
                totalAnswers: mathTotal + readingTotal
            };
        }
    };
})();
