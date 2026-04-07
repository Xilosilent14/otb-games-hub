/* ============================================
   OTB Games Hub — Weekly Report Card
   Visual upgrade with stars, highlights, trends
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
                prevMathAccuracy: 0,
                prevReadAccuracy: 0,
                prevAnswers: 0,
                playTimeThisWeek: profile.totalPlayTime,
                currentLevel: summary.globalLevel,
                levelsGained: 0,
                streak: profile.dailyStreak,
                isFirstWeek: true,
                bestDay: null,
                bestDayCount: 0
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

        // Find best day this week
        let bestDay = null;
        let bestDayCount = 0;
        for (let i = 1; i < snapshots.length; i++) {
            const diff = snapshots[i].totalAnswers - snapshots[i-1].totalAnswers;
            if (diff > bestDayCount) {
                bestDayCount = diff;
                bestDay = snapshots[i].date;
            }
        }

        // Previous week baseline for trends
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const twoWeeksStr = twoWeeksAgo.toISOString().slice(0, 10);
        let prevBaseline = snapshots[0];
        for (const s of snapshots) {
            if (s.date <= twoWeeksStr) prevBaseline = s;
        }

        return {
            answersThisWeek: latest.totalAnswers - baseline.totalAnswers,
            mathThisWeek: latest.mathTotal - baseline.mathTotal,
            readThisWeek: latest.readTotal - baseline.readTotal,
            mathAccuracy: latest.mathAccuracy,
            readAccuracy: latest.readAccuracy,
            prevMathAccuracy: baseline.mathAccuracy,
            prevReadAccuracy: baseline.readAccuracy,
            prevAnswers: baseline.totalAnswers - prevBaseline.totalAnswers,
            playTimeThisWeek: latest.playTime - baseline.playTime,
            currentLevel: latest.level,
            levelsGained: latest.level - baseline.level,
            streak: latest.streak,
            isFirstWeek: false,
            bestDay,
            bestDayCount
        };
    }

    function getEncouragement(stats, playerName) {
        const messages = [];
        const name = playerName || 'Player';

        if (stats.answersThisWeek >= 50) messages.push(`${name}, you're on fire this week! Incredible work!`);
        else if (stats.answersThisWeek >= 20) messages.push(`Great week, ${name}! You're learning so much!`);
        else if (stats.answersThisWeek >= 5) messages.push(`Good job practicing this week, ${name}!`);
        else messages.push(`Let's have a great week of learning, ${name}!`);

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

    function _formatDayName(dateStr) {
        if (!dateStr) return '';
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const d = new Date(dateStr + 'T12:00:00');
        return days[d.getDay()];
    }

    function _trendArrow(current, previous) {
        if (previous === 0 && current === 0) return '';
        if (current > previous) return '<span class="report-trend-up">&#8593;</span>';
        if (current < previous) return '<span class="report-trend-down">&#8595;</span>';
        return '';
    }

    function renderReportCard() {
        const stats = getWeeklyStats();
        const profile = OTBEcosystem.getProfile();
        const playerName = profile.playerName || 'Player';
        const encouragement = getEncouragement(stats, playerName);
        const stars = getStarRating(stats);
        const playMins = Math.round(stats.playTimeThisWeek / 60);

        // Stars display
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            if (i < stars) {
                starsHtml += `<span class="report-star-filled">&#11088;</span>`;
            } else {
                starsHtml += `<span class="report-star-empty">&#9734;</span>`;
            }
        }

        // Highlights
        let highlightsHtml = '';
        const highlights = [];
        if (stats.bestDay && stats.bestDayCount > 0) {
            highlights.push(`Best day: ${_formatDayName(stats.bestDay)} with ${stats.bestDayCount} answers!`);
        }
        if (stats.streak >= 3) highlights.push(`${stats.streak} day streak and counting!`);
        if (stats.levelsGained > 0) highlights.push(`Leveled up ${stats.levelsGained} time${stats.levelsGained > 1 ? 's' : ''}!`);
        if (stats.mathAccuracy >= 0.9) highlights.push('Math accuracy over 90%!');
        if (stats.readAccuracy >= 0.9) highlights.push('Reading accuracy over 90%!');
        if (highlights.length === 0) highlights.push('Keep playing to unlock highlights!');

        highlightsHtml = highlights.map(h => `<div class="report-highlight-item">&#127942; ${h}</div>`).join('');

        // Trend arrows
        const mathTrend = _trendArrow(stats.mathAccuracy, stats.prevMathAccuracy);
        const readTrend = _trendArrow(stats.readAccuracy, stats.prevReadAccuracy);
        const answersTrend = _trendArrow(stats.answersThisWeek, stats.prevAnswers);

        const mathPct = Math.round(stats.mathAccuracy * 100);
        const readPct = Math.round(stats.readAccuracy * 100);

        let html = `<div class="report-card">
            <div class="report-header">
                <h3 class="report-title">Weekly Report Card</h3>
                <div class="report-stars">${starsHtml}</div>
            </div>

            <div class="report-encouragement">
                ${encouragement.map(m => `<div class="report-msg">${m}</div>`).join('')}
            </div>

            <div class="report-highlights">
                <div style="font-family:var(--otb-font-heading);font-size:0.85rem;color:var(--otb-coin);margin-bottom:8px;">This Week's Highlights</div>
                ${highlightsHtml}
            </div>

            <div class="report-stat-row">
                <div class="report-stat-box">
                    <div class="report-stat-value">${stats.answersThisWeek} ${answersTrend}</div>
                    <div class="report-stat-label">Questions${stats.isFirstWeek ? ' Total' : ' This Week'}</div>
                </div>
                <div class="report-stat-box">
                    <div class="report-stat-value">${playMins}m</div>
                    <div class="report-stat-label">Play Time${stats.isFirstWeek ? '' : ' This Week'}</div>
                </div>
            </div>

            <div class="report-stat-row">
                <div class="report-stat-box">
                    <div class="report-stat-value">${mathPct}% ${mathTrend}</div>
                    <div class="report-stat-label">Math Accuracy</div>
                    <div class="report-bar"><div class="report-bar-fill report-bar-math" style="width:0%" data-target="${mathPct}"></div></div>
                </div>
                <div class="report-stat-box">
                    <div class="report-stat-value">${readPct}% ${readTrend}</div>
                    <div class="report-stat-label">Reading Accuracy</div>
                    <div class="report-bar"><div class="report-bar-fill report-bar-reading" style="width:0%" data-target="${readPct}"></div></div>
                </div>
            </div>

            <div class="report-footer">
                <span>Level ${stats.currentLevel}</span>
                <span>&#128293; ${stats.streak} day streak</span>
            </div>

            <button class="report-show-btn otb-btn otb-btn-primary otb-btn-small" onclick="HubReportCard.showFullScreen()">Show Mom & Dad!</button>
        </div>`;

        // Animate bars after render
        setTimeout(() => {
            document.querySelectorAll('.report-bar-fill[data-target]').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 100);

        return html;
    }

    function showFullScreen() {
        const area = document.getElementById('report-card-area');
        if (!area) return;
        const card = area.querySelector('.report-card');
        if (!card) return;

        if (card.classList.contains('report-fullscreen')) {
            card.classList.remove('report-fullscreen');
            document.body.style.overflow = '';
            return;
        }

        card.classList.add('report-fullscreen');
        document.body.style.overflow = 'hidden';

        // Click anywhere to exit
        const handler = (e) => {
            if (e.target === card || card.contains(e.target)) return;
            card.classList.remove('report-fullscreen');
            document.body.style.overflow = '';
            document.removeEventListener('click', handler);
        };
        setTimeout(() => document.addEventListener('click', handler), 100);
    }

    return {
        takeSnapshot,
        renderReportCard,
        getWeeklyStats,
        showFullScreen
    };
})();
