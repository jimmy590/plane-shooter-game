import * as C from './constants.js';

/**
 * Creates a new health boost object.
 * @param {number} x - Spawn x coordinate.
 * @param {number} y - Spawn y coordinate.
 * @returns {object} The health boost object.
 */
export function createHealthBoost(x, y) {
    console.log("Creating Health Boost at:", x, y);
    return {
        x: x,
        y: y,
        width: C.HEALTH_BOOST_WIDTH,
        height: C.HEALTH_BOOST_HEIGHT,
        speed: C.HEALTH_BOOST_SPEED,
        collected: false,
        type: 'healthBoost' // Identify the type
    };
}

/**
 * Updates the position and checks for collection of health boosts.
 * @param {Array<object>} healthBoosts - The array of health boost objects.
 * @param {object} player - The player object.
 * @param {number} canvasHeight - Height of the game canvas.
 * @param {Function} addFloatingText - Function to add floating text.
 */
export function updateHealthBoosts(healthBoosts, player, canvasHeight, addFloatingText) {
    for (let i = healthBoosts.length - 1; i >= 0; i--) {
        const boost = healthBoosts[i];

        // Move health boost downward
        boost.y += boost.speed;

        // Check if health boost is off screen
        if (boost.y > canvasHeight + boost.height) {
            healthBoosts.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (!boost.collected) {
            const dx = player.x - boost.x;
            const dy = player.y - boost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < player.width / 2 + boost.width / 2) {
                // Allow healing up to player.maxHealth if available
                if (typeof player.maxHealth === 'number' ? player.health < player.maxHealth : player.health < C.PLAYER_INITIAL_HEALTH) {
                    player.heal(1, player.maxHealth);
                    boost.collected = true;
                    healthBoosts.splice(i, 1); // Remove after collection
                    addFloatingText({ // Use callback to add text
                        value: '+1 Heart',
                        x: boost.x,
                        y: boost.y,
                        life: 1.0,
                        color: '#FF0000'
                    });
                    continue; // Move to next boost
                }
            }
        }
    }
}

/**
 * Draws all active health boosts.
 * @param {Array<object>} healthBoosts - The array of health boost objects.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawHealthBoosts(healthBoosts, ctx) {
    for (const boost of healthBoosts) {
        if (!boost.collected) {
            ctx.save();
            ctx.translate(boost.x, boost.y);

            // Draw pulsing heart
            const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
            ctx.scale(pulse, pulse);

            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.beginPath();
            // Heart shape path
            ctx.moveTo(0, -boost.height / 4);
            ctx.bezierCurveTo(
                -boost.width / 2, -boost.height / 2,
                -boost.width / 2, boost.height / 4,
                0, boost.height / 2
            );
            ctx.bezierCurveTo(
                boost.width / 2, boost.height / 4,
                boost.width / 2, -boost.height / 2,
                0, -boost.height / 4
            );
            ctx.fill();

            ctx.restore();
        }
    }
} 