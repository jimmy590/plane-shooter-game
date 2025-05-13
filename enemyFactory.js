// Enemy Factory

import * as C from './constants.js';

/**
 * Creates an enemy object of a specific type.
 * @param {string} type - The type of enemy ('basic', 'scout', 'tank').
 * @param {object} canvas - The game canvas object (for width).
 * @param {number} gameTime - The current game time in seconds.
 * @returns {object} The newly created enemy object.
 */
export function createEnemy(type, canvas, gameTime = 0) {
    let enemyBase = {
        // Default x, will be overridden for scout
        x: Math.random() * (canvas.width - 30) + 15,
        y: -30, // Start off-screen
        type: type,
        hitFlashTime: 0,
        active: true, // Explicitly set active to true
        // Default size/properties, often overwritten
        width: 75,
        height: 62,
        speed: C.BASE_ENEMY_SPEED,
        // Properties needed for specific enemy types later
        hasMissileLaunchers: false,
        hasTurret: false,
        turretAngle: 0,
        lastTurretShot: 0,
        lastMissileTime: 0,
        // Add other potential base properties if needed
    };

    let enemySpecifics = {};
    switch (type) {
        case 'scout': {
            const width = 50;
            const amplitude = 5; // Match the movement amplitude in updateRegularEnemy
            const minX = width / 2 + amplitude;
            const maxX = canvas.width - width / 2 - amplitude;
            enemyBase.x = Math.random() * (maxX - minX) + minX;
            let scoutHitPoints = 3;
            if (gameTime >= 90) scoutHitPoints = 4;
            enemySpecifics = {
                speed: 2.0,
                color: '#00FF00',
                hitPoints: scoutHitPoints,
                width: width,
                height: 40,
                experienceValue: C.XP_SCOUT,
                active: true // Ensure active is set for each type
            };
            break;
        }
        case 'tank':
            let tankHitPoints = 8;
            if (gameTime >= 90) tankHitPoints = 12;
            else if (gameTime >= 75) tankHitPoints = 11;
            else if (gameTime >= 60) tankHitPoints = 10;
            else if (gameTime >= 45) tankHitPoints = 9;
            enemySpecifics = {
                speed: 1,
                color: '#606060',
                hitPoints: tankHitPoints,
                width: 100,
                height: 80,
                experienceValue: C.XP_TANK,
                hasTurret: true,
                turretAngle: 0,
                lastTurretShot: 0,
                turretShootInterval: 2500, // ms
                active: true // Ensure active is set for each type
            };
            break;
        case 'basic': // Default case now explicitly basic
        default: {
            const hasMissiles = Math.random() < 0.5;
            let hitPoints = 3;
            if (gameTime >= 90) hitPoints = 5;
            else if (gameTime >= 30) hitPoints = 4;
            enemySpecifics = {
                speed: C.BASE_ENEMY_SPEED,
                color: '#808080',
                hitPoints: hitPoints,
                width: 75, // Default basic size
                height: 62,
                experienceValue: hasMissiles ? C.XP_BASIC_MISSILE : C.XP_BASIC,
                hasMissileLaunchers: hasMissiles,
                lastMissileTime: 0,
                missileInterval: 2000, // ms
                active: true // Ensure active is set for each type
            };
            break;
        }
    }

    // Combine base and specific properties
    return { ...enemyBase, ...enemySpecifics };
}

/**
 * Updates the state of a regular (non-boss) enemy.
 * Handles movement and potentially triggers attacks.
 * @param {object} enemy - The enemy object to update.
 * @param {object} player - The player object (for targeting).
 * @param {number} canvasHeight - Height of the canvas for bounds checking.
 * @param {Function} addEnemyProjectile - Callback to add bullets/missiles to the main game arrays.
 * @returns {boolean} True if the enemy should be removed (e.g., went off screen).
 */
export function updateRegularEnemy(enemy, player, canvasHeight, addEnemyProjectile) {
    enemy.y += enemy.speed;

    // Movement patterns
    if (enemy.type === 'scout') {
        enemy.x += Math.sin(enemy.y * 0.005) * 5;
    }

    // Attacks
    const now = Date.now();
    if (enemy.type === 'tank' && enemy.hasTurret) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        enemy.turretAngle = Math.atan2(dy, dx);
        if (now - (enemy.lastTurretShot || 0) > enemy.turretShootInterval) {
            // Add turret projectile(s) using the callback
            addEnemyProjectile(enemy.type, enemy); // Pass type and enemy data
            enemy.lastTurretShot = now;
        }
    }
    if (enemy.type === 'basic' && enemy.hasMissileLaunchers) {
        if (now - (enemy.lastMissileTime || 0) > enemy.missileInterval) {
             // Add missile projectile(s) using the callback
            addEnemyProjectile(enemy.type, enemy); // Pass type and enemy data
            enemy.lastMissileTime = now;
        }
    }

    // Check if off screen
    return enemy.y > canvasHeight + enemy.height;
}

/**
 * Draws a regular (non-boss) enemy.
 * @param {object} enemy - The enemy object to draw.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {object} vibration - Current screen vibration offsets.
 * @param {boolean} debugMode - Whether debug mode is enabled.
 * @param {Function} getWingPointsUtil - Utility function to get wing points.
 */
export function drawRegularEnemy(enemy, ctx, vibration, debugMode, getWingPointsUtil) {
    ctx.save();
    ctx.translate(enemy.x + vibration.x, enemy.y + vibration.y);
    // Use original rotation from backup
    ctx.rotate(Math.PI + vibration.rot);

    // Original hit flash check
    if (Date.now() - enemy.hitFlashTime < 100) {
        ctx.fillStyle = '#FFFFFF';
    } else {
        // Use enemy.color, default to #808080 if undefined (matches original basic enemy color)
        ctx.fillStyle = enemy.color || '#808080';
    }

    // --- Start Original Enemy Shape Drawing (from backup) ---
    // Draw main body (fuselage)
    ctx.beginPath();
    ctx.moveTo(0, -enemy.height/2); // Nose
    ctx.lineTo(-enemy.width/16, -enemy.height/2.2);
    ctx.lineTo(-enemy.width/16, enemy.height/2.2);
    ctx.lineTo(0, enemy.height/2); // Tail point
    ctx.lineTo(enemy.width/16, enemy.height/2.2);
    ctx.lineTo(enemy.width/16, -enemy.height/2.2);
    ctx.closePath();
    ctx.fill();

    // Draw left wing
    ctx.beginPath();
    ctx.moveTo(-enemy.width/16, -enemy.height/5); // Inner connection point
    ctx.bezierCurveTo( // Smooth curve for wing shape
        -enemy.width/4, -enemy.height/5,
        -enemy.width/2, -enemy.height/8,
        -enemy.width/2, 0 // Outer point
    );
    ctx.bezierCurveTo( // Smooth curve for wing shape
        -enemy.width/2, enemy.height/16,
        -enemy.width/4, enemy.height/12,
        -enemy.width/16, enemy.height/8 // Inner connection point
    );
    ctx.closePath();
    ctx.fill();

    // Draw right wing (symmetric to left)
    ctx.beginPath();
    ctx.moveTo(enemy.width/16, -enemy.height/5);
    ctx.bezierCurveTo(
        enemy.width/4, -enemy.height/5,
        enemy.width/2, -enemy.height/8,
        enemy.width/2, 0
    );
    ctx.bezierCurveTo(
        enemy.width/2, enemy.height/16,
        enemy.width/4, enemy.height/12,
        enemy.width/16, enemy.height/8
    );
    ctx.closePath();
    ctx.fill();

    // Draw tail stabilizers
    ctx.beginPath();
    ctx.moveTo(-enemy.width/16, enemy.height/3);
    ctx.lineTo(-enemy.width/4, enemy.height/2);
    ctx.lineTo(-enemy.width/16, enemy.height/2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(enemy.width/16, enemy.height/3);
    ctx.lineTo(enemy.width/4, enemy.height/2);
    ctx.lineTo(enemy.width/16, enemy.height/2);
    ctx.closePath();
    ctx.fill();

    // Draw cockpit
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.ellipse(0, -enemy.height/6, enemy.width/20, enemy.height/8, 0, 0, Math.PI * 2);
    ctx.fill();
    // --- End Original Enemy Shape Drawing ---

    // Draw missile launchers if present (for basic enemies)
    if (enemy.type === 'basic' && enemy.hasMissileLaunchers) {
        ctx.save();
        ctx.fillStyle = '#666666'; // Slightly darker gray for missile launcher
        // Missile launchers should be at the exact positions where missiles are fired, but visually on the wing (near the top edge)
        const launcherW = enemy.width / 10;
        const launcherH = enemy.height / 7;
        // Move launchers even higher: use y offset very close to the top of the wing
        const yWing = enemy.height / 16;
        // Left launcher
        ctx.fillRect(-enemy.width/4 - launcherW/2, yWing - launcherH/2, launcherW, launcherH);
        // Right launcher
        ctx.fillRect(enemy.width/4 - launcherW/2, yWing - launcherH/2, launcherW, launcherH);
        ctx.restore();
    }

    // Draw specific features (like tank turret) - Keep existing logic for this
    if (enemy.type === 'tank' && enemy.hasTurret) {
        ctx.save();
        ctx.rotate(enemy.turretAngle + Math.PI); // Rotate turret relative to enemy
        ctx.fillStyle = '#404040'; // Turret base
        ctx.beginPath();
        ctx.arc(0, 0, enemy.width / 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(0, -enemy.width / 30, enemy.height / 3, enemy.width / 15); // Barrel
        ctx.fillStyle = '#333333'; // Barrel tip
        ctx.fillRect(enemy.height / 3, -enemy.width / 25, enemy.height / 10, enemy.width / 12.5);
        ctx.restore();
    }

    // Debug Wing Points - Keep existing (simplified) logic for this
    if (debugMode) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        // Draw all hitbox rectangles
        const hitboxes = getEnemyHitboxes(enemy);
        for (const rect of hitboxes) {
            ctx.strokeRect(
                rect.left - enemy.x,
                rect.top - enemy.y,
                rect.right - rect.left,
                rect.bottom - rect.top
            );
        }
        ctx.restore();
    }

    ctx.restore();
}

/**
 * Returns an array of hitbox rectangles for the given enemy.
 * Each rectangle is {left, right, top, bottom} in world coordinates.
 */
export function getEnemyHitboxes(enemy) {
    const { x, y, width, height, type } = enemy;
    const hitboxes = [];
    // Main body (fuselage)
    hitboxes.push({
        left: x - width * 0.15,
        right: x + width * 0.15,
        top: y - height / 2,
        bottom: y + height / 2
    });
    // Left wing
    hitboxes.push({
        left: x - width / 2,
        right: x - width * 0.15,
        top: y - height * 0.18,
        bottom: y + height * 0.18
    });
    // Right wing
    hitboxes.push({
        left: x + width * 0.15,
        right: x + width / 2,
        top: y - height * 0.18,
        bottom: y + height * 0.18
    });
    // Optionally, for tank: add a slightly larger body
    if (type === 'tank') {
        hitboxes.push({
            left: x - width * 0.20,
            right: x + width * 0.20,
            top: y - height * 0.35,
            bottom: y + height * 0.35
        });
    }
    return hitboxes;
}

// Add functions to update/draw specific enemy types if needed 