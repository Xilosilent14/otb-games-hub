/* ============================================
   OTB Games Hub — Trophy Room / Achievement Gallery
   ============================================ */
const HubTrophies = (() => {
    // Master achievement registry across all games
    const REGISTRY = {
        // ThinkFast achievements
        'thinkfast': {
            icon: '🏎️',
            name: 'Think Fast',
            color: '#e94560',
            trophies: [
                { id: 'first-race', name: 'First Race', desc: 'Complete your first race', icon: '🏁' },
                { id: 'speed-demon', name: 'Speed Demon', desc: 'Win a race with perfect boosts', icon: '💨' },
                { id: 'math-streak-5', name: 'Math Machine', desc: 'Get 5 math answers in a row', icon: '🔢' },
                { id: 'reading-streak-5', name: 'Bookworm', desc: 'Get 5 reading answers in a row', icon: '📚' },
                { id: 'perfect-race', name: 'Perfect Race', desc: '100% accuracy in a race', icon: '⭐' },
                { id: 'win-10', name: 'Racer Pro', desc: 'Win 10 races', icon: '🏆' },
                { id: 'win-50', name: 'Racing Legend', desc: 'Win 50 races', icon: '👑' },
                { id: 'all-tracks', name: 'World Traveler', desc: 'Race on every track', icon: '🌎' },
                { id: 'boss-beat', name: 'Boss Beater', desc: 'Beat a boss race', icon: '💪' },
                { id: 'story-complete', name: 'Story Champion', desc: 'Complete story mode', icon: '🎬' },
                { id: 'streak-3', name: 'On Fire!', desc: 'Win 3 races in a row', icon: '🔥' },
                { id: 'coins-100', name: 'Coin Collector', desc: 'Earn 100 coins total', icon: '🪙' },
                { id: 'coins-500', name: 'Gold Rush', desc: 'Earn 500 coins total', icon: '💰' },
                { id: 'speed-answer', name: 'Quick Thinker', desc: 'Answer in under 2 seconds', icon: '⚡' },
                { id: 'play-30min', name: 'Dedicated Racer', desc: 'Play for 30 minutes', icon: '⏰' },
            ]
        },
        // Word Mine achievements
        'wordmine': {
            icon: '⛏️',
            name: 'Word Mine',
            color: '#4a8f3f',
            trophies: [
                { id: 'first-mine', name: 'First Block', desc: 'Mine your first block', icon: '⛏️' },
                { id: 'words-10', name: 'Word Finder', desc: 'Learn 10 sight words', icon: '📝' },
                { id: 'words-25', name: 'Word Hunter', desc: 'Learn 25 sight words', icon: '🔍' },
                { id: 'words-50', name: 'Word Master', desc: 'Learn 50 sight words', icon: '📖' },
                { id: 'words-100', name: 'Word Champion', desc: 'Learn 100 sight words', icon: '🏅' },
                { id: 'depth-10', name: 'Deep Digger', desc: 'Reach depth 10', icon: '⬇️' },
                { id: 'depth-25', name: 'Cave Explorer', desc: 'Reach depth 25', icon: '🕳️' },
                { id: 'perfect-round', name: 'Perfect Miner', desc: '100% accuracy in a round', icon: '💎' },
                { id: 'streak-10', name: 'Combo King', desc: '10 correct answers in a row', icon: '🔥' },
                { id: 'nonsense-master', name: 'Nonsense Ninja', desc: 'Master nonsense words', icon: '🥷' },
                { id: 'math-miner', name: 'Math Miner', desc: 'Answer 50 math questions', icon: '🧮' },
                { id: 'diamond-found', name: 'Diamond Find', desc: 'Find a diamond ore block', icon: '💠' },
                { id: 'play-30min', name: 'Dedicated Miner', desc: 'Play for 30 minutes', icon: '⏰' },
                { id: 'coins-100', name: 'Treasure Hunter', desc: 'Earn 100 coins', icon: '🪙' },
                { id: 'all-biomes', name: 'Biome Explorer', desc: 'Visit all biomes', icon: '🌍' },
            ]
        },
        // Rhythm Blast achievements
        'rhythmblast': {
            icon: '🎵',
            name: 'Rhythm Blast',
            color: '#a855f7',
            trophies: [
                { id: 'first-song', name: 'First Beat', desc: 'Complete your first song', icon: '🎵' },
                { id: 'perfect-song', name: 'Perfect Rhythm', desc: '100% on a song', icon: '💯' },
                { id: 'combo-20', name: 'Combo Master', desc: '20 note combo', icon: '🔥' },
                { id: 'combo-50', name: 'Combo Legend', desc: '50 note combo', icon: '💥' },
                { id: 'all-songs', name: 'Music Fan', desc: 'Play every song', icon: '🎶' },
                { id: 'songs-10', name: 'Beat Keeper', desc: 'Complete 10 songs', icon: '🥁' },
                { id: 'songs-25', name: 'Rhythm Star', desc: 'Complete 25 songs', icon: '⭐' },
                { id: 'math-notes', name: 'Math Musician', desc: 'Answer 25 math notes', icon: '🔢' },
                { id: 'reading-notes', name: 'Word DJ', desc: 'Answer 25 reading notes', icon: '📖' },
                { id: 'score-1000', name: 'High Scorer', desc: 'Score 1000 in a song', icon: '🎯' },
            ]
        },
        // Spidey Academy achievements
        'spidey-academy': {
            icon: '🕷️',
            name: 'Spidey Academy',
            color: '#e23636',
            trophies: [
                { id: 'spidey-first', name: 'First Web', desc: 'Complete your first activity', icon: '🕸️' },
                { id: 'spidey-colors', name: 'Color Expert', desc: 'Learn all 6 colors', icon: '🎨' },
                { id: 'spidey-shapes', name: 'Shape Master', desc: 'Learn all 6 shapes', icon: '🔷' },
                { id: 'spidey-stickers-10', name: 'Sticker Star', desc: 'Earn 10 stickers', icon: '⭐' },
                { id: 'spidey-champion', name: 'Spidey Champion', desc: 'Earn all 30 stickers', icon: '🏆' },
            ]
        },
        // Hub / Cross-game achievements
        'hub': {
            icon: '🎮',
            name: 'OTB Hub',
            color: '#4A90D9',
            trophies: [
                { id: 'first-game', name: 'Player One', desc: 'Play your first game', icon: '🎮' },
                { id: 'all-games', name: 'Game Explorer', desc: 'Play every game', icon: '🌟' },
                { id: 'level-5', name: 'Level 5', desc: 'Reach level 5', icon: '5️⃣' },
                { id: 'level-10', name: 'Double Digits', desc: 'Reach level 10', icon: '🔟' },
                { id: 'level-25', name: 'Quarter Century', desc: 'Reach level 25', icon: '🎖️' },
                { id: 'streak-3', name: '3 Day Streak', desc: 'Play 3 days in a row', icon: '🔥' },
                { id: 'streak-7', name: 'Week Warrior', desc: 'Play 7 days in a row', icon: '📅' },
                { id: 'streak-30', name: 'Monthly Master', desc: '30 day streak', icon: '🗓️' },
                { id: 'coins-1000', name: 'Thousand Club', desc: 'Earn 1000 total coins', icon: '💰' },
                { id: 'answers-100', name: 'Century', desc: 'Answer 100 questions', icon: '💯' },
                { id: 'answers-500', name: 'Scholar', desc: 'Answer 500 questions', icon: '🎓' },
                { id: 'answers-1000', name: 'Brain Master', desc: 'Answer 1000 questions', icon: '🧠' },
                { id: 'daily-3', name: 'Challenge Seeker', desc: 'Complete 3 daily challenges', icon: '📋' },
                { id: 'daily-10', name: 'Challenge Pro', desc: 'Complete 10 daily challenges', icon: '🏅' },
                { id: 'shop-first', name: 'First Purchase', desc: 'Buy something from the shop', icon: '🛍️' },
                { id: 'pet-happy', name: 'Best Friend', desc: 'Make your pet very happy', icon: '❤️' },
            ]
        }
    };

    function getEarnedAchievements() {
        const earned = {};

        // ThinkFast
        try {
            const tf = JSON.parse(localStorage.getItem('thinkfast_progress') || '{}');
            if (tf.achievements) {
                earned['thinkfast'] = new Set(tf.achievements.map(a => a.id || a));
            }
        } catch (e) { /* ignore */ }

        // Word Mine
        try {
            const wm = JSON.parse(localStorage.getItem('wordmine_progress') || '{}');
            if (wm.achievements) {
                earned['wordmine'] = new Set(wm.achievements.map(a => typeof a === 'string' ? a : a.id));
            }
        } catch (e) { /* ignore */ }

        // Rhythm Blast
        try {
            const rb = JSON.parse(localStorage.getItem('rhythmblast_progress') || '{}');
            if (rb.achievements) {
                earned['rhythmblast'] = new Set(rb.achievements.map(a => typeof a === 'string' ? a : a.id));
            }
        } catch (e) { /* ignore */ }

        // Spidey Academy
        try {
            const sa = JSON.parse(localStorage.getItem('spidey_academy_progress') || '{}');
            if (sa.achievements) {
                earned['spidey-academy'] = new Set(sa.achievements.map(a => typeof a === 'string' ? a : a.id));
            }
        } catch (e) { /* ignore */ }

        // Hub achievements (check conditions dynamically)
        earned['hub'] = new Set();
        const profile = OTBEcosystem.getProfile();
        const summary = OTBEcosystem.getSummary();

        if (Object.keys(profile.gamesPlayed || {}).length > 0) earned['hub'].add('first-game');
        if (Object.keys(profile.gamesPlayed || {}).length >= 3) earned['hub'].add('all-games');
        if (summary.globalLevel >= 5) earned['hub'].add('level-5');
        if (summary.globalLevel >= 10) earned['hub'].add('level-10');
        if (summary.globalLevel >= 25) earned['hub'].add('level-25');
        if ((profile.dailyStreak || 0) >= 3) earned['hub'].add('streak-3');
        if ((profile.dailyStreak || 0) >= 7) earned['hub'].add('streak-7');
        if ((profile.dailyStreak || 0) >= 30) earned['hub'].add('streak-30');
        if ((profile.totalCoinsEarned || 0) >= 1000) earned['hub'].add('coins-1000');
        if (summary.totalAnswers >= 100) earned['hub'].add('answers-100');
        if (summary.totalAnswers >= 500) earned['hub'].add('answers-500');
        if (summary.totalAnswers >= 1000) earned['hub'].add('answers-1000');
        if ((profile.purchasedItems || []).length > 0) earned['hub'].add('shop-first');
        if ((profile.pet || {}).mood >= 90) earned['hub'].add('pet-happy');

        // Check completed daily challenges count
        const dc = JSON.parse(localStorage.getItem('otb_daily_challenge_history') || '{"completed":0}');
        if (dc.completed >= 3) earned['hub'].add('daily-3');
        if (dc.completed >= 10) earned['hub'].add('daily-10');

        return earned;
    }

    function renderTrophyRoom() {
        const earned = getEarnedAchievements();
        const gameOrder = ['hub', 'thinkfast', 'wordmine', 'rhythmblast', 'spidey-academy'];

        // Calculate totals first
        let totalEarned = 0, totalAll = 0;
        for (const gameId of gameOrder) {
            const game = REGISTRY[gameId];
            if (!game) continue;
            totalAll += game.trophies.length;
            totalEarned += game.trophies.filter(t => (earned[gameId] || new Set()).has(t.id)).length;
        }

        const totalPct = totalAll > 0 ? Math.floor((totalEarned / totalAll) * 100) : 0;

        let html = `<div class="trophy-header">
            <div class="trophy-count">${totalEarned} / ${totalAll} Trophies Earned</div>
            <div class="trophy-progress">
                <div class="trophy-progress-fill" style="width:${totalPct}%"></div>
            </div>
        </div>`;

        for (const gameId of gameOrder) {
            const game = REGISTRY[gameId];
            if (!game) continue;

            const gameEarned = earned[gameId] || new Set();
            const total = game.trophies.length;
            const count = game.trophies.filter(t => gameEarned.has(t.id)).length;

            html += `<div class="trophy-game-section">
                <div class="trophy-game-title" style="background:${game.color}22;border-left:3px solid ${game.color};">
                    <span>${game.icon}</span>
                    <span>${game.name}</span>
                    <span style="margin-left:auto;font-size:0.8rem;color:var(--otb-coin);">${count}/${total}</span>
                </div>
                <div class="trophy-grid">`;

            for (const trophy of game.trophies) {
                const isEarned = gameEarned.has(trophy.id);
                html += `<div class="trophy-item ${isEarned ? 'earned' : 'locked'}" title="${trophy.desc}">
                    <div class="trophy-icon">${isEarned ? trophy.icon : '🔒'}</div>
                    <div class="trophy-name">${isEarned ? trophy.name : '???'}</div>
                    <div class="trophy-desc">${trophy.desc}</div>
                </div>`;
            }

            html += `</div></div>`;
        }

        return html;
    }

    return {
        REGISTRY,
        getEarnedAchievements,
        renderTrophyRoom
    };
})();
