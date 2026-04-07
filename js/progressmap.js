/* ============================================
   OTB Games Hub — Progress Map (Journey Path)
   Winding path with milestone rewards
   ============================================ */
const HubProgressMap = (() => {
    // Milestones along the journey with coin rewards
    const MILESTONES = [
        { id: 'start', name: 'Begin!', icon: '🚀', desc: 'Start your learning journey', xpNeeded: 0, reward: 10 },
        { id: 'first-steps', name: 'First Steps', icon: '👣', desc: 'Answer 10 questions', totalAnswers: 10, reward: 10 },
        { id: 'getting-smart', name: 'Getting Smart', icon: '💡', desc: 'Reach Level 3', level: 3, reward: 10 },
        { id: 'explorer', name: 'Explorer', icon: '🗺️', desc: 'Play 2 different games', games: 2, reward: 10 },
        { id: 'number-cruncher', name: 'Number Cruncher', icon: '🔢', desc: 'Answer 25 math questions', mathAnswers: 25, reward: 10 },
        { id: 'word-reader', name: 'Word Reader', icon: '📖', desc: 'Answer 25 reading questions', readAnswers: 25, reward: 10 },
        { id: 'dedicated', name: 'Dedicated', icon: '⏰', desc: 'Play for 30 minutes total', playTime: 1800, reward: 15 },
        { id: 'rising-star', name: 'Rising Star', icon: '⭐', desc: 'Reach Level 5', level: 5, reward: 25 },
        { id: 'streak-keeper', name: 'Streak Keeper', icon: '🔥', desc: '3 day play streak', streak: 3, reward: 25 },
        { id: 'centurion', name: 'Centurion', icon: '💯', desc: 'Answer 100 questions', totalAnswers: 100, reward: 25 },
        { id: 'shopkeeper', name: 'Shopkeeper', icon: '🛍️', desc: 'Buy something from the shop', shopPurchase: true, reward: 25 },
        { id: 'math-whiz', name: 'Math Whiz', icon: '🧮', desc: '80% math accuracy (50+ answers)', mathAccuracy: 0.8, reward: 25 },
        { id: 'bookworm', name: 'Bookworm', icon: '📚', desc: '80% reading accuracy (50+ answers)', readAccuracy: 0.8, reward: 25 },
        { id: 'power-player', name: 'Power Player', icon: '🎮', desc: 'Reach Level 10', level: 10, reward: 25 },
        { id: 'game-master', name: 'Game Master', icon: '👑', desc: 'Play all 3 games', games: 3, reward: 25 },
        { id: 'week-warrior', name: 'Week Warrior', icon: '📅', desc: '7 day play streak', streak: 7, reward: 50 },
        { id: 'five-hundred', name: '500 Club', icon: '🏆', desc: 'Answer 500 questions', totalAnswers: 500, reward: 50 },
        { id: 'scholar', name: 'Scholar', icon: '🎓', desc: 'Reach Level 15', level: 15, reward: 50 },
        { id: 'brain-master', name: 'Brain Master', icon: '🧠', desc: 'Answer 1000 questions', totalAnswers: 1000, reward: 50 },
        { id: 'legend', name: 'Legend', icon: '🌟', desc: 'Reach Level 25', level: 25, reward: 50 },
    ];

    const CLAIMED_KEY = 'bbg_milestone_rewards_claimed';

    function _getClaimed() {
        try { return JSON.parse(localStorage.getItem(CLAIMED_KEY)) || []; }
        catch (e) { return []; }
    }

    function _setClaimed(list) {
        localStorage.setItem(CLAIMED_KEY, JSON.stringify(list));
    }

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

    // Award coins for newly reached milestones
    function claimRewards(profile, summary) {
        const claimed = _getClaimed();
        let totalAwarded = 0;
        MILESTONES.forEach(m => {
            if (claimed.includes(m.id)) return;
            if (checkMilestone(m, profile, summary)) {
                claimed.push(m.id);
                if (m.reward && typeof OTBEcosystem !== 'undefined') {
                    OTBEcosystem.addCoins(m.reward, 'milestone-' + m.id);
                    totalAwarded += m.reward;
                }
            }
        });
        if (totalAwarded > 0) {
            _setClaimed(claimed);
            if (typeof HubAnimations !== 'undefined') {
                HubAnimations.showToast(`Milestone reward: +${totalAwarded} coins!`, '🪙');
                HubAnimations.coinRain(totalAwarded);
            }
        }
    }

    function renderProgressMap() {
        const profile = OTBEcosystem.getProfile();
        const summary = OTBEcosystem.getSummary();

        // Claim any new milestone rewards
        claimRewards(profile, summary);

        let reachedCount = 0;
        const total = MILESTONES.length;

        // Count reached
        MILESTONES.forEach(m => { if (checkMilestone(m, profile, summary)) reachedCount++; });

        const pct = Math.round((reachedCount / total) * 100);

        let html = `<div class="journey-header">
            <div class="journey-count">${reachedCount} / ${total} Milestones</div>
            <div class="journey-progress-bar">
                <div class="journey-progress-fill" style="width:${pct}%"></div>
            </div>
        </div>
        <div class="journey-path">`;

        MILESTONES.forEach((m, i) => {
            const reached = checkMilestone(m, profile, summary);
            const isNext = !reached && (i === 0 || checkMilestone(MILESTONES[i-1], profile, summary));
            const side = (i % 2 === 0) ? 'left' : 'right';

            let stateClass = 'locked';
            if (reached) stateClass = 'reached';
            else if (isNext) stateClass = 'next';

            const iconDisplay = reached ? m.icon : (isNext ? '➡️' : '🔒');
            const nameDisplay = reached ? m.name : (isNext ? m.name : '???');

            html += `<div class="journey-node ${stateClass} journey-${side}">
                <div class="journey-node-icon">${iconDisplay}</div>
                <div class="journey-node-info">
                    <div class="journey-node-name">${nameDisplay}</div>
                    ${reached || isNext ? `<div class="journey-node-req">${m.desc}</div>` : ''}
                    <div class="journey-node-reward">🪙 ${m.reward}</div>
                </div>
            </div>`;
        });

        html += `</div>`;

        return html;
    }

    return { renderProgressMap, MILESTONES, claimRewards };
})();
