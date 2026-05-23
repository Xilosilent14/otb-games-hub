/* ============================================
   BBG Hub Dashboard Panel
   Greeting, level bar, "Play This Next" suggestion,
   recently mastered ribbon.
   Hooks into existing OTBEcosystem + ProfileManager.
   ============================================ */
(() => {
    'use strict';

    // Map ecosystem source IDs (used in recordAnswer/addXP) to card metadata.
    // These IDs match what each game passes as the `source` arg.
    const GAMES = [
        { id: 'think-fast',      name: 'Think Fast',       emoji: '\u{1F3CE}️', cardId: 'card-thinkfast',      bannerClass: 'thinkfast-banner' },
        { id: 'word-mine',       name: 'Word Mine',        emoji: '⛏️',    cardId: 'card-wordmine',       bannerClass: 'wordmine-banner' },
        { id: 'rhythm-blast',    name: 'Rhythm Blast',     emoji: '\u{1F3B5}',       cardId: 'card-rhythmblast',    bannerClass: 'rhythmblast-banner' },
        { id: 'potion-lab',      name: 'Potion Lab',       emoji: '\u{1F9EA}',       cardId: 'card-potionlab',      bannerClass: 'potionlab-banner' },
        { id: 'creature-cards',  name: 'Creature Cards',   emoji: '\u{1F0CF}',       cardId: 'card-creaturecards',  bannerClass: 'creaturecards-banner' },
        { id: 'spidey-academy',  name: 'Spidey Academy',   emoji: '\u{1F577}️', cardId: 'card-spideyacademy',  bannerClass: 'spidey-banner' }
    ];

    // Mastery thresholds. A topic is "mastered" once a kid has answered enough
    // times AND has high accuracy. Anything started but not mastered is
    // "in-progress".
    const MASTERY_MIN_TOTAL = 10;
    const MASTERY_MIN_ACCURACY = 0.8;
    const IN_PROGRESS_MIN_TOTAL = 3;

    const DAY_MS = 24 * 60 * 60 * 1000;

    // Only narrate greeting once per session per profile.
    const sessionGreeted = new Set();

    function _safeProfile() {
        if (typeof OTBEcosystem === 'undefined') return null;
        try { return OTBEcosystem.getProfile(); } catch (e) { return null; }
    }

    function _activeProfile() {
        if (typeof ProfileManager === 'undefined') return null;
        try { return ProfileManager.getActiveProfile(); } catch (e) { return null; }
    }

    // --- Suggestion algorithm ----------------------------------------------

    function _lastPlayedFor(profile, gameId) {
        // Best effort: scan mathMastery + readingMastery for the latest lastSeen
        // attributable to ANY topic, then if the profile has per-game last-played
        // info on profile.games[gameId].lastPlayed use that.
        let last = 0;
        if (profile.games && profile.games[gameId] && profile.games[gameId].lastPlayed) {
            last = Math.max(last, profile.games[gameId].lastPlayed);
        }
        // No per-topic source attribution exists in current mastery shape, so the
        // games[gameId].lastPlayed value is the most authoritative signal.
        return last;
    }

    function _inProgressCountFor(profile, gameId) {
        // We can't attribute topics to a specific game from the mastery data
        // (mastery is cross-game on purpose). So we approximate per-game
        // engagement using profile.gamesPlayed counts, and use the total
        // in-progress topics across the ecosystem as a tiebreaker.
        let inProgress = 0;
        const dom = (d) => d || {};
        const all = Object.entries(dom(profile.mathMastery))
            .concat(Object.entries(dom(profile.readingMastery)));
        all.forEach(([_, t]) => {
            const total = t.total || 0;
            const accuracy = total > 0 ? (t.correct || 0) / total : 0;
            if (total >= IN_PROGRESS_MIN_TOTAL && !(total >= MASTERY_MIN_TOTAL && accuracy >= MASTERY_MIN_ACCURACY)) {
                inProgress++;
            }
        });
        // Bias toward games the kid has actually touched
        const played = (profile.gamesPlayed && profile.gamesPlayed[gameId]) || 0;
        return played > 0 ? inProgress : 0;
    }

    function pickNextGame(profile) {
        const now = Date.now();
        const enriched = GAMES.map(g => {
            const last = _lastPlayedFor(profile, g.id);
            const ageDays = last ? (now - last) / DAY_MS : Infinity;
            const inProgress = _inProgressCountFor(profile, g.id);
            const played = (profile.gamesPlayed && profile.gamesPlayed[g.id]) || 0;
            return { game: g, ageDays, inProgress, played, last };
        });

        // (a) Lowest recent engagement: prefer games not played in >3 days,
        //     pick the staleest among ones the kid HAS touched at least once.
        const stale = enriched
            .filter(e => e.played > 0 && e.ageDays > 3)
            .sort((a, b) => b.ageDays - a.ageDays);
        if (stale.length > 0) {
            const pick = stale[0];
            const days = isFinite(pick.ageDays) ? Math.floor(pick.ageDays) : 0;
            return {
                game: pick.game,
                reason: days >= 1
                    ? `You haven't played in ${days} day${days !== 1 ? 's' : ''}`
                    : 'Time for a fresh round'
            };
        }

        // (b) Game with most in-progress mastery items
        const byProgress = enriched
            .filter(e => e.inProgress > 0)
            .sort((a, b) => b.inProgress - a.inProgress);
        if (byProgress.length > 0) {
            const pick = byProgress[0];
            return {
                game: pick.game,
                reason: `${pick.inProgress} thing${pick.inProgress !== 1 ? 's' : ''} almost mastered`
            };
        }

        // (c) Fallback: random non-recent game (or any if everything is recent)
        const candidates = enriched.filter(e => e.ageDays > 1);
        const pool = candidates.length > 0 ? candidates : enriched;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        // If they've never played this one, say so. Otherwise generic invite.
        const reason = pick.played === 0
            ? 'Try something new today!'
            : 'A great pick for right now';
        return { game: pick.game, reason };
    }

    // --- Recent mastery ribbon ---------------------------------------------

    function _gameIdFromSourceGuess(_topic) {
        // Mastery records do not store source-per-entry in current schema.
        // recentMastery (if a future version of ecosystem.js exposes it) is
        // expected to carry { topic, domain, game, masteredAt }.
        return null;
    }

    function getRecentMastery(profile) {
        // Preferred: explicit recentMastery feed maintained by ecosystem.js.
        if (Array.isArray(profile.recentMastery) && profile.recentMastery.length > 0) {
            const cutoff = Date.now() - 7 * DAY_MS;
            return profile.recentMastery
                .filter(r => r && r.masteredAt && r.masteredAt >= cutoff)
                .sort((a, b) => b.masteredAt - a.masteredAt)
                .slice(0, 12);
        }

        // Fallback: derive from mastery objects. Any topic that meets the
        // mastery threshold AND was last touched within the past 7 days counts.
        const cutoff = Date.now() - 7 * DAY_MS;
        const items = [];
        const scan = (obj, domain) => {
            Object.entries(obj || {}).forEach(([topic, t]) => {
                const total = t.total || 0;
                const accuracy = total > 0 ? (t.correct || 0) / total : 0;
                if (total >= MASTERY_MIN_TOTAL && accuracy >= MASTERY_MIN_ACCURACY && t.lastSeen && t.lastSeen >= cutoff) {
                    items.push({
                        topic,
                        domain,
                        game: _gameIdFromSourceGuess(topic),
                        masteredAt: t.lastSeen
                    });
                }
            });
        };
        scan(profile.mathMastery, 'math');
        scan(profile.readingMastery, 'reading');
        return items.sort((a, b) => b.masteredAt - a.masteredAt).slice(0, 12);
    }

    // --- Pretty topic labels -----------------------------------------------

    function prettyTopic(topic) {
        if (!topic) return '';
        return String(topic)
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    function gameLabelFor(gameId) {
        const g = GAMES.find(g => g.id === gameId);
        return g ? g.name : '';
    }

    // --- Rendering ---------------------------------------------------------

    function buildEmptyState() {
        const panel = document.getElementById('dashboard-panel');
        if (!panel) return;
        panel.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'dashboard-empty';
        const emoji = document.createElement('div');
        emoji.className = 'dashboard-empty-emoji';
        emoji.textContent = '\u{1F3AE}';
        const title = document.createElement('h2');
        title.className = 'dashboard-empty-title';
        title.textContent = 'Pick who you are';
        const sub = document.createElement('p');
        sub.className = 'dashboard-empty-sub';
        sub.textContent = 'Choose a player to see your stats and what to play next.';
        const btn = document.createElement('button');
        btn.className = 'otb-btn otb-btn-primary dashboard-empty-cta';
        btn.type = 'button';
        btn.textContent = 'Choose Player';
        btn.addEventListener('click', () => {
            try { if (window.HubSFX) window.HubSFX.click(); } catch (_) {}
            // Existing flow: profile select screen
            const select = document.getElementById('profile-select');
            const hub = document.getElementById('hub');
            if (select && hub) {
                hub.style.display = 'none';
                select.style.display = 'flex';
            }
        });

        card.appendChild(emoji);
        card.appendChild(title);
        card.appendChild(sub);
        card.appendChild(btn);
        panel.appendChild(card);
    }

    function buildGreeting(profile, activeProfile) {
        const name = (activeProfile && activeProfile.name) || profile.playerName || 'Player';
        const streak = profile.dailyStreak || 0;

        const strip = document.createElement('div');
        strip.className = 'dashboard-greeting';

        const left = document.createElement('div');
        left.className = 'dashboard-greeting-left';
        const hi = document.createElement('div');
        hi.className = 'dashboard-greeting-text';
        hi.textContent = `Hi, ${name}!`;
        const sub = document.createElement('div');
        sub.className = 'dashboard-greeting-sub';
        sub.textContent = _timeOfDayLabel();
        left.appendChild(hi);
        left.appendChild(sub);

        const chips = document.createElement('div');
        chips.className = 'dashboard-greeting-chips';

        if (streak > 0) {
            const chip = document.createElement('span');
            chip.className = 'dashboard-chip dashboard-chip-streak';
            chip.innerHTML = ''; // safe set below
            const flame = document.createElement('span');
            flame.textContent = '\u{1F525}';
            flame.className = 'dashboard-chip-icon';
            const label = document.createElement('span');
            label.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
            chip.appendChild(flame);
            chip.appendChild(label);
            chips.appendChild(chip);
        }

        strip.appendChild(left);
        strip.appendChild(chips);
        return strip;
    }

    function _timeOfDayLabel() {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    }

    function buildLevelBar(profile) {
        const level = (typeof OTBEcosystem !== 'undefined' && OTBEcosystem.getLevelInfo)
            ? OTBEcosystem.getLevelInfo()
            : { level: profile.globalLevel || 1, xpInLevel: 0, xpForNext: 100, progress: 0 };

        const wrap = document.createElement('div');
        wrap.className = 'dashboard-levelbar';

        const head = document.createElement('div');
        head.className = 'dashboard-levelbar-head';
        const tag = document.createElement('span');
        tag.className = 'dashboard-levelbar-tag';
        tag.textContent = `BBG Level ${level.level}`;
        const xp = document.createElement('span');
        xp.className = 'dashboard-levelbar-xp';
        xp.textContent = `${level.xpInLevel || 0} / ${level.xpForNext || 100} XP`;
        head.appendChild(tag);
        head.appendChild(xp);

        const track = document.createElement('div');
        track.className = 'dashboard-levelbar-track';
        const fill = document.createElement('div');
        fill.className = 'dashboard-levelbar-fill';
        const pct = Math.max(0, Math.min(1, level.progress || 0)) * 100;
        fill.style.width = pct.toFixed(1) + '%';
        track.appendChild(fill);

        wrap.appendChild(head);
        wrap.appendChild(track);
        return wrap;
    }

    function buildSuggestion(profile) {
        const pick = pickNextGame(profile);
        const g = pick.game;

        const card = document.createElement('a');
        card.className = 'dashboard-suggest';
        card.setAttribute('role', 'button');
        // Resolve URL via OTBConfig so this matches existing card behavior
        if (typeof OTBConfig !== 'undefined') {
            card.href = OTBConfig.getGameUrl(g.id);
        } else {
            card.href = '#';
        }

        const banner = document.createElement('div');
        banner.className = `dashboard-suggest-banner ${g.bannerClass}`;
        const emoji = document.createElement('span');
        emoji.className = 'dashboard-suggest-emoji';
        emoji.textContent = g.emoji;
        banner.appendChild(emoji);

        const body = document.createElement('div');
        body.className = 'dashboard-suggest-body';
        const kicker = document.createElement('div');
        kicker.className = 'dashboard-suggest-kicker';
        kicker.textContent = 'Play this next';
        const title = document.createElement('div');
        title.className = 'dashboard-suggest-title';
        title.textContent = g.name;
        const reason = document.createElement('div');
        reason.className = 'dashboard-suggest-reason';
        reason.textContent = pick.reason;

        const cta = document.createElement('span');
        cta.className = 'dashboard-suggest-cta';
        cta.textContent = 'Play ▶';

        body.appendChild(kicker);
        body.appendChild(title);
        body.appendChild(reason);
        body.appendChild(cta);

        card.appendChild(banner);
        card.appendChild(body);

        card.addEventListener('click', () => {
            try { if (window.HubSFX) window.HubSFX.click(); } catch (_) {}
        });

        return card;
    }

    function buildRecentMastery(profile) {
        const items = getRecentMastery(profile);

        const section = document.createElement('section');
        section.className = 'dashboard-recent';

        const head = document.createElement('div');
        head.className = 'dashboard-recent-head';
        const title = document.createElement('h3');
        title.className = 'dashboard-recent-title';
        title.textContent = 'Recently Mastered';
        head.appendChild(title);

        const strip = document.createElement('div');
        strip.className = 'dashboard-recent-strip';

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'dashboard-recent-empty';
            empty.textContent = 'Keep playing to master your first thing!';
            strip.appendChild(empty);
        } else {
            items.forEach(item => {
                const chip = document.createElement('div');
                chip.className = 'dashboard-recent-chip';
                const star = document.createElement('span');
                star.className = 'dashboard-recent-chip-star';
                star.textContent = '\u{1F31F}';
                const txt = document.createElement('div');
                txt.className = 'dashboard-recent-chip-text';
                const top = document.createElement('div');
                top.className = 'dashboard-recent-chip-topic';
                top.textContent = prettyTopic(item.topic);
                const bot = document.createElement('div');
                bot.className = 'dashboard-recent-chip-source';
                const game = item.game ? gameLabelFor(item.game) : '';
                bot.textContent = game || prettyDomain(item.domain);
                txt.appendChild(top);
                txt.appendChild(bot);
                chip.appendChild(star);
                chip.appendChild(txt);
                strip.appendChild(chip);
            });
        }

        section.appendChild(head);
        section.appendChild(strip);
        return section;
    }

    function prettyDomain(d) {
        if (d === 'math') return 'Math';
        if (d === 'reading') return 'Reading';
        return d || '';
    }

    function buildContent(profile, activeProfile) {
        const panel = document.getElementById('dashboard-panel');
        if (!panel) return;
        panel.innerHTML = '';

        // Greeting + level bar in a header row
        const top = document.createElement('div');
        top.className = 'dashboard-top';
        top.appendChild(buildGreeting(profile, activeProfile));
        top.appendChild(buildLevelBar(profile));
        panel.appendChild(top);

        // Suggest + recent in a 2-up row on desktop, stacked on tablet
        const row = document.createElement('div');
        row.className = 'dashboard-row';
        row.appendChild(buildSuggestion(profile));
        row.appendChild(buildRecentMastery(profile));
        panel.appendChild(row);
    }

    // --- TTS narration once per session ------------------------------------

    function maybeNarrate(profile, activeProfile) {
        if (typeof CloudTTS === 'undefined') return;
        const id = (activeProfile && activeProfile.id) || 'shared';
        if (sessionGreeted.has(id)) return;
        sessionGreeted.add(id);

        const name = (activeProfile && activeProfile.name) || profile.playerName || 'friend';
        const streak = profile.dailyStreak || 0;
        let line;
        if (streak >= 2) {
            line = `Welcome back, ${name}! ${streak} day streak!`;
        } else {
            line = `Hi ${name}! Ready to play?`;
        }

        // Defer a touch so it doesn't fight other startup sounds
        setTimeout(() => {
            try { CloudTTS.speakFemale(line); } catch (_) {}
        }, 700);
    }

    // --- Public render -----------------------------------------------------

    function render() {
        const panel = document.getElementById('dashboard-panel');
        if (!panel) return;

        const activeProfile = _activeProfile();
        if (!activeProfile) {
            buildEmptyState();
            return;
        }

        const profile = _safeProfile();
        if (!profile) {
            buildEmptyState();
            return;
        }

        buildContent(profile, activeProfile);
        maybeNarrate(profile, activeProfile);
    }

    // Expose for hub.js + other modules
    window.HubDashboard = { render };

    // Render on initial load and re-render when the Hub gets focus back.
    function _scheduleInitial() {
        // Wait for the splash/profile-select flow to finish placing #hub visible.
        // Poll briefly for the panel to be in the DOM and visible.
        let tries = 0;
        const t = setInterval(() => {
            tries++;
            const panel = document.getElementById('dashboard-panel');
            const hub = document.getElementById('hub');
            if (panel && hub && hub.style.display !== 'none') {
                clearInterval(t);
                render();
            } else if (tries > 40) {
                // Bail after ~8s; user is probably still on profile-select
                clearInterval(t);
            }
        }, 200);
    }

    document.addEventListener('DOMContentLoaded', _scheduleInitial);

    // Re-render when tab regains focus (e.g. coming back from a game)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // small delay so ecosystem changes from the game flush first
            setTimeout(render, 150);
        }
    });
})();
