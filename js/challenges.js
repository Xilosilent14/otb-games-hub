/* ============================================
   OTB Games Hub — Daily Challenges System
   ============================================ */
const HubChallenges = (() => {
    const CHALLENGE_POOL = [
        // Play-based
        { id: 'play-any', text: 'Play any game', icon: '🎮', reward: 15, check: (s) => Object.values(s.gamesPlayed || {}).reduce((a,b) => a+b, 0) > (s._prevGamesPlayed || 0) },
        { id: 'play-thinkfast', text: 'Play Think Fast', icon: '🏎️', reward: 15, check: (s) => (s.gamesPlayed?.['corvette-racer'] || 0) > (s._prevTF || 0) },
        { id: 'play-wordmine', text: 'Play Word Mine', icon: '⛏️', reward: 15, check: (s) => (s.gamesPlayed?.['word-mine'] || 0) > (s._prevWM || 0) },
        { id: 'play-rhythm', text: 'Play Rhythm Blast', icon: '🎵', reward: 15, check: (s) => (s.gamesPlayed?.['rhythm-blast'] || 0) > (s._prevRB || 0) },
        { id: 'play-two', text: 'Play 2 different games', icon: '🎲', reward: 25, check: (s) => {
            const played = s.gamesPlayed || {};
            let count = 0;
            if ((played['corvette-racer'] || 0) > (s._prevTF || 0)) count++;
            if ((played['word-mine'] || 0) > (s._prevWM || 0)) count++;
            if ((played['rhythm-blast'] || 0) > (s._prevRB || 0)) count++;
            return count >= 2;
        }},

        // Answer-based
        { id: 'answer-5', text: 'Answer 5 questions', icon: '❓', reward: 10, check: (s) => s.totalAnswers >= (s._prevAnswers || 0) + 5 },
        { id: 'answer-10', text: 'Answer 10 questions', icon: '🔟', reward: 20, check: (s) => s.totalAnswers >= (s._prevAnswers || 0) + 10 },
        { id: 'answer-20', text: 'Answer 20 questions', icon: '💪', reward: 30, check: (s) => s.totalAnswers >= (s._prevAnswers || 0) + 20 },

        // Math-specific
        { id: 'math-5', text: 'Answer 5 math questions', icon: '🔢', reward: 15, check: (s) => {
            const math = s.mathMastery || {};
            const total = Object.values(math).reduce((a,t) => a + t.total, 0);
            return total >= (s._prevMathTotal || 0) + 5;
        }},

        // Reading-specific
        { id: 'reading-5', text: 'Answer 5 reading questions', icon: '📖', reward: 15, check: (s) => {
            const reading = s.readingMastery || {};
            const total = Object.values(reading).reduce((a,t) => a + t.total, 0);
            return total >= (s._prevReadTotal || 0) + 5;
        }},

        // XP/Level
        { id: 'earn-xp-50', text: 'Earn 50 XP', icon: '✨', reward: 15, check: (s) => s.globalXP >= (s._prevXP || 0) + 50 },
        { id: 'earn-xp-100', text: 'Earn 100 XP', icon: '🌟', reward: 25, check: (s) => s.globalXP >= (s._prevXP || 0) + 100 },

        // Time-based
        { id: 'play-5min', text: 'Play for 5 minutes', icon: '⏰', reward: 10, check: (s) => s.totalPlayTime >= (s._prevPlayTime || 0) + 300 },
        { id: 'play-15min', text: 'Play for 15 minutes', icon: '⏰', reward: 25, check: (s) => s.totalPlayTime >= (s._prevPlayTime || 0) + 900 },
    ];

    const STORAGE_KEY = 'otb_daily_challenges';
    const HISTORY_KEY = 'otb_daily_challenge_history';

    function _todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    function _seededRandom(seed) {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function getDailyChallenges() {
        const today = _todayStr();
        let stored;
        try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { stored = null; }

        if (stored && stored.date === today) return stored;

        // Generate 3 new challenges for today using date as seed
        const dateNum = parseInt(today.replace(/-/g, ''));
        const pool = [...CHALLENGE_POOL];
        const selected = [];

        for (let i = 0; i < 3 && pool.length > 0; i++) {
            const idx = Math.floor(_seededRandom(dateNum + i * 777) * pool.length);
            selected.push({ ...pool[idx], completed: false });
            pool.splice(idx, 1);
        }

        // Snapshot current stats for comparison
        const profile = OTBEcosystem.getProfile();
        const summary = OTBEcosystem.getSummary();
        const snapshot = {
            _prevGamesPlayed: Object.values(profile.gamesPlayed || {}).reduce((a,b) => a+b, 0),
            _prevTF: (profile.gamesPlayed || {})['corvette-racer'] || 0,
            _prevWM: (profile.gamesPlayed || {})['word-mine'] || 0,
            _prevRB: (profile.gamesPlayed || {})['rhythm-blast'] || 0,
            _prevAnswers: summary.totalAnswers,
            _prevMathTotal: Object.values(profile.mathMastery || {}).reduce((a,t) => a + t.total, 0),
            _prevReadTotal: Object.values(profile.readingMastery || {}).reduce((a,t) => a + t.total, 0),
            _prevXP: profile.globalXP,
            _prevPlayTime: profile.totalPlayTime
        };

        const data = { date: today, challenges: selected, snapshot };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
    }

    function checkProgress() {
        const data = getDailyChallenges();
        if (!data) return [];

        const profile = OTBEcosystem.getProfile();
        const summary = OTBEcosystem.getSummary();

        // Merge current profile with snapshot for checking
        const checkState = {
            ...profile,
            ...summary,
            ...data.snapshot
        };

        let changed = false;
        for (const challenge of data.challenges) {
            if (challenge.completed) continue;
            const poolItem = CHALLENGE_POOL.find(c => c.id === challenge.id);
            if (poolItem && poolItem.check(checkState)) {
                challenge.completed = true;
                changed = true;
                // Award coins
                OTBEcosystem.addCoins(challenge.reward, 'daily-challenge');
                // Update history
                _addToHistory();
            }
        }

        if (changed) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }

        return data.challenges;
    }

    function _addToHistory() {
        let hist;
        try { hist = JSON.parse(localStorage.getItem(HISTORY_KEY)); } catch (e) { hist = null; }
        if (!hist) hist = { completed: 0, lastDate: null };
        hist.completed++;
        hist.lastDate = _todayStr();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    }

    function renderChallenges() {
        const challenges = checkProgress();
        const allDone = challenges.every(c => c.completed);

        let html = `<div class="challenges-header">
            <h3 class="challenges-title">Daily Challenges</h3>
            ${allDone ? '<span class="challenges-complete">All Done! 🎉</span>' : ''}
        </div>
        <div class="challenges-list">`;

        for (const c of challenges) {
            html += `<div class="challenge-item ${c.completed ? 'completed' : ''}">
                <span class="challenge-check">${c.completed ? '✅' : '⬜'}</span>
                <span class="challenge-icon">${c.icon}</span>
                <span class="challenge-text">${c.text}</span>
                <span class="challenge-reward">🪙 ${c.reward}</span>
            </div>`;
        }

        html += `</div>`;
        return html;
    }

    return {
        getDailyChallenges,
        checkProgress,
        renderChallenges
    };
})();
