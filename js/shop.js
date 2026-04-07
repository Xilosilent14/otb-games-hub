/* ============================================
   OTB Games Hub — Coin Shop System
   ============================================ */
const HubShop = (() => {
    // All purchasable items
    const CATALOG = [
        // Avatars
        { id: 'avatar-rocket', name: 'Rocket', type: 'avatar', price: 50, emoji: '🚀', desc: 'Blast off!' },
        { id: 'avatar-dragon', name: 'Dragon', type: 'avatar', price: 75, emoji: '🐉', desc: 'Fierce and smart' },
        { id: 'avatar-unicorn', name: 'Unicorn', type: 'avatar', price: 75, emoji: '🦄', desc: 'Magical learner' },
        { id: 'avatar-robot', name: 'Robot', type: 'avatar', price: 100, emoji: '🤖', desc: 'Beep boop brain' },
        { id: 'avatar-alien', name: 'Alien', type: 'avatar', price: 100, emoji: '👽', desc: 'Out of this world' },
        { id: 'avatar-ninja', name: 'Ninja', type: 'avatar', price: 150, emoji: '🥷', desc: 'Silent genius' },
        { id: 'avatar-crown', name: 'King', type: 'avatar', price: 200, emoji: '👑', desc: 'Rule the arcade' },
        { id: 'avatar-star', name: 'Superstar', type: 'avatar', price: 250, emoji: '🌟', desc: 'Shine bright' },

        // Name Colors
        { id: 'color-blue', name: 'Ocean Blue', type: 'nameColor', price: 30, color: '#4fc3f7', desc: 'Cool blue name' },
        { id: 'color-green', name: 'Emerald', type: 'nameColor', price: 30, color: '#66bb6a', desc: 'Green machine' },
        { id: 'color-pink', name: 'Bubblegum', type: 'nameColor', price: 30, color: '#f48fb1', desc: 'Pretty in pink' },
        { id: 'color-purple', name: 'Galaxy', type: 'nameColor', price: 50, color: '#ce93d8', desc: 'Space purple' },
        { id: 'color-fire', name: 'Fire', type: 'nameColor', price: 75, color: '#ff7043', desc: 'Hot stuff' },
        { id: 'color-rainbow', name: 'Rainbow', type: 'nameColor', price: 150, color: 'rainbow', desc: 'All the colors!' },

        // Titles
        { id: 'title-racer', name: 'Speed Racer', type: 'title', price: 40, title: 'Speed Racer', desc: 'Fast and furious' },
        { id: 'title-wizard', name: 'Word Wizard', type: 'title', price: 40, title: 'Word Wizard', desc: 'Master of words' },
        { id: 'title-mathking', name: 'Math King', type: 'title', price: 60, title: 'Math King', desc: 'Numbers bow to you' },
        { id: 'title-genius', name: 'Little Genius', type: 'title', price: 80, title: 'Little Genius', desc: 'Big brain energy' },
        { id: 'title-champion', name: 'Champion', type: 'title', price: 100, title: 'Champion', desc: 'The best of the best' },
        { id: 'title-legend', name: 'Legend', type: 'title', price: 200, title: 'Legend', desc: 'Absolutely legendary' },

        // Pet Accessories
        { id: 'pet-crown', name: 'Crown', type: 'petAccessory', price: 50, emoji: '👑', desc: 'Royal pet!' },
        { id: 'pet-sunglasses', name: 'Sunglasses', type: 'petAccessory', price: 40, emoji: '🕶️', desc: 'Cool shades' },
        { id: 'pet-bow', name: 'Bow', type: 'petAccessory', price: 30, emoji: '🎀', desc: 'Pretty bow' },
        { id: 'pet-tophat', name: 'Top Hat', type: 'petAccessory', price: 60, emoji: '🎩', desc: 'Fancy hat' },
        { id: 'pet-partyhat', name: 'Party Hat', type: 'petAccessory', price: 35, emoji: '🥳', desc: 'Party time!' },
        { id: 'pet-cape', name: 'Cape', type: 'petAccessory', price: 75, emoji: '🦸', desc: 'Super pet!' },

        // Hub Themes
        { id: 'theme-space', name: 'Space', type: 'hubTheme', price: 100, theme: 'space', desc: 'Stars and galaxies', preview: '🌌' },
        { id: 'theme-ocean', name: 'Ocean', type: 'hubTheme', price: 100, theme: 'ocean', desc: 'Deep sea vibes', preview: '🌊' },
        { id: 'theme-forest', name: 'Forest', type: 'hubTheme', price: 100, theme: 'forest', desc: 'Enchanted woods', preview: '🌲' },
        { id: 'theme-lava', name: 'Lava', type: 'hubTheme', price: 150, theme: 'lava', desc: 'Hot and fiery', preview: '🌋' },
        { id: 'theme-candy', name: 'Candy', type: 'hubTheme', price: 150, theme: 'candy', desc: 'Sweet and colorful', preview: '🍬' },
    ];

    const TYPE_LABELS = {
        avatar: '🎭 Avatars',
        nameColor: '🎨 Name Colors',
        title: '🏷️ Titles',
        petAccessory: '🐾 Pet Accessories',
        hubTheme: '🎨 Hub Themes'
    };

    const TYPE_ORDER = ['avatar', 'nameColor', 'title', 'petAccessory', 'hubTheme'];

    function getProfile() {
        return OTBEcosystem.getProfile();
    }

    function isPurchased(itemId) {
        const p = getProfile();
        return (p.purchasedItems || []).includes(itemId);
    }

    function isEquipped(item) {
        const p = getProfile();
        const eq = p.equippedItems || { avatar: 'default', nameColor: 'gold', title: '', hubTheme: 'default' };
        if (item.type === 'avatar') return eq.avatar === item.id;
        if (item.type === 'nameColor') return eq.nameColor === (item.color || item.id);
        if (item.type === 'title') return eq.title === (item.title || '');
        if (item.type === 'hubTheme') return eq.hubTheme === (item.theme || 'default');
        if (item.type === 'petAccessory') {
            if (typeof HubPet !== 'undefined') return HubPet.getEquippedAccessory() === item.id;
            return false;
        }
        return false;
    }

    function purchase(itemId) {
        const item = CATALOG.find(i => i.id === itemId);
        if (!item) return { success: false, reason: 'Item not found' };
        if (isPurchased(itemId)) return { success: false, reason: 'Already owned' };

        const result = OTBEcosystem.spendCoins(item.price);
        if (!result.success) return { success: false, reason: 'Not enough coins' };

        // Add to purchased list
        const p = OTBEcosystem.getProfile();
        if (!p.purchasedItems) p.purchasedItems = [];
        p.purchasedItems.push(itemId);
        p.updatedAt = Date.now();
        localStorage.setItem('otb_shared_profile', JSON.stringify(p));

        return { success: true, remaining: result.remaining };
    }

    function equip(itemId) {
        const item = CATALOG.find(i => i.id === itemId);
        if (!item) return false;

        const p = OTBEcosystem.getProfile();
        if (!p.equippedItems) p.equippedItems = { avatar: 'default', nameColor: 'gold', title: '', hubTheme: 'default' };

        if (item.type === 'avatar') p.equippedItems.avatar = item.id;
        else if (item.type === 'nameColor') p.equippedItems.nameColor = item.color || item.id;
        else if (item.type === 'title') p.equippedItems.title = item.title || '';
        else if (item.type === 'hubTheme') p.equippedItems.hubTheme = item.theme || 'default';
        else if (item.type === 'petAccessory') {
            if (typeof HubPet !== 'undefined') HubPet.equipAccessory(item.id);
            return true;
        }

        p.updatedAt = Date.now();
        localStorage.setItem('otb_shared_profile', JSON.stringify(p));
        return true;
    }

    function unequip(type) {
        const p = OTBEcosystem.getProfile();
        if (!p.equippedItems) return;
        if (type === 'avatar') p.equippedItems.avatar = 'default';
        else if (type === 'nameColor') p.equippedItems.nameColor = 'gold';
        else if (type === 'title') p.equippedItems.title = '';
        else if (type === 'hubTheme') p.equippedItems.hubTheme = 'default';
        else if (type === 'petAccessory') {
            if (typeof HubPet !== 'undefined') HubPet.equipAccessory(null);
            return;
        }
        p.updatedAt = Date.now();
        localStorage.setItem('otb_shared_profile', JSON.stringify(p));
    }

    function getEquipped() {
        const p = OTBEcosystem.getProfile();
        return p.equippedItems || { avatar: 'default', nameColor: 'gold', title: '', hubTheme: 'default' };
    }

    function getAvatarEmoji() {
        const eq = getEquipped();
        if (eq.avatar === 'default') return '😎';
        const item = CATALOG.find(i => i.id === eq.avatar);
        return item ? item.emoji : '😎';
    }

    function renderShop() {
        const profile = getProfile();
        const coins = profile.coins || 0;

        let html = `<div class="shop-header">
            <h2 class="shop-title">Coin Shop</h2>
            <div class="shop-coins">🪙 ${coins}</div>
        </div>`;

        for (const type of TYPE_ORDER) {
            const items = CATALOG.filter(i => i.type === type);
            html += `<div class="shop-category">
                <h3 class="shop-category-title">${TYPE_LABELS[type]}</h3>
                <div class="shop-items-grid">`;

            for (const item of items) {
                const owned = isPurchased(item.id);
                const equipped = isEquipped(item);
                const canAfford = coins >= item.price;

                let visual = '';
                if (item.type === 'avatar') visual = `<span class="shop-item-visual">${item.emoji}</span>`;
                else if (item.type === 'petAccessory') visual = `<span class="shop-item-visual">${item.emoji}</span>`;
                else if (item.type === 'nameColor') {
                    if (item.color === 'rainbow') visual = `<span class="shop-item-visual shop-rainbow-text">Aa</span>`;
                    else visual = `<span class="shop-item-visual" style="color:${item.color}">Aa</span>`;
                }
                else if (item.type === 'title') visual = `<span class="shop-item-visual shop-title-preview">${item.title}</span>`;
                else if (item.type === 'hubTheme') visual = `<span class="shop-item-visual">${item.preview}</span>`;

                let btnHtml = '';
                if (equipped) {
                    btnHtml = `<button class="shop-btn shop-btn-equipped" disabled>Equipped</button>`;
                } else if (owned) {
                    btnHtml = `<button class="shop-btn shop-btn-equip" data-item="${item.id}">Equip</button>`;
                } else if (canAfford) {
                    btnHtml = `<button class="shop-btn shop-btn-buy" data-item="${item.id}">🪙 ${item.price}</button>`;
                } else {
                    btnHtml = `<button class="shop-btn shop-btn-locked" disabled>🪙 ${item.price}</button>`;
                }

                html += `<div class="shop-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}">
                    ${visual}
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                    ${btnHtml}
                </div>`;
            }
            html += `</div></div>`;
        }

        return html;
    }

    function bindShopEvents(container) {
        container.querySelectorAll('.shop-btn-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.item;
                const item = CATALOG.find(i => i.id === itemId);
                const result = purchase(itemId);
                if (result.success) {
                    // Auto-equip on purchase
                    equip(itemId);
                    if (typeof HubSFX !== 'undefined') HubSFX.shopPurchase();
                    HubAnimations.coinSpend(item.price);
                    HubAnimations.showToast(`Bought ${item.name}!`, item.emoji || '🛍️');
                    // Re-render shop and refresh hub
                    if (typeof refreshShop === 'function') refreshShop();
                    if (typeof refreshHub === 'function') refreshHub();
                }
            });
        });

        container.querySelectorAll('.shop-btn-equip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof HubSFX !== 'undefined') HubSFX.click();
                const itemId = btn.dataset.item;
                equip(itemId);
                if (typeof refreshShop === 'function') refreshShop();
                if (typeof refreshHub === 'function') refreshHub();
            });
        });
    }

    return {
        CATALOG,
        renderShop,
        bindShopEvents,
        purchase,
        equip,
        unequip,
        getEquipped,
        getAvatarEmoji,
        isPurchased,
        isEquipped
    };
})();
