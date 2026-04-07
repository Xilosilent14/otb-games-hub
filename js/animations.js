/* ============================================
   OTB Games Hub — Celebration Animations
   ============================================ */
const HubAnimations = (() => {
    // Confetti burst
    function confetti(duration = 3000) {
        const container = document.createElement('div');
        container.className = 'anim-confetti-container';
        document.body.appendChild(container);

        const colors = ['#ffd700', '#e94560', '#4a8f3f', '#a855f7', '#4fc3f7', '#ff7043', '#66bb6a'];
        const count = 60;

        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'anim-confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
            // Random shapes
            if (Math.random() > 0.5) {
                piece.style.borderRadius = '50%';
                piece.style.width = '8px';
                piece.style.height = '8px';
            } else {
                piece.style.width = (6 + Math.random() * 6) + 'px';
                piece.style.height = (3 + Math.random() * 3) + 'px';
            }
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), duration + 1000);
    }

    // Coin rain effect (with coin collect SFX)
    function coinRain(amount = 10) {
        if (typeof HubSFX !== 'undefined') HubSFX.coinCollect();
        const container = document.createElement('div');
        container.className = 'anim-coin-container';
        document.body.appendChild(container);

        for (let i = 0; i < Math.min(amount, 20); i++) {
            const coin = document.createElement('div');
            coin.className = 'anim-coin';
            coin.textContent = '🪙';
            coin.style.left = (10 + Math.random() * 80) + '%';
            coin.style.animationDelay = Math.random() * 0.8 + 's';
            coin.style.fontSize = (0.8 + Math.random() * 0.6) + 'rem';
            container.appendChild(coin);
        }

        setTimeout(() => container.remove(), 3000);
    }

    // Coin spend (coins fly from display to nowhere, satisfying)
    function coinSpend(amount) {
        const coinsEl = document.getElementById('coins-display');
        if (!coinsEl) return;
        const rect = coinsEl.getBoundingClientRect();

        for (let i = 0; i < Math.min(amount / 10, 8); i++) {
            const coin = document.createElement('div');
            coin.className = 'anim-coin-fly';
            coin.textContent = '🪙';
            coin.style.left = rect.left + 'px';
            coin.style.top = rect.top + 'px';
            coin.style.animationDelay = i * 0.1 + 's';
            document.body.appendChild(coin);
            setTimeout(() => coin.remove(), 1500);
        }
    }

    // Fire streak animation
    function fireStreak(streakDays) {
        const streakEl = document.getElementById('streak-display');
        if (!streakEl || streakDays < 2) return;

        streakEl.classList.add('anim-fire-glow');
        setTimeout(() => streakEl.classList.remove('anim-fire-glow'), 2000);

        // Add flame particles
        const rect = streakEl.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
            const flame = document.createElement('div');
            flame.className = 'anim-flame';
            flame.textContent = '🔥';
            flame.style.left = (rect.left + Math.random() * rect.width) + 'px';
            flame.style.top = (rect.top - 10) + 'px';
            flame.style.animationDelay = i * 0.15 + 's';
            document.body.appendChild(flame);
            setTimeout(() => flame.remove(), 1500);
        }
    }

    // Level up celebration
    function levelUp(newLevel) {
        confetti(4000);

        // Big level display
        const overlay = document.createElement('div');
        overlay.className = 'anim-levelup-overlay';
        overlay.innerHTML = `
            <div class="anim-levelup-content">
                <div class="anim-levelup-stars">⭐ ⭐ ⭐</div>
                <div class="anim-levelup-text">LEVEL UP!</div>
                <div class="anim-levelup-number">${newLevel}</div>
            </div>`;
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.classList.add('anim-fadeout');
            setTimeout(() => overlay.remove(), 500);
        }, 2500);
    }

    // Toast notification
    function showToast(message, icon = '⭐', duration = 3000) {
        const existing = document.querySelector('.hub-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'hub-toast';
        toast.innerHTML = `
            <span class="hub-toast-icon">${icon}</span>
            <span class="hub-toast-msg">${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hub-toast-out');
            setTimeout(() => toast.remove(), 500);
        }, duration);
    }

    // XP gain floating number
    function xpGain(amount) {
        const xpBar = document.getElementById('xp-fill');
        if (!xpBar) return;
        const rect = xpBar.getBoundingClientRect();

        const floater = document.createElement('div');
        floater.className = 'anim-xp-float';
        floater.textContent = `+${amount} XP`;
        floater.style.left = (rect.left + rect.width / 2) + 'px';
        floater.style.top = rect.top + 'px';
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 1500);
    }

    return {
        confetti,
        coinRain,
        coinSpend,
        fireStreak,
        levelUp,
        showToast,
        xpGain
    };
})();
