/* ============================================
   OTB Games Hub — Progress Map (Journey Path)
   ============================================ */
const HubProgressMap = (() => {
    // Milestones along the journey
    const MILESTONES = [
        { id: 'start', name: 'Begin!', icon: '🚀', desc: 'Start your learning journey', xpNeeded: 0 },
        { id: 'first-steps', name: 'First Steps', icon: '👣', desc: 'Answer 10 questions', totalAnswers: 10 },
        { id: 'getting-smart', name: 'Getting Smart', icon: '💡', desc: 'Reach Level 3', level: 3 },
        { id: 'explorer', name: 'Explorer', icon: '🗺️', desc: 'Play 2 different games', games: 2 },
        { id: 'number-cruncher', name: 'Number Cruncher', icon: '🔢', desc: 'Answer 25 math questions', mathAnswers: 25 },
        { id: 'word-reader', name: 'Word Reader', icon: '📖', desc: 'Answer 25 reading questions', readAnswers: 25 },
        { id: 'dedicated', name: 'Dedicated', icon: '⏰', desc: 'Play for 30 minutes total', playTime: 1800 },
        { id: 'rising-star', name: 'Rising Star', icon: '⭐', desc: 'Reach Level 5', level: 5 },
        { id: 'streak-keeper', name: 'Streak Keeper', icon: '🔥', desc: '3 day play streak', streak: 3 },
        { id: 'centurion', name: 'Centurion', icon: '💯', desc: 'Answer 100 questions', totalAnswers: 100 },
        { id: 'shopkeeper', name: 'Shopkeeper', icon: '🛍️', desc: 'Buy something from the shop', shopPurchase: true },
        { id: 'math-whiz', name: 'Math Whiz', icon: '🧮', desc: '80% math accuracy (50+ answers)', mathAccuracy: 0.8 },
        { id: 'bookworm', name: 'Bookworm', icon: '📚', desc: '80% reading accuracy (50+ answers)', readAccuracy: 0.8 },
        { id: 'power-player', name: 'Power Player', icon: '🎮', desc: 'Reach Level 10', level: 10 },
        { id: 'game-master', name: 'Game Master', icon: '👑', desc: 'Play all 3 games', games: 3 },
        { id: 'week-warrior', name: 'Week Warrior', icon: '📅', desc: '7 day play streak', streak: 7 },
        { id: 'five-hundred', name: '500 Club', icon: '🏆', desc: 'Answer 500 questions', totalAnswers: 500 },
        { id: 'scholar', name: 'Scholar', icon: '🎓', desc: 'Reach Level 15', level: 15 },
        { id: 'brain-master', name: 'Brain Master', icon: '🧠', desc: 'Answer 1000 questions', totalAnswers: 1000 },
        { id: 'legend', name: 'Legend', icon: '🌟', desc: 'Reach Level 25', level: 25 },
    ];

    function checkMilestone(m, profile, summary) {
        if (m.xpNeeded !== undefined && m.xpNeeded === 0) return true; // Start is always reached
        if (m.totalAnswers && summary.totalAnswers >= m.totalAnswers) return true;
        if (m.level && summary.globalLevel >= m.level) return true;
        if (m.games && Object.keys(profile.gamesPlayed || {}).length >= m.games) return true;
        if (m.mathAnswers) {
            const total = Object.values(profile.mathMastery || {}).reduce((a,t) => a + t.total, 0);
            if (total >= m.mathAnswers) return true;
        }
        if (m.readAnswers) {
            const total = Object.values(profile.readingMastery || {}).reduce((a,t) => a + t.total, 0);
            if (total >= m.readAnswers) return true;
        }
        if (m.playTime && profile.totalPlayTime >= m.playTime) return true;
        if (m.streak && (profile.dailyStreak || 0) >= m.streak) return true;
        if (m.shopPurchase && (profile.purchasedItems || []).length > 0) return true;
        if (m.mathAccuracy) {
            const total = Object.values(profile.mathMastery || {}).reduce((a,t) => a + t.total, 0);
            if (total >= 50 && summary.mathAccuracy >= m.mathAccuracy) return true;
        }
        if (m.readAccuracy) {
            const total = Object.values(profile.readingMastery || {}).reduce((a,t) => a + t.total, 0);
            if (total >= 50 && summary.readingAccuracy >= m.readAccuracy) return true;
        }
        return false;
    }

    function renderProgressMap() {
        const profile = OTBEcosystem.getProfile();
        const summary = OTBEcosystem.getSummary();

        let reachedCount = 0;
        const total = MILESTONES.length;

        let html = `<div class="pmap-container">`;

        MILESTONES.forEach((m, i) => {
            const reached = checkMilestone(m, profile, summary);
            if (reached) reachedCount++;
            const isNext = !reached && (i === 0 || checkMilestone(MILESTONES[i-1], profile, summary));

            html += `<div class="pmap-node ${reached ? 'reached' : ''} ${isNext ? 'next' : ''}">
                <div class="pmap-connector ${reached ? 'reached' : ''}"></div>
                <div class="pmap-dot ${reached ? 'reached' : ''} ${isNext ? 'pulse' : ''}">
                    ${reached ? m.icon : (isNext ? '❓' : '🔒')}
                </div>
                <div class="pmap-label">
                    <div class="pmap-name">${reached ? m.name : (isNext ? '???' : '???')}</div>
                    ${reached || isNext ? `<div class="pmap-desc">${m.desc}</div>` : ''}
                </div>
            </div>`;
        });

        html += `</div>
            <div class="pmap-summary">${reachedCount}/${total} milestones reached</div>`;

        return html;
    }

    return { renderProgressMap, MILESTONES };
})();
