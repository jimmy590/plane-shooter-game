// Player projectile logic

import * as C from './constants.js';

/**
 * Creates one or more bullet objects based on player state and upgrades.
 * @param {object} player - The player object.
 * @param {object} upgrades - The player's current upgrades.
 * @param {number} spreadShotCounter - Current state of the spread shot toggle.
 * @returns {Array<object>} An array of new bullet objects to be added.
 */
export function spawnPlayerBullet(player, upgrades, spreadShotCounter) {
    const newBullets = [];
    const baseBullet = {
        speed: C.PLAYER_BULLET_SPEED,
        width: C.PLAYER_BULLET_WIDTH,
        height: C.PLAYER_BULLET_HEIGHT,
        x: player.x,
        y: player.y,
        velocityX: 0,
        velocityY: -C.PLAYER_BULLET_SPEED,
    };

    if (upgrades.doubleShot) {
        newBullets.push({
            ...baseBullet,
            x: player.x - 7,
        });
        newBullets.push({
            ...baseBullet,
            x: player.x + 7,
        });
    } else {
        newBullets.push({ ...baseBullet });
    }

    if (upgrades.spreadShot && spreadShotCounter === 0) {
        const spreadAngle = 20 * (Math.PI / 180);

        newBullets.push({
            ...baseBullet,
            x: player.x,
            y: player.y,
            velocityX: -Math.sin(spreadAngle) * C.PLAYER_BULLET_SPEED,
            velocityY: -Math.cos(spreadAngle) * C.PLAYER_BULLET_SPEED,
        });
        newBullets.push({
            ...baseBullet,
            x: player.x,
            y: player.y,
            velocityX: Math.sin(spreadAngle) * C.PLAYER_BULLET_SPEED,
            velocityY: -Math.cos(spreadAngle) * C.PLAYER_BULLET_SPEED,
        });
    }

    return newBullets;
}

/**
 * Updates the positions of all player bullets and removes off-screen bullets.
 * @param {Array<object>} bullets - The array of player bullet objects.
 * @param {number} canvasHeight - Height of the game canvas.
 */
export function updatePlayerBullets(bullets, canvasHeight) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;

        if (bullet.y + bullet.height < 0) {
            bullets.splice(i, 1);
        }
    }
}

/**
 * Draws all player bullets.
 * @param {Array<object>} bullets - The array of player bullet objects.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawPlayerBullets(bullets, ctx, vibration = { x: 0, y: 0 }) {
    ctx.fillStyle = '#FFB700';
    for (const bullet of bullets) {
        ctx.fillRect(
            bullet.x - bullet.width / 2 + vibration.x,
            bullet.y - bullet.height / 2 + vibration.y,
            bullet.width,
            bullet.height
        );
    }
}

// REMOVE Placeholder functions
// export function updateBullets(bullets) {
//     // Placeholder
// }
// export function drawBullets(bullets, ctx) {
//     // Placeholder
// } 