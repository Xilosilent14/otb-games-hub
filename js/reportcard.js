/* ============================================
   OTB Games Hub — Weekly Report Card
   ============================================ */
const HubReportCard = (() => {
    const STORAGE_KEY = 'otb_weekly_snapshots';

    function _todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    function _getSnapshots() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch (e) { return []; }
    }

    // Take a daily snapshot (called on hub load, once per day)
    function takeSnapshot() {
        const snapshots = _getSnapshots();
        const today = _todayStr();

        // Already snapped today?
        if (snapshots.length > 0 && snapshots[snapshots.length - 1].date === today) return;

        const profile = OTBEcosystem.getProfile();
        const summary = OTBEcosystem.getSummary();
        const mathTotal = Object.values(profile.mathMastery || {}).reduce((a,t) => a + t.total, 0);
        const readTotal = Object.values(profile.readingMastery || {}).reduce((a,t) => a + t.total, 0);

        snapshots.push({
            date: today,
            totalAnswers: summary.totalAnswers,
            mathTotal,
            readTotal,
            mathAccuracy: summary.mathAccuracy,
            readAccuracy: summary.readingAccuracy,
            level: summary.globalLevel,
            xp: summary.globalXP,
            coins: profile.totalCoinsEarned,
            playTime: profile.totalPlayTime,
            streak: profile.dailyStreak
        });

        // Keep last 30 days
        while (snapshots.length > 30) snapshots.shift();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    }

    function getWeeklyStats() {
        const snapshots = _getSnapshots();
        if (snapshots.length < 2) {
            // Not enough data yet, use current stats
            const summary = OTBEcosystem.getSummary();
            const profile = OTBEcosystem.getProfile();
            return {
                answersThisWeek: summary.totalAnswers,
                mathThisWeek: Object.values(profile.mathMastery || {}).reduce((a,t) => a + t.total, 0),
                readThisWeek: Object.values(profile.readingMastery || {}).reduce((a,t) => a + t.total, 0),
                mathAccuracy: summary.mathAccuracy,
                readAccuracy: summary.readingAccuracy,
                playTimeThisWeek: profile.totalPlayTime,
                currentLevel: summary.globalLevel,
                levelsGained: 0,
                streak: profile.dailyStreak,
                isFirstWeek: true
            };
        }

        const latest = snapshots[snapshots.length - 1];
        // Find snapshot from ~7 days ago
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().slice(0, 10);
        let baseline = snapshots[0]; // fallback to oldest
        for (const s of snapshots) {
            if (s.date <= weekAgoStr) baseline = s;
        }

        return {
            answersThisWeek: latest.totalAnswers - baseline.totalAnswers,
            mathThisWeek: latest.mathTotal - baseline.mathTotal,
            readThisWeek: latest.readTotal - baseline.readTotal,
            mathAccuracy: latest.mathAccuracy,
            readAccuracy: latest.readAccuracy,
            playTimeThisWeek: latest.playTime - baseline.playTime,
            currentLevel: latest.level,
            levelsGained: latest.level - baseline.level,
            streak: latest.streak,
            isFirstWeek: false
        };
    }

    function getEncouragement(stats) {
        const messages = [];

        if (stats.answersThisWeek >= 50) messages.push("Incredible work! You're on fire this week!");
        else if (stats.answersThisWeek >= 20) messages.push("Great week! You're learning so much!");
        else if (stats.answersThisWeek >= 5) messages.push("Good job practicing this week!");
        else messages.push("Let's have a great week of learning!");

        if (stats.mathAccuracy >= 0.9) messages.push("Your math skills are amazing!");
        else if (stats.mathAccuracy >= 0.7) messages.push("Your math is getting stronger!");

        if (stats.readAccuracy >= 0.9) messages.push("You're a reading superstar!");
        else if (stats.readAccuracy >= 0.7) messages.push("Your reading is really improving!");

        if (stats.levelsGained > 0) messages.push(`You gained ${stats.levelsGained} level${stats.levelsGained > 1 ? 's' : ''} this week!`);

        if (stats.streak >= 7) messages.push("A whole week streak! Incredible dedication!");
        else if (stats.streak >= 3) messages.push("Keep that streak going!");

        return messages;
    }

    function getStarRating(stats) {
        let stars = 0;
        if (stats.answersThisWeek >= 5) stars++;
        if (stats.answersThisWeek >= 15) stars++;
        if (stats.answersThisWeek >= 30) stars++;
        if (stats.mathAccuracy >= 0.7 || stats.readAccuracy >= 0.7) stars++;
        if (stats.streak >= 3) stars++;
        return Math.min(stars, 5);
    }

    function renderReportCard() {
        const stats = getWeeklyStats();
        const encouragement = getEncouragement(stats);
        const stars = getStarRating(stats);
        const playMins = Math.round(stats.playTimeThisWeek / 60);

        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            starsHtml += `<span class="report-star ${i < stars ? 'earned' : 'empty'}">${i < stars ? '⭐' : '☆'}</span>`;
        }

        let html = `<div class="report-card">
            <div class="report-header">
                <h3 class="report-title">Weekly Report Card</h3>
                <div class="report-stars">${starsHtml}</div>
            </div>

            <div class="report-encouragement">
                ${encouragement.map(m => `<div class="report-msg">${m}</div>`).join('')}
            </div>

            <div class="report-stats-grid">
                <div class="report-stat">
                    <div class="report-stat-value">${stats.answersThisWeek}</div>
                    <div class="report-stat-label">Questions${stats.isFirstWeek ? ' Total' : ' This Week'}</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value">${Math.round(stats.mathAccuracy * 100)}%</div>
                    <div class="report-stat-label">Math Accuracy</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value">${Math.round(stats.readAccuracy * 100)}%</div>
                    <div class="report-stat-label">Reading Accuracy</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value">${playMins}m</div>
                    <div class="report-stat-label">Play Time${stats.isFirstWeek ? '' : ' This Week'}</div>
                </div>
            </div>

            <div class="report-breakdown">
                <div class="report-bar-group">
                    <span class="report-bar-label">🔢 Math</span>
                    <div class="report-bar">
                        <div class="report-bar-fill math" style="width:${Math.min(stats.mathAccuracy * 100, 100)}%"></div>
                    </div>
                    <span class="report-bar-pct">${stats.mathThisWeek} answered</span>
                </div>
                <div class="report-bar-group">
                    <span class="report-bar-label">📖 Reading</span>
                    <div class="report-bar">
                        <div class="report-bar-fill reading" style="width:${Math.min(stats.readAccuracy * 100, 100)}%"></div>
                    </div>
                    <span class="report-bar-pct">${stats.readThisWeek} answered</span>
                </div>
            </div>

            <div class="report-footer">
                <span>Level ${stats.currentLevel}</span>
                <span>🔥 ${stats.streak} day streak</span>
            </div>
        </div>`;

        return html;
    }

    return {
        takeSnapshot,
        renderReportCard,
        getWeeklyStats
    };
})();
