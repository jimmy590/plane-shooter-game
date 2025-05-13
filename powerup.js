// Powerup logic

import * as C from './constants.js';

/**
 * Spawns a random powerup object at the given coordinates.
 * @param {number} x - Spawn x coordinate.
 * @param {number} y - Spawn y coordinate.
 * @returns {object} The new powerup object.
 */
export function createPowerup(x, y) {
    // Always choose a random type now
    const type = C.POWERUP_TYPES[Math.floor(Math.random() * C.POWERUP_TYPES.length)];
    return {
        x,
        y,
        type,
        width: C.POWERUP_WIDTH,
        height: C.POWERUP_HEIGHT,
        speed: C.POWERUP_SPEED,
        collected: false
    };
}

/**
 * Updates falling powerups, checks for collection, and manages active powerup durations.
 * @param {Array<object>} powerups - Array of falling powerup objects.
 * @param {Array<object>} activePowerups - Array of currently active powerup effects.
 * @param {object} player - The player object.
 * @param {object} game - The main game object (for applying/deactivating effects).
 * @param {number} canvasHeight - Height of the game canvas.
 */
export function updatePowerups(powerups, activePowerups, player, game, canvasHeight) {
    // Update active powerups (duration)
    const now = Date.now();
    for (let i = activePowerups.length - 1; i >= 0; i--) {
        const powerup = activePowerups[i];
        if (now - powerup.startTime > C.POWERUP_DURATION) {
            deactivatePowerupEffect(powerup.type, game); // Use internal helper
            activePowerups.splice(i, 1);
        }
    }

    // Update falling powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.y += powerup.speed;

        // Check collection
        if (!powerup.collected) {
            const dx = player.x - powerup.x;
            const dy = player.y - powerup.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < player.width / 2 + powerup.width / 2) {
                activatePowerupEffect(powerup.type, game); // Use internal helper
                powerup.collected = true; // Mark as collected
                 // Add to active list
                 activePowerups.push({ type: powerup.type, startTime: Date.now() });
                 // Add floating text via game object method
                 game.floatingTexts.push({
                    value: `${powerup.type} activated!`,
                    x: player.x,
                    y: player.y - 50,
                    life: 1.0,
                    color: '#FFD700'
                });
                powerups.splice(i, 1); // Remove from falling list
                continue;
            }
        }

        // Remove if off screen
        if (powerup.y > canvasHeight + powerup.height) {
            powerups.splice(i, 1);
        }
    }
}

/**
 * Applies the effect of activating a specific powerup type.
 * Modifies the game state directly.
 * @param {string} type - The type of powerup.
 * @param {object} game - The main game object.
 */
function activatePowerupEffect(type, game) {
    console.log(`Activating powerup: ${type}`);
    switch (type) {
        case 'rapidFire':
            game.bulletInterval /= 2;
            break;
        case 'shield':
            game.player.invulnerable = true;
            game.player.lastHitTime = Date.now();
            break;
        case 'speedBoost':
            game.player.maxSpeed *= 1.5;
            break;
        case 'doubleXP':
            game.upgrades.xpMultiplier *= 2;
            break;
    }
}

/**
 * Reverts the effect of a specific powerup type when it expires.
 * Modifies the game state directly.
 * @param {string} type - The type of powerup.
 * @param {object} game - The main game object.
 */
function deactivatePowerupEffect(type, game) {
     console.log(`Deactivating powerup: ${type}`);
    switch (type) {
        case 'rapidFire':
            game.bulletInterval *= 2;
            break;
        case 'shield':
            if (!game.player.devModeInvulnerable) {
                 const timeSinceLastHit = Date.now() - game.player.lastHitTime;
                 if (timeSinceLastHit >= C.PLAYER_INVULNERABLE_TIME) {
                     game.player.invulnerable = false;
                 }
            }
            break;
        case 'speedBoost':
            game.player.maxSpeed /= 1.5;
            break;
        case 'doubleXP':
            game.upgrades.xpMultiplier /= 2;
            break;
    }
}

/**
 * Draws falling powerup icons.
 * @param {Array<object>} powerups - The array of falling powerup objects.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawPowerups(powerups, ctx) {
    for (const powerup of powerups) {
        if (!powerup.collected) {
            ctx.save();
            ctx.translate(powerup.x, powerup.y);
            ctx.fillStyle = '#0080FF'; // Unified blue color
            const size = 15; // Icon size for drawing

            // Draw powerup icon based on type using helper functions
            switch (powerup.type) {
                case 'rapidFire': drawRapidFireIcon(ctx, 0, 0, size); break;
                case 'shield': drawShieldIcon(ctx, 0, 0, size); break;
                case 'speedBoost': drawBootsIcon(ctx, 0, 0, size); break;
                case 'doubleXP': drawMultiplier(ctx, 0, 0, size); break;
            }
            ctx.restore();
        }
    }
}

// --- Internal Helper Drawing Functions --- (Used by drawPowerups and uiManager)
// These are not exported directly but used by exported functions in this module and potentially uiManager

export function drawRapidFireIcon(ctx, x, y, size) {
    ctx.fillRect(x - size / 2, y - size / 3, size / 3, size / 1.5);
    ctx.fillRect(x + size / 4, y - size / 3, size / 3, size / 1.5);
}

export function drawShieldIcon(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y - size / 2);
    ctx.lineTo(x + size, y + size / 2);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y + size / 2);
    ctx.lineTo(x - size, y - size / 2);
    ctx.closePath();
    ctx.fill();
}

export function drawBootsIcon(ctx, x, y, size) {
    // Simplified boots
    ctx.beginPath();
    // Left boot
    ctx.rect(x - size * 0.7, y - size / 2, size * 0.4, size);
    // Right boot
    ctx.rect(x + size * 0.3, y - size / 2, size * 0.4, size);
    ctx.fill();
}

export function drawMultiplier(ctx, x, y, size) {
    const fontSize = Math.max(10, size); // Ensure minimum font size
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×2', x, y);
}

// Example helper functions (not used by current powerups but maybe later)
export function drawStar(ctx, x, y, points, outer, inner) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / points - Math.PI / 2; // Adjust start angle
        const currentX = x + radius * Math.cos(angle);
        const currentY = y + radius * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(currentX, currentY);
        } else {
            ctx.lineTo(currentX, currentY);
        }
    }
    ctx.closePath();
    ctx.fill();
}

export function drawTriangle(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();
} 