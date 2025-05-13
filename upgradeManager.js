// Upgrade system logic and UI

import * as C from './constants.js';

/** Handles leveling up and triggers the upgrade UI */
export function checkLevelUp(game) {
    if (game.experience >= game.experienceToNextLevel) {
        game.level++;
        game.experience -= game.experienceToNextLevel;
        game.experienceToNextLevel = Math.floor(game.experienceToNextLevel * C.XP_LEVEL_MULTIPLIER);

        // Commented out the level up message
        /*
        game.floatingTexts.push({
            value: `Level ${game.level}!`, // Use new level
            x: game.canvas.width / 2,
            y: game.canvas.height / 2,
            life: 2.0,
            size: 48,
            color: '#FFD700'
        });
        */

        // Add new enemy types based on level (This could maybe move elsewhere)
        // if (game.level === ?) game.enemyTypes.push('newType');

        // Show upgrade options
        showUpgradeOptions(game);
    }
}

/** Creates and displays the upgrade selection modal */
export function showUpgradeOptions(game) {
    game.pausedForUpgrade = true;
    if (document.pointerLockElement) document.exitPointerLock();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'upgrade-overlay'; // Assign ID for removal
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7); z-index: 999;
    `;
    document.body.appendChild(overlay);

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'upgrade-modal'; // Assign ID for removal
    modal.style.cssText = `
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9); padding: 40px; border-radius: 15px;
        color: white; text-align: center; z-index: 1000; min-width: 500px;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    `;

    const title = document.createElement('h2');
    title.textContent = `Level ${game.level}! Choose an Upgrade`; // Show current level
    title.style.cssText = `color: #FFD700; margin-bottom: 30px; font-size: 28px;`;
    modal.appendChild(title);

    // Get available upgrades
    let available = getAvailableUpgrades(game.level, game.upgrades, game.player.health, game.maxHealth);
    let selectedUpgrades = getRandomUpgrades(available, 3);

    // Special case for level 4 - ensure Double Shot is offered if not taken
    /*
    if (game.level === 4 && !game.upgrades.doubleShot && !selectedUpgrades.some(u => u.id === 'doubleShot')) {
        const doubleShotOption = available.find(u => u.id === 'doubleShot');
        if (doubleShotOption) {
            if (selectedUpgrades.length >= 3) selectedUpgrades.pop(); // Remove one random to make space
            selectedUpgrades.unshift(doubleShotOption); // Add double shot first
        }
    }
    */

    // Create buttons
    selectedUpgrades.forEach(upgrade => {
        const button = createUpgradeButton(upgrade, game); // Pass game instance
        modal.appendChild(button);
    });

    document.body.appendChild(modal);
}

/** Determines which upgrades are available based on game state */
function getAvailableUpgrades(level, currentUpgrades, playerHealth, playerMaxHealth) {
    const available = [];

    // Fire Rate
    available.push({
        id: 'fireRate',
        name: 'Fire Rate +20%',
        description: `Shoot faster (Current boost: ${currentUpgrades.fireRateBoost}%)`,
        color: '#2050A0'
    });

    // Max Health (Staggered availability)
    if ((level >= 5 && playerMaxHealth < 4) ||
        (level >= 10 && playerMaxHealth < 5) ||
        (level >= 15 && playerMaxHealth < 6)) {
        available.push({
            id: 'maxHealth',
            name: 'Max Health +1',
            description: `Increase max health (Current: ${playerMaxHealth})`,
            color: '#FF4136'
        });
    }

    // Heart Refill (Available if not full health)
    if (playerHealth < playerMaxHealth) {
        let heartsToRefill = Math.min(3, playerMaxHealth - playerHealth);
        available.push({
            id: 'heartRefill',
            name: `Heart Refill +${heartsToRefill}`,
            description: 'Restore lost hearts',
            color: '#FF6B6B'
        });
    }

    // Double Damage (Capped at 60%)
    if (currentUpgrades.doubleDamageChance < 0.6) {
        available.push({
            id: 'doubleDamage',
            name: 'Double Damage +15%',
            description: `Chance for double damage (Current: ${(currentUpgrades.doubleDamageChance * 100).toFixed(0)}%)`,
            color: '#7B68EE'
        });
    }

    // XP Multiplier
    available.push({
        id: 'xpMultiplier',
        name: 'XP Multiplier +0.2',
        description: `Increase XP gain (Current: ×${currentUpgrades.xpMultiplier.toFixed(1)})`,
        color: '#32CD32'
    });

    // Spread Shot (Available level 5+ if not taken)
    if (level >= 5 && !currentUpgrades.spreadShot) {
        available.push({
            id: 'spreadShot',
            name: 'Spread Shot',
            description: 'Fire angled shots every other round',
            color: '#00AA00'
        });
    }

    // Improved Handling (Always available, stacks)
    available.push({
        id: 'improvedHandling',
        name: 'Improved Handling +10%',
        description: `Increase speed & maneuverability (Current: +${currentUpgrades.handlingBoost}%)`,
        color: '#3498DB'
    });

    return available;
}

/** Selects a random subset of available upgrades */
function getRandomUpgrades(availableUpgrades, count) {
    if (availableUpgrades.length <= count) {
        return availableUpgrades;
    }
    const shuffled = [...availableUpgrades].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/** Creates a button element for an upgrade option */
function createUpgradeButton(upgrade, game) {
    const button = document.createElement('button');
    button.style.cssText = `
        display: block; width: 100%; padding: 20px; margin: 15px 0;
        background: ${upgrade.color}; border: none; border-radius: 10px;
        color: white; cursor: pointer; font-size: 20px;
        transition: transform 0.1s ease;
    `;
    button.innerHTML = `${upgrade.name}<br><small style="font-size: 16px;">${upgrade.description}</small>`;

    button.onmouseover = () => { button.style.transform = 'scale(1.03)'; };
    button.onmouseout = () => { button.style.transform = 'scale(1)'; };

    button.addEventListener('click', () => {
        applyUpgrade(upgrade.id, game);
        resumeGame(game);
    });
    return button;
}

/** Applies the selected upgrade to the game state */
function applyUpgrade(upgradeId, game) {
    console.log("Applying upgrade:", upgradeId);
    switch (upgradeId) {
        case 'fireRate':
            game.upgrades.fireRateBoost += 20;
            game.bulletInterval = game.upgrades.baseBulletInterval / (1 + game.upgrades.fireRateBoost / 100);
            break;
        /*
        case 'doubleShot':
            game.upgrades.doubleShot = true;
            break;
        */
        case 'maxHealth':
            game.maxHealth++;
            game.player.maxHealth = game.maxHealth; // Sync player maxHealth
            game.player.heal(1, game.maxHealth); // Give the heart immediately, up to new max
            break;
        case 'heartRefill':
            let heartsToRefill = Math.min(3, game.maxHealth - game.player.health);
            game.player.heal(heartsToRefill, game.maxHealth);
            break;
        case 'doubleDamage':
            game.upgrades.doubleDamageChance = Math.min(0.6, game.upgrades.doubleDamageChance + 0.15);
            break;
        case 'xpMultiplier':
            game.upgrades.xpMultiplier += 0.2;
            break;
        case 'spreadShot':
            game.upgrades.spreadShot = true;
            game.spreadShotCounter = 0; // Reset counter
            break;
        case 'improvedHandling':
            game.upgrades.improvedHandling = true;
            game.upgrades.handlingBoost += 10;
            // Apply boost to player stats
            game.player.maxSpeed *= 1.1;
            game.player.acceleration *= 1.1;
            game.player.deceleration *= 1.1;
            break;
    }
}

/** Resumes the game after an upgrade is selected */
function resumeGame(game) {
    const modal = document.getElementById('upgrade-modal');
    const overlay = document.getElementById('upgrade-overlay');
    if (modal) document.body.removeChild(modal);
    if (overlay) document.body.removeChild(overlay);

    game.pausedForUpgrade = false;
    game.gameStarted = true; // Ensure game stays marked as started
    game.canvas.style.display = 'block';
    game.menu.style.display = 'none';
    game.lastEnemySpawn = Date.now(); // Reset spawn timer slightly

    // Re-request pointer lock if canvas exists and lock is supported
    if (game.canvas && game.canvas.requestPointerLock) {
        game.canvas.requestPointerLock();
        game.canvas.style.cursor = 'none'; // Hide cursor immediately
    }
} 