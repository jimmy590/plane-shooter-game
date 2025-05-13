import * as C from './constants.js';

/**
 * Creates enemy bullet(s) based on the enemy type.
 * @param {object} enemy - The enemy object firing the bullet.
 * @returns {Array<object>} An array of new enemy bullet objects.
 */
export function createEnemyBullet(enemy) {
    const bullets = [];
    const baseBullet = {
        width: 4,
        height: 12,
        speed: 5,
        damage: 1, // Default damage
        color: '#FF4500' // Default color
    };

    if (enemy.type === 'boss') {
        baseBullet.color = '#FF00FF';
        // Boss shoots 3 bullets in a spread
        for (let angle = -15; angle <= 15; angle += 15) {
            const radians = angle * Math.PI / 180;
            bullets.push({
                ...baseBullet,
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                velocityX: Math.sin(radians) * baseBullet.speed,
                velocityY: Math.cos(radians) * baseBullet.speed
            });
        }
    } else if (enemy.type === 'tank') {
         // Tank turret projectile
         bullets.push({
            x: enemy.x,
            y: enemy.y,
            radius: 6,
            speed: 3,
            damage: 1,
            color: '#FF0000',
            isTurretProjectile: true,
            velocityX: Math.cos(enemy.turretAngle) * 3,
            velocityY: Math.sin(enemy.turretAngle) * 3
        });
    } else {
        // Default: Regular enemies shoot straight down
        bullets.push({
            ...baseBullet,
            x: enemy.x,
            y: enemy.y + enemy.height / 2,
            velocityX: 0,
            velocityY: baseBullet.speed
        });
    }
    return bullets;
}

/**
 * Creates basic enemy missile(s).
 * @param {object} enemy - The basic enemy object firing the missiles.
 * @returns {Array<object>} An array containing two missile objects.
 */
export function createBasicEnemyMissile(enemy) {
    const missiles = [];
    const missileWidth = 4;
    const missileHeight = 15;
    const baseMissile = {
        width: missileWidth,
        height: missileHeight,
        speed: 5,
        damage: 1,
        color: '#FF3300',
        angle: Math.PI / 2, // Pointing down
        smokeTimer: 0,
        isRevengeMissile: false,
        isBossMissile: false,
        isShieldRocket: false,
        isHoming: false, // Basic missiles don't home
        health: 1
    };

    // Left missile
    missiles.push({
        ...baseMissile,
        x: enemy.x - enemy.width / 4,
        y: enemy.y + enemy.height / 4,
        // Basic missiles move straight down (velocity can be added in update)
    });
    // Right missile
    missiles.push({
        ...baseMissile,
        x: enemy.x + enemy.width / 4,
        y: enemy.y + enemy.height / 4,
    });
    return missiles;
}

/**
 * Creates boss missile(s).
 * @param {object} boss - The boss object firing the missiles.
 * @returns {Array<object>} An array containing two missile objects.
 */
export function createBossMissile(boss) {
    const missiles = [];
    const missileWidth = 10;
    const missileHeight = 30;
    const baseMissile = {
        width: missileWidth,
        height: missileHeight,
        speed: C.BOSS_MISSILE_SPEED,
        damage: C.BOSS_MISSILE_DAMAGE,
        color: '#FF3300',
        smokeTimer: 0,
        isBossMissile: true,
        isRevengeMissile: false,
        isShieldRocket: false,
        health: 3,
        isHoming: true,
        homingStrength: C.BOSS_MISSILE_HOMING_STRENGTH_INITIAL,
        homingDecayRate: C.BOSS_MISSILE_HOMING_DECAY_RATE,
        minHomingStrength: C.BOSS_MISSILE_HOMING_STRENGTH_MIN,
        maxHomingDistance: 1500,
    };

    // Left
    missiles.push({
        ...baseMissile,
        x: boss.x - boss.width / 3,
        y: boss.y + boss.height / 10,
        angle: boss.leftTurretAngle,
        velocityX: Math.cos(boss.leftTurretAngle) * C.BOSS_MISSILE_SPEED,
        velocityY: Math.sin(boss.leftTurretAngle) * C.BOSS_MISSILE_SPEED,
    });
    // Right
    missiles.push({
        ...baseMissile,
        x: boss.x + boss.width / 3,
        y: boss.y + boss.height / 10,
        angle: boss.rightTurretAngle,
        velocityX: Math.cos(boss.rightTurretAngle) * C.BOSS_MISSILE_SPEED,
        velocityY: Math.sin(boss.rightTurretAngle) * C.BOSS_MISSILE_SPEED,
    });
    return missiles;
}

/**
 * Creates a shield rocket (cyan) from the boss.
 * @param {object} boss - The boss object.
 * @param {string} turretSide - 'left' or 'right'.
 * @returns {object} A single shield rocket object.
 */
export function createShieldRocket(boss, turretSide) {
    const missileWidth = 7;
    const missileHeight = 21;
    const missileSpeed = 1.5;

    let spawnX, spawnY, angle;
    if (turretSide === 'left') {
        spawnX = boss.x - boss.width / 3;
        spawnY = boss.y + boss.height / 10;
        angle = boss.leftTurretAngle;
    } else {
        spawnX = boss.x + boss.width / 3;
        spawnY = boss.y + boss.height / 10;
        angle = boss.rightTurretAngle;
    }

    return {
        x: spawnX, y: spawnY,
        width: missileWidth, height: missileHeight,
        speed: missileSpeed, damage: 1,
        color: '#00FFFF', // Cyan
        angle: angle,
        smokeTimer: 0,
        isBossMissile: false,
        isShieldRocket: true,
        isRevengeMissile: false,
        health: 1, // Destroyed in one hit by player?
        velocityX: Math.cos(angle) * missileSpeed,
        velocityY: Math.sin(angle) * missileSpeed,
        isHoming: false, // No homing
        homingStrength: 0, maxHomingDistance: 0,
    };
}

/**
 * Creates revenge missile (grey) when an escort dies.
 * @param {object} escort - The destroyed escort object.
 * @param {object} player - The player object (for initial angle).
 * @returns {object} A single revenge missile object.
 */
export function createRevengeMissile(escort, player) {
    // Calculate initial velocity direction towards player
    const dx = player.x - escort.x;
    const dy = player.y - escort.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dist > 0 ? dx / dist : 0;
    const dirY = dist > 0 ? dy / dist : 1; // Default downwards if dist is 0

    return {
        x: escort.x,
        y: escort.y,
        width: C.BOSS_ESCORT_REVENGE_MISSILE_WIDTH,
        height: C.BOSS_ESCORT_REVENGE_MISSILE_HEIGHT,
        color: C.BOSS_ESCORT_REVENGE_MISSILE_COLOR,
        damage: C.BOSS_ESCORT_REVENGE_MISSILE_DAMAGE,
        speed: C.BOSS_ESCORT_REVENGE_MISSILE_INITIAL_SPEED,
        vx: dirX * C.BOSS_ESCORT_REVENGE_MISSILE_INITIAL_SPEED, // Initial velocity still towards player
        vy: dirY * C.BOSS_ESCORT_REVENGE_MISSILE_INITIAL_SPEED,
        acceleration: C.BOSS_ESCORT_REVENGE_MISSILE_ACCELERATION,
        maxSpeed: C.BOSS_ESCORT_REVENGE_MISSILE_MAX_SPEED,
        homingFactor: C.BOSS_ESCORT_REVENGE_MISSILE_HOMING_FACTOR,
        rotation: 0, // Initial rotation set to 0 (will make sprite face down due to draw offset)
        type: 'revengeMissile', // Identify type
        isRevengeMissile: true, // Ensure this is set for collision logic
        targetX: player.x, // Store initial target for homing reference (optional)
        targetY: player.y
    };
}

/**
 * Creates a barrage of bullets from the boss.
 * @param {object} boss - The boss object.
 * @param {number} currentTime - The current timestamp (e.g., Date.now()) for scheduling.
 * @returns {{immediateBullets: Array<object>, scheduledProjectiles: Array<object>}} Object containing arrays of bullets to spawn now and projectiles to spawn later.
 */
export function createBossBarrage(boss, currentTime) {
    const immediateBullets = [];
    const scheduledProjectiles = [];

    const bulletOriginX = boss.x;
    const bulletOriginY = boss.y + boss.height / 2.2;
    const bulletCount = 6 + Math.floor(Math.random() * 4); // 6-9 bullets
    const spreadAngleDegrees = 180; // Wide spread
    const spreadAngleRadians = spreadAngleDegrees * (Math.PI / 180);

    // Calculate base direction based on player position relative to boss
    let baseDirection = Math.PI / 2; // Default downward
    if (boss.playerX !== undefined && boss.playerY !== undefined) {
        // Calculate angle to player
        const dx = boss.playerX - boss.x;
        const dy = boss.playerY - boss.y;
        const angleToPlayer = Math.atan2(dy, dx);
        
        // Only adjust if player is significantly to one side
        if (Math.abs(dx) > boss.width) {
            // Blend between straight down and angle to player
            // The further the player is to the side, the more we aim that way
            const sideFactor = Math.min(Math.abs(dx) / (boss.width * 2), 0.3); // Max 30% deviation
            const directionAdjustment = angleToPlayer - (Math.PI / 2); // Difference from straight down
            baseDirection = (Math.PI / 2) + (directionAdjustment * sideFactor);
        }
    }

    // Add random variation to base direction
    // Increased random variation to maintain unpredictability
    const randomVariation = (Math.random() - 0.5) * 0.4; // ±0.2 radians (±~11.5 degrees)
    baseDirection += randomVariation;

    const startAngle = baseDirection - (spreadAngleRadians / 2);

    // Roll once for the whole barrage
    let doubleAll = Math.random() < C.BOSS_BARRAGE_EXTRA_ROUND_CHANCE;

    for (let i = 0; i < bulletCount; i++) {
        // Add slight random variation to each bullet's angle within the spread
        const spreadVariation = (Math.random() - 0.5) * 0.1; // ±0.05 radians (±~2.9 degrees)
        const angle = startAngle + (bulletCount > 1 ? (spreadAngleRadians / (bulletCount - 1)) * i : 0) + spreadVariation;
        
        const mainBulletData = {
            x: bulletOriginX, y: bulletOriginY,
            width: 6, height: 12,
            speed: 6,
            damage: 1,
            color: '#FF0000',
            velocityX: Math.cos(angle) * 6,
            velocityY: Math.sin(angle) * 6,
            isBossBarrageBullet: true,
            isTurretProjectile: false,
        };
        if (doubleAll) {
            // Fire extra round immediately
            immediateBullets.push({ ...mainBulletData });
            // Schedule main round for this segment to fire slightly later
            scheduledProjectiles.push({
                projectile: { ...mainBulletData },
                spawnTime: currentTime + C.BOSS_BARRAGE_MAIN_ROUND_DELAY
            });
        } else {
            // Normal: fire immediately
            immediateBullets.push({ ...mainBulletData });
        }
    }
    return { immediateBullets, scheduledProjectiles };
}

/**
 * Generic function to spawn the correct projectile(s) based on the source enemy.
 * This acts as a dispatcher to the specific create functions.
 * @param {string} sourceType - The type of the enemy ('basic', 'tank', 'scout', 'boss', 'escort').
 * @param {object} sourceEnemy - The enemy object instance firing.
 * @param {object} player - The player object (needed for some targeting).
 * @returns {{bullets: Array<object>, missiles: Array<object>}} Object containing arrays of new bullets and missiles.
 */
export function spawnSpecificEnemyProjectile(sourceType, sourceEnemy, player) {
    let bullets = [];
    let missiles = [];

    switch (sourceType) {
        case 'basic':
            if (sourceEnemy.hasMissileLaunchers) {
                missiles = createBasicEnemyMissile(sourceEnemy);
            } else {
                // Basic enemies without missiles don't shoot in this setup?
                // Or add a default bullet shot?
                // bullets = createEnemyBullet(sourceEnemy); // Example if they shoot bullets
            }
            break;
        case 'tank':
            // Tank shoots turret projectiles (handled as bullets for now)
            bullets = createEnemyBullet(sourceEnemy); // createEnemyBullet handles tank type
            break;
        case 'scout':
            // Scouts don't shoot in this setup
            break;
        case 'boss':
            // Boss spawning logic is complex and handled within its update loop
            // calling specific creators like createBossMissile, createBossBarrage, createShieldRocket.
            // This generic spawner might not be called directly for 'boss' type.
            // We could add logic here if needed, e.g., for a default attack.
            console.warn('spawnSpecificEnemyProjectile called for boss - boss attacks are usually handled internally');
            break;
        case 'escort':
            // Escorts use the boss barrage for their standard attack
            const barrageResult = createBossBarrage(sourceEnemy, Date.now());
            bullets = barrageResult.immediateBullets;
            // (Optional: If you want to schedule projectiles for escorts, you would need to pass a callback or game instance here)
            break;
        case 'escortAttack':
            // Single projectile, already constructed in updateEscorts
            bullets = [sourceEnemy];
            break;
        default:
            console.warn(`Unknown enemy type for projectile spawn: ${sourceType}`);
    }

    return { bullets, missiles };
}

/**
 * Updates all enemy bullets.
 * @param {Array<object>} enemyBullets - Array of enemy bullet objects.
 * @param {object} player - Player object for collision checks.
 * @param {Function} triggerGameOver - Function to call if player health <= 0.
 * @param {Function} triggerVibration - Function to trigger screen shake.
 * @param {number} canvasWidth - Canvas width.
 * @param {number} canvasHeight - Canvas height.
 */
export function updateEnemyBullets(enemyBullets, player, triggerGameOver, triggerVibration, canvasWidth, canvasHeight) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];

        // Movement
        if (bullet.isTurretProjectile || bullet.velocityX !== undefined) {
            bullet.x += bullet.velocityX;
            bullet.y += bullet.velocityY;
        } else {
            bullet.y += bullet.speed; // Default downward
        }

        // Off-screen check
        const radius = bullet.isTurretProjectile ? bullet.radius : Math.max(bullet.width, bullet.height) / 2;
        if (bullet.y > canvasHeight + radius ||
            bullet.y < -radius ||
            bullet.x < -radius ||
            bullet.x > canvasWidth + radius) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Collision with player
        if (!player.invulnerable) {
            const dx = player.x - bullet.x;
            const dy = player.y - bullet.y;
            // Use simpler distance check for performance
            const collisionDistSq = bullet.isTurretProjectile
                ? Math.pow(player.width / 3 + bullet.radius, 2) // Tank bullet
                : Math.pow(player.width / 3 + bullet.width / 2, 2); // Other bullets (approx)
            const distSq = dx * dx + dy * dy;

            if (distSq < collisionDistSq) {
                // TODO: Create explosion effect if needed (pass particle function?)
                // if (bullet.isBossBarrageBullet) { addParticle(...) }

                if (player.takeDamage(bullet.damage || 1)) {
                    triggerVibration(); // Trigger vibration on hit
                    enemyBullets.splice(i, 1);
                    if (player.health <= 0) {
                        triggerGameOver();
                        return; // Exit early if game over
                    }
                    continue; // Bullet gone, player hit
                } else {
                     // Player was invulnerable, bullet still removed
                     enemyBullets.splice(i, 1);
                     continue;
                }
            }
        }
    }
}

/**
 * Updates all enemy missiles.
 * @param {Array<object>} enemyMissiles - Array of enemy missiles.
 * @param {object} player - Player object for collision and homing.
 * @param {Function} triggerGameOver - Function to call if player health <= 0.
 * @param {Function} triggerVibration - Function to trigger screen shake.
 * @param {Function} addParticle - Function to add particles to the main particle array.
 * @param {number} canvasWidth - Canvas width.
 * @param {number} canvasHeight - Canvas height.
 */
export function updateEnemyMissiles(enemyMissiles, player, triggerGameOver, triggerVibration, addParticle, canvasWidth, canvasHeight) {
    const now = Date.now();

    for (let i = enemyMissiles.length - 1; i >= 0; i--) {
        const missile = enemyMissiles[i];

        // --- Initialize vx and vy for the current frame ---
        // If created with velocityX/Y (like boss missiles), copy them to vx/vy if vx/vy are not already set.
        if (missile.vx === undefined && missile.velocityX !== undefined) {
            missile.vx = missile.velocityX;
        }
        if (missile.vy === undefined && missile.velocityY !== undefined) {
            missile.vy = missile.velocityY;
        }

        // If vx/vy are still undefined (e.g., for basic missiles created with only speed and angle), calculate them.
        if (missile.vx === undefined && missile.speed !== undefined) { // Assuming if vx is undef, vy also needs init from speed/angle
            const initialAngle = missile.angle || (Math.PI / 2); // Default to down
            missile.vx = Math.cos(initialAngle) * missile.speed;
            missile.vy = Math.sin(initialAngle) * missile.speed;
            if (missile.angle === undefined) missile.angle = initialAngle; // Store angle if not present
            if (missile.rotation === undefined) missile.rotation = initialAngle; // Store rotation if not present

        }
        
        // Ensure vx/vy are numbers after initialization attempts, default to 0 otherwise.
        missile.vx = missile.vx || 0;
        missile.vy = missile.vy || 0;
        if (missile.angle === undefined) missile.angle = Math.atan2(missile.vy, missile.vx); // Ensure angle exists
        if (missile.rotation === undefined) missile.rotation = missile.angle; // Ensure rotation exists


        // --- Specific missile type logic ---
        if (missile.type === 'revengeMissile') {
            const targetDx = player.x - missile.x;
            const targetDy = player.y - missile.y;
            const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
            const targetDirX = targetDist > 0 ? targetDx / targetDist : 0;
            const targetDirY = targetDist > 0 ? targetDy / targetDist : 1;

            const currentMovableSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
            const currentDirX = currentMovableSpeed > 0 ? missile.vx / currentMovableSpeed : 0;
            const currentDirY = currentMovableSpeed > 0 ? missile.vy / currentMovableSpeed : 1;

            let newDirX = currentDirX + (targetDirX - currentDirX) * missile.homingFactor;
            let newDirY = currentDirY + (targetDirY - currentDirY) * missile.homingFactor;
            const newDirMag = Math.sqrt(newDirX * newDirX + newDirY * newDirY);
            if (newDirMag > 0) {
                newDirX /= newDirMag;
                newDirY /= newDirMag;
            }
            
            missile.speed = (missile.speed || C.BOSS_ESCORT_REVENGE_MISSILE_INITIAL_SPEED) + missile.acceleration;

            missile.vx = newDirX * missile.speed;
            missile.vy = newDirY * missile.speed;
            missile.rotation = Math.atan2(missile.vy, missile.vx);

        } else if (missile.isHoming) { // For other homing missiles (e.g., boss missiles)
            let effectiveHomingStrength = missile.homingStrength; // Default to its set value

            // Apply decay if this missile is a boss missile and has decay properties
            if (missile.isBossMissile && missile.homingDecayRate !== undefined && missile.minHomingStrength !== undefined) {
                missile.homingStrength = Math.max(
                    missile.minHomingStrength,
                    missile.homingStrength - missile.homingDecayRate
                );
                effectiveHomingStrength = missile.homingStrength;
            }

            const dx = player.x - missile.x;
            const dy = player.y - missile.y;
            const angleToPlayer = Math.atan2(dy, dx);
            
            let currentOrientationAngle = missile.angle; // From initialization block
            let angleDiff = angleToPlayer - currentOrientationAngle;
            // Normalize angleDiff to be between -PI and PI
            while (angleDiff > Math.PI) angleDiff -= (2 * Math.PI);
            while (angleDiff < -Math.PI) angleDiff += (2 * Math.PI);

            const turnAmount = angleDiff * effectiveHomingStrength;
            let newAngle = currentOrientationAngle + turnAmount;

            // Calculate new velocity components
            missile.vx = Math.cos(newAngle) * missile.speed;
            missile.vy = Math.sin(newAngle) * missile.speed;
            missile.angle = newAngle;
            missile.rotation = newAngle;

        } else {
            // --- Straight Missile Logic (e.g., basic enemy missiles) ---
            // vx, vy should have been set by the initialization block from initial speed/angle.
            // If they need rotation based on their (constant) velocity:
            if (missile.rotation === missile.angle && (missile.vx !== 0 || missile.vy !== 0)) { // Only if rotation hasn't been specially set
                 missile.rotation = Math.atan2(missile.vy, missile.vx);
            }
        }

        // --- Common Update Logic ---
        missile.x += missile.vx;
        missile.y += missile.vy;

        // Add trail particles
        if (missile.type === 'revengeMissile' && Math.random() < 0.5) { 
            // Calculate offset for tail position based on rotation
            const spawnAngle = missile.rotation + Math.PI / 2; // Angle the sprite is drawn at
            const tailOffsetY = missile.height / 2;
            const offsetX = -tailOffsetY * Math.sin(spawnAngle);
            const offsetY = tailOffsetY * Math.cos(spawnAngle);
            
            addParticle({
                x: missile.x + offsetX, // Spawn at calculated tail X
                y: missile.y + offsetY, // Spawn at calculated tail Y
                vx: (Math.random() - 0.5) * 0.5 - missile.vx * 0.1, // Slowed opposite direction
                vy: (Math.random() - 0.5) * 0.5 - missile.vy * 0.1,
                size: 1 + Math.random() * 2,
                color: '#666666', // Darker gray trail
                life: 0.2 + Math.random() * 0.2
            });
        } else if (missile.isShieldRocket && missile.smokeTimer % 4 === 0) {
             createShieldRocketTrail(missile, addParticle); // Use correct name
         } else if (!missile.isShieldRocket && missile.smokeTimer % 3 === 0) {
            missile.smokeTimer = (missile.smokeTimer || 0) + 1; // Keep incrementing timer
            createMissileSmoke(missile, addParticle); // Use correct name
        }

        // Collision with Player
        if (!player.invulnerable) {
            const dx = player.x - missile.x;
            const dy = player.y - missile.y;
            const distSq = dx * dx + dy * dy;
            const collisionDistSq = Math.pow(player.width / 2 + missile.width / 2, 2); // Simple radius check

            if (distSq < collisionDistSq) {
                // TODO: Create small explosion effect (pass particle function)
                // addParticle(createSmallExplosion(missile.x, missile.y));

                if (player.takeDamage(missile.damage || 1)) {
                     triggerVibration();
                     enemyMissiles.splice(i, 1);
                     if (player.health <= 0) {
                        triggerGameOver();
                        return; // Exit early
                     }
                     continue; // Missile gone, player hit
                } else {
                    // Player was invulnerable, missile still removed
                    enemyMissiles.splice(i, 1);
                    continue;
                }
            }
        }

        // Off-screen check
        if (missile.y > canvasHeight + missile.height ||
            missile.y < -missile.height ||
            missile.x < -missile.width ||
            missile.x > canvasWidth + missile.width) {
            enemyMissiles.splice(i, 1);
        }
    }
}

/**
 * Draws all enemy bullets.
 * @param {Array<object>} enemyBullets - Array of enemy bullet objects.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawEnemyBullets(enemyBullets, ctx, vibration) {
    for (const bullet of enemyBullets) {
        // ADD CHECK for valid coordinates
        if (typeof bullet.x !== 'number' || typeof bullet.y !== 'number' || isNaN(bullet.x) || isNaN(bullet.y) || (bullet.x === 0 && bullet.y === 0)) {
            // console.warn("Skipping bullet with invalid/zero coordinates:", bullet);
            continue; // Skip drawing this bullet
        }
        ctx.fillStyle = bullet.color || '#FF4500';
        if (bullet.isTurretProjectile) {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            ctx.beginPath();
            ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // Draw centered rectangle
             ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
        }
    }
}

/**
 * Draws all enemy missiles.
 * @param {Array<object>} enemyMissiles - Array of enemy missile objects.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawEnemyMissiles(enemyMissiles, ctx, vibration) {
    enemyMissiles.forEach(missile => {
        // ADD CHECK for valid coordinates
        if (typeof missile.x !== 'number' || typeof missile.y !== 'number' || isNaN(missile.x) || isNaN(missile.y) || (missile.x === 0 && missile.y === 0)) {
            console.warn("Skipping missile with invalid/zero coordinates:", missile);
            return; // Skip drawing this missile (forEach context)
        }
        ctx.save();
        ctx.translate(missile.x + vibration.x, missile.y + vibration.y);
        
        // Use the pre-calculated rotation PLUS an offset to align the sprite
        // The sprite drawing assumes "up" is -Y. Velocity angle is atan2(vy, vx).
        // Rotate by velocity angle + 90 degrees to align -Y axis with velocity vector.
        ctx.rotate(missile.rotation + Math.PI / 2);
        
        let drawColor = missile.color || '#FF3300'; // Default
        if (missile.isShieldRocket) {
            drawColor = '#00FFFF';
        } else if (missile.isRevengeMissile) {
            drawColor = '#A0A0A0';
        } else if (missile.isBossMissile) {
             drawColor = '#FF5500';
             // Apply flash effect if hit recently (for boss missiles)
             if (missile.hitFlashTime && Date.now() - missile.hitFlashTime < 100) {
                drawColor = '#FFFFFF'; // White flash
            }
        }
        ctx.fillStyle = drawColor;

        // Draw missile body (centered)
        ctx.fillRect(-missile.width / 2, -missile.height / 2, missile.width, missile.height);

        // Draw missile nose cone (front, relative to centered body)
        ctx.beginPath();
        ctx.moveTo(0, -missile.height / 2 - missile.width * 0.5); // Nose tip is now along the local -Y axis
        ctx.lineTo(-missile.width / 2, -missile.height / 2);
        ctx.lineTo(missile.width / 2, -missile.height / 2);
        ctx.closePath();
        ctx.fill();

        // Draw fins at the back (relative to centered body)
        const finLength = missile.width * 1.5;
        const finBaseY = missile.height / 2; // Back end is now along the local +Y axis
        const finTipY = missile.height / 4;
        // Left fin
        ctx.beginPath();
        ctx.moveTo(-missile.width / 2, finBaseY);
        ctx.lineTo(-missile.width / 2 - finLength * 0.5, finTipY);
        ctx.lineTo(-missile.width / 2, finTipY);
        ctx.closePath();
        ctx.fill();
        // Right fin
        ctx.beginPath();
        ctx.moveTo(missile.width / 2, finBaseY);
        ctx.lineTo(missile.width / 2 + finLength * 0.5, finTipY);
        ctx.lineTo(missile.width / 2, finTipY);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

// --- Helper functions used by updateEnemyMissiles ---

/** Helper to create missile smoke particles */
function createMissileSmoke(missile, addParticle) {
    let angle;
    if (missile.velocityX !== undefined && missile.velocityY !== undefined && (missile.velocityX !== 0 || missile.velocityY !== 0)) {
        angle = Math.atan2(missile.velocityY, missile.velocityX);
    } else {
        angle = (missile.angle || Math.PI / 2) + Math.PI; // Pointing up from downward missile
    }
    const offsetX = -Math.cos(angle) * missile.height / 2;
    const offsetY = -Math.sin(angle) * missile.height / 2;
    const particleSize = missile.isBossMissile ? (3 + Math.random() * 3) : (2 + Math.random() * 2);

    addParticle({
        x: missile.x + offsetX,
        y: missile.y + offsetY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: particleSize,
        color: 'rgba(200, 200, 200, 0.8)',
        life: 0.5,
        shape: 'circle' // Ensure consistent shape if needed elsewhere
    });
}

/** Helper to create shield rocket trail particles */
function createShieldRocketTrail(missile, addParticle) {
    addParticle({
        x: missile.x,
        y: missile.y,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        size: 4 + Math.random() * 2,
        color: 'rgba(0, 200, 255, 0.7)',
        life: 6.0,
        isDamageTrail: true,
        damage: 1,
        shape: 'circle'
    });
}
 