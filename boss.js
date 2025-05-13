// Boss logic

import * as C from './constants.js';
// Import projectile creation functions needed by boss/escorts
import { createBossMissile, createShieldRocket, createRevengeMissile, createBossBarrage } from './enemyProjectile.js';
// Import particle creation functions
import { createBossEngineParticles, createEscortExplosion, createShieldImpactEffect, createShieldBreakEffect, createSmallExplosion, createMissileEscortCollisionExplosion } from './particle.js';
// Import getWingPoints if needed for boss drawing
import { getWingPoints } from './utils.js';

/**
 * Creates the main boss object with all its initial properties.
 * @param {object} canvas - The game canvas object.
 * @returns {object} The boss enemy object.
 */
export function createCustomBoss(canvas) {
    const boss = {
        x: canvas.width / 2,
        y: -120, // Start above screen
        width: 280, height: 300,
        type: 'customBoss',
        speed: C.BOSS_ENTRANCE_SPEED, // Use entrance speed initially
        color: '#9c9c9c', outlineColor: '#2c2c2c',
        hitPoints: C.BOSS_MAX_HEALTH,
        maxHitPoints: C.BOSS_MAX_HEALTH,
        experienceValue: C.XP_BOSS,
        targetY: C.BOSS_TARGET_Y,
        hitFlashTime: 0,
        invincibleDuringEntrance: true, // RESTORED: Boss starts invincible
        healthBarAnimationStartTime: Date.now(),
        healthBarFillDuration: 3000,
        displayedHealthPercentage: 0,
        active: true, // Ensure boss starts active
        // Movement
        waveOffset: 0,
        baseWaveSpeed: C.BOSS_BASE_WAVE_SPEED,
        waveSpeed: C.BOSS_BASE_WAVE_SPEED,
        targetWaveSpeed: C.BOSS_BASE_WAVE_SPEED,
        speedVariationTimer: 0,
        speedVariationInterval: C.BOSS_SPEED_VARIATION_INTERVAL,
        baseWaveAmplitude: C.BOSS_BASE_WAVE_AMPLITUDE,
        waveAmplitude: C.BOSS_BASE_WAVE_AMPLITUDE,
        targetWaveAmplitude: C.BOSS_BASE_WAVE_AMPLITUDE,
        amplitudeVariationTimer: 0,
        amplitudeVariationInterval: C.BOSS_AMPLITUDE_VARIATION_INTERVAL,
        minAmplitude: C.BOSS_MIN_AMPLITUDE,
        maxAmplitude: C.BOSS_MAX_AMPLITUDE,
        transitionSpeed: C.BOSS_TRANSITION_SPEED,
        lastWaveOffsetSign: null,
        // Turrets
        leftTurretAngle: 0, rightTurretAngle: 0,
        // Attacks
        lastMissileTime: 0,
        missileInterval: C.BOSS_MISSILE_INTERVAL,
        missileSpeed: C.BOSS_MISSILE_SPEED,
        missileDamage: C.BOSS_MISSILE_DAMAGE,
        lastBarrageTime: 0,
        barrageInterval: C.BOSS_BARRAGE_INTERVAL_MIN + Math.random() * (C.BOSS_BARRAGE_INTERVAL_MAX - C.BOSS_BARRAGE_INTERVAL_MIN),
        burstCount: 0,
        maxBurstCount: Math.floor(C.BOSS_BURST_COUNT_MIN + Math.random() * (C.BOSS_BURST_COUNT_MAX - C.BOSS_BURST_COUNT_MIN + 1)),
        burstActive: false,
        lastBurstTime: 0,
        burstCooldown: C.BOSS_BURST_COOLDOWN,
        finalPhaseBurstCooldown: C.BOSS_FINAL_PHASE_BURST_COOLDOWN,
        laserAttackActive: false,
        isPreparingLaser: false,
        laserWarningStartTime: 0,
        laserWarningDuration: C.BOSS_LASER_WARNING_DURATION,
        laserFiringStartTime: 0,
        laserFiringDuration: C.BOSS_LASER_FIRING_DURATION,
        laserDamage: 2,
        laserAttackCooldown: null,
        // Powerup Drops
        lastHealthThreshold: C.BOSS_MAX_HEALTH,
        healthThresholdStep: 20, // Keep hardcoded? Or add constant?
        powerupDropChance: C.POWERUP_DROP_CHANCE_BASE,
        // Shield Phase
        shieldPhaseActivated: false,
        inShieldPhase: false,
        isShieldVisible: false,
        movingToCenter: false,
        temporaryInvincible: false,
        shieldHealth: C.BOSS_SHIELD_HEALTH,
        maxShieldHealth: C.BOSS_SHIELD_HEALTH,
        shieldPulseOffset: 0,
        shieldAlpha: 0.3,
        shieldAttackTimer: null,
        shieldAttackNextTurret: 'left',
        isShieldBreaking: false,
        shieldBreakStartTime: 0,
        shieldBreakDuration: C.BOSS_SHIELD_BREAK_DURATION,
        shieldCrackLevel: 0,
        shieldCrackPaths: [],
        postShieldPhase: false,
        // Final Phase Missiles
        finalMissilePhaseActive: false,
        finalMissileNextTurret: 'left',
        fireBlueMissileAfterDelay: false,
        barrageEndTime: 0,
        // Engine Particles
        lastEngineParticleTime: 0,
        engineParticleInterval: 30, // Keep hardcoded?
        // Escort properties are managed by the Game class via bossEscorts array
    };
    return boss;
}

/**
 * Updates the boss state, including movement, attacks, and phase transitions.
 * @param {object} boss - The boss object.
 * @param {object} player - The player object.
 * @param {object} game - The main game instance (for accessing projectiles, particles, state flags).
 */
export function updateBoss(boss, player, game) {
    const now = Date.now();
    const canvas = game.canvas; // Need canvas dimensions

    // --- Phase Transitions ---
    handleBossPhaseTransitions(boss, now, game);

    // --- Movement --- (Depends on phase)
    handleBossMovement(boss, now, canvas);

    // --- Aim Turrets --- (Needed for attacks)
    aimBossTurrets(boss, player);

    // --- Attacks --- (Depends on phase)
    if (!boss.invincibleDuringEntrance && !boss.inShieldPhase) {
        handleBossAttacks(boss, now, game);
    }
     // Shield phase specific attacks (rockets)
    if (boss.inShieldPhase && !boss.isShieldBreaking) {
         handleBossShieldAttacks(boss, now, game);
    }

    // --- Engine Particles ---
    if (now - boss.lastEngineParticleTime > boss.engineParticleInterval) {
        game.particles.push(...createBossEngineParticles(boss));
        boss.lastEngineParticleTime = now;
    }
}

// --- Internal Helper Functions for Boss Update --- //

function handleBossPhaseTransitions(boss, now, game) {
    // Shield Activation
    if (!boss.shieldPhaseActivated && boss.hitPoints <= C.BOSS_SHIELD_HEALTH_THRESHOLD) {
        console.log("Shield phase activating...");
        boss.shieldPhaseActivated = true;
        boss.movingToCenter = true;
        boss.originalWaveAmplitude = boss.waveAmplitude;
        boss.targetWaveAmplitude = 0;
        boss.originalY = boss.y;
        boss.targetY = C.BOSS_TARGET_Y;
        // Reset wave offset sign tracking for post-shield phase
        boss.lastWaveOffsetSign = null;
    }

    // Pre-Shield Temporary Invincibility
    if (boss.hitPoints <= C.BOSS_SHIELD_INVINCIBLE_THRESHOLD && !boss.inShieldPhase && !boss.postShieldPhase && !boss.shieldPhaseActivated) {
        boss.temporaryInvincible = true;
    }

    // Shield Breaking Animation Finish
    if (boss.isShieldBreaking && (now - boss.shieldBreakStartTime > boss.shieldBreakDuration)) {
        console.log("Shield breaking finished.");
        boss.isShieldVisible = false;
        boss.isShieldBreaking = false;
        boss.inShieldPhase = false;
        boss.postShieldPhase = true;
        boss.finalMissilePhaseActive = true;
        boss.finalMissileNextTurret = 'left';
        // Set post-shield speed
        boss.waveSpeed = C.BOSS_BASE_WAVE_SPEED * 1.5;
        boss.targetWaveSpeed = boss.waveSpeed;
        // Deactivate laser if it was active
        if (boss.laserAttackActive) {
            boss.laserAttackActive = false;
            boss.isPreparingLaser = false;
            boss.laserAttackCooldown = null;
        }
    }
}

function handleBossMovement(boss, now, canvas) {
    // Entrance Movement
    if (boss.y < boss.targetY) {
        boss.y += boss.speed;
        // Entrance Invincibility & Health Bar Fill
        if (boss.invincibleDuringEntrance) {
            const elapsedTime = now - boss.healthBarAnimationStartTime;
            const progress = Math.min(elapsedTime / boss.healthBarFillDuration, 1);
            boss.displayedHealthPercentage = progress; // Used by UI manager
            // If reached target Y, turn off invincibility
            if (boss.y >= boss.targetY) {
                boss.invincibleDuringEntrance = false;
                boss.displayedHealthPercentage = 1.0; // Ensure bar is full
                boss.speed = C.BOSS_SPEED; // Switch to normal speed after entrance
            }
        }
        return; // No other movement during entrance
    }

    // Moving to Center for Shield Phase
    if (boss.movingToCenter) {
        // Interpolate amplitude and Y position
        boss.waveAmplitude += (boss.targetWaveAmplitude - boss.waveAmplitude) * 0.03;
        if (Math.abs(boss.y - boss.targetY) > 2) {
             const yDir = boss.targetY > boss.y ? 1 : -1;
             const yDist = Math.abs(boss.targetY - boss.y);
             const moveSpeed = Math.max(0.5, Math.min(2, yDist / 20));
             boss.y += yDir * moveSpeed;
        } else {
             boss.y = boss.targetY;
        }
        // Update X based on shrinking amplitude
        const safeAmplitude = Math.min(boss.waveAmplitude, canvas.width / 2 - boss.width / 2 - 10);
        boss.x = canvas.width / 2 + Math.sin(boss.waveOffset) * safeAmplitude; // Use current wave offset

        // Check if centered
        if (Math.abs(boss.x - canvas.width / 2) < 8 &&
            Math.abs(boss.waveAmplitude) < 8 &&
            Math.abs(boss.y - boss.targetY) < 8) {
            // Snap to center, activate shield phase fully
            boss.x = canvas.width / 2;
            boss.y = boss.targetY;
            boss.waveAmplitude = 0;
            boss.movingToCenter = false;
            boss.inShieldPhase = true;
            boss.isShieldVisible = true;
            boss.shieldAlpha = 0.3;
            boss.shieldPulseOffset = 0;
            boss.shieldAttackTimer = now + C.BOSS_SHIELD_ROCKET_INTERVAL_MIN + Math.random() * (C.BOSS_SHIELD_ROCKET_INTERVAL_MAX - C.BOSS_SHIELD_ROCKET_INTERVAL_MIN); // Start timer
            boss.shieldAttackNextTurret = 'left';
            boss.temporaryInvincible = false; // Now fully shielded
            boss.shieldCrackLevel = 0; // Ensure cracks are reset
            boss.shieldCrackPaths = [];
            console.log("Boss centered and shield activated!");
            // Deactivate laser if active
            if (boss.laserAttackActive) {
                boss.laserAttackActive = false;
                boss.isPreparingLaser = false;
                boss.laserAttackCooldown = null;
            }
        }
        return; // No other movement while moving to center
    }

    // Normal / Post-Shield Sine Wave Movement
    if (!boss.inShieldPhase || boss.isShieldBreaking) {  // Allow movement during shield break animation
        // Update Speed Variation (Pre-Shield Only)
        if (!boss.postShieldPhase && (now - boss.speedVariationTimer > boss.speedVariationInterval)) {
            // Smoother speed transition by gradually changing target speed
            const currentSpeed = boss.waveSpeed;
            const minSpeed = boss.baseWaveSpeed * 0.5;
            const maxSpeed = boss.baseWaveSpeed * 1.5;
            const speedRange = maxSpeed - minSpeed;
            
            // Calculate new target speed with smoother transition
            const targetSpeedFactor = 0.5 + Math.random() * 1.0; // 0.5 to 1.5
            const newTargetSpeed = minSpeed + (speedRange * targetSpeedFactor);
            
            // Gradually adjust current speed towards target
            boss.targetWaveSpeed = newTargetSpeed;
            boss.speedVariationTimer = now;
        }
        
        // Update Amplitude Variation (Timer Pre-Shield, Crossing Post-Shield)
        if (!boss.postShieldPhase) {
            if (now - boss.amplitudeVariationTimer > boss.amplitudeVariationInterval) {
                // Smoother amplitude transition
                const currentAmplitude = boss.waveAmplitude;
                const amplitudeRange = boss.maxAmplitude - boss.minAmplitude;
                const targetAmplitudeFactor = Math.random();
                const newTargetAmplitude = boss.minAmplitude + (amplitudeRange * targetAmplitudeFactor);
                
                boss.targetWaveAmplitude = newTargetAmplitude;
                boss.amplitudeVariationTimer = now;
            }
        } else {
            // Post-shield: Change amplitude on crossing center
            const currentSin = Math.sin(boss.waveOffset);
            const currentSign = Math.sign(currentSin);
            if (boss.lastWaveOffsetSign === null) boss.lastWaveOffsetSign = currentSign !== 0 ? currentSign : 1;
            if (currentSign !== 0 && currentSign !== boss.lastWaveOffsetSign) {
                // Smoother amplitude transition for post-shield phase
                const amplitudeRange = boss.maxAmplitude - boss.minAmplitude;
                const targetAmplitudeFactor = Math.random();
                const newTargetAmplitude = boss.minAmplitude + (amplitudeRange * targetAmplitudeFactor);
                
                boss.targetWaveAmplitude = newTargetAmplitude;
                boss.lastWaveOffsetSign = currentSign;
            } else if (currentSign !== 0) {
                boss.lastWaveOffsetSign = currentSign; // Update sign even if no change
            }
        }

        // Smoother interpolation towards target speed/amplitude
        const transitionFactor = 0.02; // Reduced from 0.03 for smoother transitions
        boss.waveSpeed += (boss.targetWaveSpeed - boss.waveSpeed) * transitionFactor;
        boss.waveAmplitude += (boss.targetWaveAmplitude - boss.waveAmplitude) * transitionFactor;

        // Apply sine wave movement
        boss.waveOffset += boss.waveSpeed;
        const safeAmplitude = Math.min(boss.waveAmplitude, canvas.width / 2 - boss.width / 2 - 10);
        boss.x = canvas.width / 2 + Math.sin(boss.waveOffset) * safeAmplitude;
    }

    // Shield Pulse Animation (If shield is visible, including breaking)
     if (boss.isShieldVisible) {
         boss.shieldAlpha = 0.3 + Math.sin(boss.shieldPulseOffset) * 0.2;
         boss.shieldPulseOffset += 0.05;
     }
}

function aimBossTurrets(boss, player) {
    const leftTurretX = boss.x - boss.width / 3;
    const rightTurretX = boss.x + boss.width / 3;
    const turretsY = boss.y + boss.height / 10;
    boss.leftTurretAngle = Math.atan2(player.y - turretsY, player.x - leftTurretX);
    boss.rightTurretAngle = Math.atan2(player.y - turretsY, player.x - rightTurretX);
}

function handleBossAttacks(boss, now, game) {
    // --- Laser Attack (Pre-Shield Only) ---
    if (!boss.postShieldPhase) {
        if (boss.hitPoints <= C.BOSS_LASER_HEALTH_THRESHOLD && !boss.laserAttackActive && !boss.laserAttackCooldown) {
            // Check if boss speed is slower than player speed
            const playerSpeed = Math.sqrt(game.inputState.mouseVelocityX * game.inputState.mouseVelocityX + 
                                        game.inputState.mouseVelocityY * game.inputState.mouseVelocityY);
            const bossSpeed = Math.abs(boss.waveSpeed);
            
            if (bossSpeed < playerSpeed) {
                boss.laserAttackActive = true;
                boss.isPreparingLaser = true;
                boss.laserWarningStartTime = now;
            } else {
                // If boss is too fast, set a shorter cooldown
                boss.laserAttackCooldown = now + 2000 + Math.random() * 2000; // 2-4 seconds
            }
        }
        if (boss.laserAttackActive) {
            if (boss.isPreparingLaser) {
                if (now - boss.laserWarningStartTime >= boss.laserWarningDuration) {
                    boss.isPreparingLaser = false;
                    boss.laserFiringStartTime = now;
                    boss.laserFiringJustStarted = true;
                }
            } else { // Firing phase
                if (now - boss.laserFiringStartTime >= boss.laserFiringDuration) {
                    boss.laserAttackActive = false;
                    boss.laserAttackCooldown = now + C.BOSS_LASER_COOLDOWN_MIN + Math.random() * (C.BOSS_LASER_COOLDOWN_MAX - C.BOSS_LASER_COOLDOWN_MIN);
                } else {
                    game.checkLaserCollision(boss);
                }
            }
        } else if (boss.laserAttackCooldown && now > boss.laserAttackCooldown) {
            boss.laserAttackCooldown = null;
        }
    }

    // --- Regular Missiles (Orange) ---
    if (now - boss.lastMissileTime > boss.missileInterval) {
        game.enemyMissiles.push(...createBossMissile(boss));
        boss.lastMissileTime = now;
    }

    // --- Barrage Attack (Red Bullets) ---
    const currentBarrageInterval = boss.postShieldPhase ? boss.finalPhaseBurstCooldown : boss.barrageInterval;
    if (!boss.burstActive && now - boss.lastBarrageTime > currentBarrageInterval) {
        boss.burstActive = true;
        boss.burstCount = 0;
        boss.lastBurstTime = now; // Start of the first burst in the series
    }

    if (boss.burstActive) {
        const burstFireInterval = boss.postShieldPhase ? C.BOSS_FINAL_PHASE_BURST_COOLDOWN : C.BOSS_BURST_COOLDOWN;
        if (now - boss.lastBurstTime > burstFireInterval && boss.burstCount < boss.maxBurstCount) {
            // Pass player position to the boss for barrage targeting
            boss.playerX = game.player.x;
            boss.playerY = game.player.y;
            
            const barrageResult = createBossBarrage(boss, now);

            // Safety checks remain, debug logs removed
            if (barrageResult && barrageResult.immediateBullets && barrageResult.immediateBullets.length > 0 && barrageResult.immediateBullets instanceof Array) {
                game.enemyBullets.push(...barrageResult.immediateBullets);
            } else if (barrageResult && barrageResult.immediateBullets && !(barrageResult.immediateBullets instanceof Array)){
                // Optional: Keep a silent error log for unexpected types in production, or remove
                // console.error("RUNTIME_WARNING: barrageResult.immediateBullets was not an array.");
            }
            
            if (barrageResult && barrageResult.scheduledProjectiles && barrageResult.scheduledProjectiles.length > 0 && barrageResult.scheduledProjectiles instanceof Array) {
                game.addScheduledProjectiles(barrageResult.scheduledProjectiles);
            } else if (barrageResult && barrageResult.scheduledProjectiles && !(barrageResult.scheduledProjectiles instanceof Array)) {
                // Optional: Keep a silent error log for unexpected types in production, or remove
                // console.error("RUNTIME_WARNING: barrageResult.scheduledProjectiles was not an array.");
            }
            
            game.addParticle({ /* Optional: Muzzle flash particle for barrage */ });
            boss.lastBurstTime = now;
            boss.burstCount++;
        }

        if (boss.burstCount >= boss.maxBurstCount) {
            boss.burstActive = false;
            boss.lastBarrageTime = now; // Cooldown for next burst series starts after the current series ends
            boss.barrageInterval = C.BOSS_BARRAGE_INTERVAL_MIN + Math.random() * (C.BOSS_BARRAGE_INTERVAL_MAX - C.BOSS_BARRAGE_INTERVAL_MIN);
            boss.maxBurstCount = Math.floor(C.BOSS_BURST_COUNT_MIN + Math.random() * (C.BOSS_BURST_COUNT_MAX - C.BOSS_BURST_COUNT_MIN + 1));
            if (boss.postShieldPhase) {
                boss.maxBurstCount = Math.floor(C.BOSS_FINAL_PHASE_BURST_COUNT_MIN + Math.random() * (C.BOSS_FINAL_PHASE_BURST_COUNT_MAX - C.BOSS_FINAL_PHASE_BURST_COUNT_MIN + 1));
            }
        }
    }

     // --- Final Phase Missiles (Blue/Cyan) ---
     if (boss.finalMissilePhaseActive && boss.fireBlueMissileAfterDelay) {
        if (now > boss.barrageEndTime + C.BOSS_FINAL_PHASE_MISSILE_DELAY) {
            game.enemyMissiles.push(createShieldRocket(boss, boss.finalMissileNextTurret));
            boss.finalMissileNextTurret = (boss.finalMissileNextTurret === 'left') ? 'right' : 'left';
            boss.fireBlueMissileAfterDelay = false;
        }
    }
}

function handleBossShieldAttacks(boss, now, game) {
     // Shield Rockets (Cyan)
     if (boss.shieldAttackTimer && now >= boss.shieldAttackTimer) {
        game.enemyMissiles.push(createShieldRocket(boss, boss.shieldAttackNextTurret));
        boss.shieldAttackNextTurret = (boss.shieldAttackNextTurret === 'left') ? 'right' : 'left';
        const randomInterval = C.BOSS_SHIELD_ROCKET_INTERVAL_MIN + Math.random() * (C.BOSS_SHIELD_ROCKET_INTERVAL_MAX - C.BOSS_SHIELD_ROCKET_INTERVAL_MIN);
        boss.shieldAttackTimer = now + randomInterval;
    }
    // Escort spawning is handled by the Game class based on the isSpawningEscorts flag
}

/**
 * Draws the boss, including shield, turrets, and laser.
 * @param {object} boss - The boss object.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {object} vibration - Current screen vibration offsets.
 * @param {boolean} debugMode - Whether debug mode is enabled.
 */
export function drawBoss(boss, ctx, vibration, debugMode) {
    ctx.save();
    ctx.translate(boss.x + vibration.x, boss.y + vibration.y);
    // REMOVE CLIPPING REGION so shield is always visible
    // ctx.beginPath();
    // ctx.rect(-boss.width/2, -boss.y, boss.width, ctx.canvas.height);
    // ctx.clip();

    // Note: Boss itself doesn't rotate like regular enemies

    // Hit Flash
    let bodyColor = boss.color;
    if (Date.now() - boss.hitFlashTime < 100) {
        bodyColor = '#FFFFFF';
    }

    // --- Draw Boss Shape --- (Can be further broken down)
    ctx.save();
    ctx.lineWidth = 3; // Thinner outline than original example
    ctx.strokeStyle = boss.outlineColor || '#2c2c2c';
    ctx.fillStyle = bodyColor;

    // Main triangular body
    ctx.beginPath();
    ctx.moveTo(0, -boss.height / 2);
    ctx.lineTo(-boss.width / 2.5, boss.height / 4);
    ctx.lineTo(boss.width / 2.5, boss.height / 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Central spine/body
    ctx.beginPath(); // Top part
    ctx.moveTo(0, -boss.height/2); ctx.lineTo(-boss.width/20, -boss.height/2.2); ctx.lineTo(-boss.width/16, -boss.height/3); ctx.lineTo(boss.width/16, -boss.height/3); ctx.lineTo(boss.width/20, -boss.height/2.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); // Middle rect
    ctx.rect(-boss.width/10, -boss.height/3.5, boss.width/5, boss.height/1.8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); // Bottom part
    ctx.moveTo(-boss.width/12, boss.height/4);
    ctx.lineTo(-boss.width/14, boss.height/2.2);
    ctx.lineTo(boss.width/14, boss.height/2.2);
    ctx.lineTo(boss.width/12, boss.height/4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Wings
    ctx.beginPath(); // Left wing
    ctx.moveTo(-boss.width/12, -boss.height/8);
    ctx.lineTo(-boss.width/2.2, -boss.height/10);
    ctx.lineTo(-boss.width/2, 0);
    ctx.lineTo(-boss.width/2.2, boss.height/10);
    ctx.lineTo(-boss.width/12, boss.height/8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); // Right wing
    ctx.moveTo(boss.width/12, -boss.height/8);
    ctx.lineTo(boss.width/2.2, -boss.height/10);
    ctx.lineTo(boss.width/2, 0);
    ctx.lineTo(boss.width/2.2, boss.height/10);
    ctx.lineTo(boss.width/12, boss.height/8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Cockpit (Restored original - Attempt 2)
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.ellipse(0, 0, boss.width / 14, boss.height / 5, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.restore(); // Restore context after main shape

    // --- Draw Shield --- (If active)
    drawBossShield(boss, ctx);

    // --- Draw Turrets --- (Rotated)
    drawBossTurrets(boss, ctx);

    // --- Draw Laser --- (If active)
    drawBossLaser(boss, ctx, debugMode);

    // Debug Wing Points
    if (debugMode) {
         // Simplified debug marker at center
         ctx.fillStyle = 'rgba(255, 0, 255, 0.8)'; // Magenta marker
         ctx.beginPath();
         ctx.arc(0, 0, 5, 0, Math.PI * 2);
         ctx.fill();
         // Could use getWingPoints here if needed, but requires translation
    }

    ctx.restore(); // Restore context translated to boss position
}

// --- Internal Helper Functions for Boss Drawing --- //

function drawBossShield(boss, ctx) {
    if (!boss.isShieldVisible) return;

    // Shrink shield for a tighter fit
    const shieldRadius = boss.width * 0.75;
    ctx.save();

    // Main shield gradient (full opacity)
    ctx.globalAlpha = 0.7; // More visible
    const shieldGradient = ctx.createRadialGradient(0, 0, boss.width / 2, 0, 0, shieldRadius);
    shieldGradient.addColorStop(0, 'rgba(64, 150, 255, 0.2)');
    shieldGradient.addColorStop(0.7, 'rgba(64, 150, 255, 0.5)');
    shieldGradient.addColorStop(1, 'rgba(64, 150, 255, 0.2)');
    ctx.fillStyle = shieldGradient;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.fill();

    // Shield border
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.95)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Cracks (if any)
    if (boss.shieldCrackLevel > 0 && boss.shieldCrackPaths && boss.shieldCrackPaths.length > 0) {
        ctx.strokeStyle = 'rgba(200, 225, 255, 0.8)';
        ctx.lineWidth = 1.5 + boss.shieldCrackLevel * 0.5;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        boss.shieldCrackPaths.forEach(segment => {
            ctx.moveTo(segment.x1, segment.y1);
            ctx.lineTo(segment.x2, segment.y2);
        });
        ctx.stroke();
    }

    ctx.restore();
}

function drawBossTurrets(boss, ctx) {
     ctx.save(); // Save before drawing left turret
     ctx.translate(-boss.width / 3, 0);
     ctx.rotate(boss.leftTurretAngle);
     drawTurretShape(ctx, boss.width); // Use helper
     ctx.restore();

     ctx.save(); // Save before drawing right turret
     ctx.translate(boss.width / 3, 0);
     ctx.rotate(boss.rightTurretAngle);
     drawTurretShape(ctx, boss.width); // Use helper
     ctx.restore();
}

function drawTurretShape(ctx, bossWidth) {
    // Base
    ctx.fillStyle = '#696969'; ctx.strokeStyle = '#2c2c2c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, bossWidth / 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Barrel
    ctx.fillStyle = '#555555'; ctx.fillRect(0, -bossWidth / 40, bossWidth / 10, bossWidth / 20);
    // Barrel End
    ctx.fillStyle = '#444444'; ctx.fillRect(bossWidth / 10, -bossWidth / 32, bossWidth / 20, bossWidth / 16);
}

function drawBossLaser(boss, ctx, debugMode) {
     if (!boss.laserAttackActive) return;

     const originX = 0; // Relative to boss center
     const originY = boss.height / 2.2;
     const canvasHeight = ctx.canvas.height; // Need canvas height

     ctx.save();
     if (boss.isPreparingLaser) {
        const progress = (Date.now() - boss.laserWarningStartTime) / boss.laserWarningDuration;
        const alpha = 0.3 + Math.sin(progress * Math.PI * 10) * 0.3;
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(originX, canvasHeight); ctx.stroke(); // Draw line to bottom
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha + 0.2})`;
        ctx.beginPath(); ctx.arc(originX, originY, 10 * progress, 0, Math.PI * 2); ctx.fill();
     } else { // Firing
         const gradient = ctx.createLinearGradient(originX, originY, originX, canvasHeight);
         gradient.addColorStop(0, 'rgba(255, 60, 60, 1.0)');
         gradient.addColorStop(0.5, 'rgba(255, 200, 200, 0.9)');
         gradient.addColorStop(1, 'rgba(255, 60, 60, 0.7)');
         ctx.fillStyle = gradient;
         ctx.fillRect(originX - 5, originY, 10, canvasHeight - originY); // Beam
         ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
         ctx.fillRect(originX - 2, originY, 4, canvasHeight - originY); // Core

        // Debug Hitbox (relative to boss position)
         if (debugMode) {
             const laserWidth = 6;
             ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
             ctx.fillRect(originX - laserWidth / 2, originY, laserWidth, canvasHeight - originY);
             ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'; ctx.lineWidth = 1;
             ctx.beginPath(); ctx.moveTo(originX - laserWidth / 2, originY); ctx.lineTo(originX - laserWidth / 2, canvasHeight); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(originX + laserWidth / 2, originY); ctx.lineTo(originX + laserWidth / 2, canvasHeight); ctx.stroke();
         }
     }
     ctx.restore();
}

/** Checks for collisions between revenge missiles and the boss shield */
export function checkRevengeMissileShieldCollision(game) {
    const boss = game.enemies.find(enemy => enemy.type === 'customBoss');
    if (!boss || !boss.isShieldVisible || boss.shieldHealth <= 0) return;

    const shieldRadius = boss.width * 0.9;

    for (let i = game.enemyMissiles.length - 1; i >= 0; i--) {
        const missile = game.enemyMissiles[i];
        if (!missile.isRevengeMissile) continue;

        const dx = missile.x - boss.x; const dy = missile.y - boss.y;
        const distSq = dx * dx + dy * dy;
        const collisionDistSq = Math.pow(shieldRadius + missile.width / 2, 2);

        if (distSq < collisionDistSq) {
            console.log("Revenge Missile hit Boss Shield!");
            game.enemyMissiles.splice(i, 1); // Remove missile
            game.particles.push(...createSmallExplosion(missile.x, missile.y)); // Impact effect

            if (boss.shieldHealth > 0) {
                boss.shieldHealth--;
                // Always show cracks after the first hit (when health is 1)
                let newCrackLevel = 0;
                if (boss.shieldHealth === 1) {
                    newCrackLevel = 1;
                }
                const oldCrackLevel = boss.shieldCrackLevel;
                boss.shieldCrackLevel = newCrackLevel;
                generateShieldCracks(boss); // Always generate cracks after first hit
                console.log(`Shield Health: ${boss.shieldHealth}`);

                // Check if shield just broke
                if (boss.shieldHealth <= 0) {
                    console.log("BOSS SHIELD BREAKING!");
                    boss.temporaryInvincible = false; // Boss becomes vulnerable NOW
                    boss.isShieldBreaking = true;
                    boss.shieldBreakStartTime = Date.now();
                    game.isSpawningEscorts = false; // Stop spawning escorts
                    game.particles.push(...createShieldBreakEffect(boss.x, boss.y)); // Initial break effect
                    game.floatingTexts.push({ value: "BOSS SHIELD DESTROYED!", /*...*/ });
                    // Explode remaining active escorts
                    for (let k = game.bossEscorts.length - 1; k >= 0; k--) {
                        if (game.bossEscorts[k].active) {
                            game.particles.push(...createEscortExplosion(game.bossEscorts[k].x, game.bossEscorts[k].y));
                            game.bossEscorts[k].active = false;
                        }
                    }
                    // Explode remaining enemy missiles (excluding the one that hit)
                     for (let m = game.enemyMissiles.length - 1; m >= 0; m--) {
                         // Note: The hitting missile (index i) was already removed
                         const missileToExp = game.enemyMissiles[m];
                         game.particles.push(...createSmallExplosion(missileToExp.x, missileToExp.y));
                         game.enemyMissiles.splice(m, 1);
                     }
                    break; // Shield broken, exit missile check loop
                }
            }
            continue; // Missile processed
        }
    }
}

/** Generates crack paths for the boss shield based on crack level */
export function generateShieldCracks(boss) {
    boss.shieldCrackPaths = [];
    // Use the same radius as the visual shield for cracks
    const shieldRadius = boss.width * 0.75;
    // Increase number of cracks for the single crack level to match previous level 2 appearance
    const numPrimaryCracks = 3 + boss.shieldCrackLevel * 2;

    const createCrackBranch = (x, y, angle, length, depth) => {
        if (length >= -1 || depth > 5) return;
        const segmentLength = Math.max(length, -8 - Math.random() * 12);
        const endX = x + Math.cos(angle) * segmentLength;
        const endY = y + Math.sin(angle) * segmentLength;
        boss.shieldCrackPaths.push({ x1: x, y1: y, x2: endX, y2: endY });
        const remainingLength = length - segmentLength;
        if (remainingLength >= -1) return;
        const nextAngle = angle + (Math.random() - 0.5) * 0.4;
        createCrackBranch(endX, endY, nextAngle, remainingLength, depth + 1);
        // Increase branch chance for more dramatic cracks
        const branchChance = 0.2 + boss.shieldCrackLevel * 0.2;
        if (Math.random() < branchChance && depth < 4) {
            const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.6);
            createCrackBranch(endX, endY, branchAngle, remainingLength * (0.4 + Math.random() * 0.3), depth + 1);
        }
         if (Math.random() < branchChance * 0.5 && depth < 4) { // Second branch chance
            const branchAngle2 = angle + (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.6);
            createCrackBranch(endX, endY, branchAngle2, remainingLength * (0.3 + Math.random() * 0.2), depth + 1);
        }
    };

    for (let c = 0; c < numPrimaryCracks; c++) {
        const startAngle = Math.random() * Math.PI * 2;
        const startRadius = shieldRadius * (0.9 + Math.random() * 0.1);
        const startX = Math.cos(startAngle) * startRadius;
        const startY = Math.sin(startAngle) * startRadius;
        createCrackBranch(startX, startY, startAngle, -startRadius, 0);
    }
}

// --- Escort Logic (Kept within boss module for now) --- //

/** Spawns a single escort */
export function createEscort(spawnX, canvasHeight) {
    return {
        x: spawnX,
        y: -C.BOSS_ESCORT_HEIGHT, // Start off-screen
        width: C.BOSS_ESCORT_WIDTH,
        height: C.BOSS_ESCORT_HEIGHT,
        speed: C.BOSS_ESCORT_SPEED,
        color: '#7a7a7a',
        active: true,
        rotation: Math.PI,
        hitPoints: C.BOSS_ESCORT_HEALTH,
        hitFlashTime: 0,
        lastBarrageTime: 0,
        barrageInterval: C.BOSS_ESCORT_BARRAGE_INTERVAL,
        lastParticleTime: 0, // For engine particles
        lastSparkTime: 0, // For damage sparks
        // New boss escort attack state
        nextEscortAttackTime: Date.now() + (4000 + Math.random() * 2000),
        escortAttackShotsLeft: 0,
        escortAttackNextShotTime: 0
    };
}

/** Updates all active boss escorts */
export function updateEscorts(escorts, player, canvasHeight, addEnemyProjectile, addParticle) {
    const now = Date.now();
    const particleInterval = 50;
    const sparkInterval = 150;

    for (let i = escorts.length - 1; i >= 0; i--) {
        const escort = escorts[i];
        if (!escort.active) continue;

        escort.y += escort.speed;

        // Spawn engine particles
        if (now - (escort.lastParticleTime || 0) > particleInterval) {
            const particleCount = 2;
            for (let p = 0; p < particleCount; p++) {
                // NOTE: Escort is rotated 180deg. y = -h * 0.5 is the visual TAIL (bottom).
                // Offset from escort center, slightly inside the visual TAIL (engine nozzle area)
                const nozzleOffsetY = -escort.height * 0.45; // Negative offset targets the visual tail area
                addParticle({
                    x: escort.x, y: escort.y + nozzleOffsetY, // Spawn near the visual tail tip
                    vx: (Math.random() - 0.5) * 1, // Slight horizontal spread
                    vy: -(2 + Math.random()), // NEGATIVE velocity for UPWARDS movement (towards top of screen)
                    size: 1 + Math.random() * 2,
                    color: `hsl(${Math.random() * 30 + 15}, 100%, 50%)`,
                    life: 0.3 + Math.random() * 0.2
                });
            }
            escort.lastParticleTime = now;
        }

        // Spawn damage sparks if health is low
        if (escort.hitPoints <= 10) {
            if (now - (escort.lastSparkTime || 0) > sparkInterval) {
                 // Spawn gray sparks
                 addParticle({ /* ... gray spark particle ... */ });
                 // Spawn yellow line particles
                 addParticle({ /* ... yellow line particle ... */ });
                 escort.lastSparkTime = now;
            }
        }

        // --- Boss Escort Attack (8 shots, 0.4s apart, 4-6s cooldown) ---
        if (!escort.escortAttackShotsLeft && !escort.escortAttackWarningTime && now >= (escort.nextEscortAttackTime || 0)) {
            escort.escortAttackWarningTime = now + 600; // 600ms warning
        }
        if (escort.escortAttackWarningTime && now >= escort.escortAttackWarningTime && escort.escortAttackShotsLeft === 0) {
            escort.escortAttackShotsLeft = 6;
            escort.escortAttackNextShotTime = now;
            escort.escortAttackWarningTime = null;
        }
        if (escort.escortAttackShotsLeft > 0 && now >= (escort.escortAttackNextShotTime || 0)) {
            // Fire a projectile at the player
            const tipX = escort.x;
            const tipY = escort.y + escort.height * 0.5;
            const dx = player.x - tipX;
            const dy = player.y - tipY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 6;
            const velocityX = dist > 0 ? dx / dist * speed : 0;
            const velocityY = dist > 0 ? dy / dist * speed : speed;
            addEnemyProjectile && addEnemyProjectile('escortAttack', {
                x: tipX,
                y: tipY,
                width: 6,
                height: 12,
                speed: speed,
                damage: 1,
                color: '#FF0000',
                velocityX: velocityX,
                velocityY: velocityY,
                isBossBarrageBullet: true,
                isTurretProjectile: false
            });
            escort.escortAttackShotsLeft--;
            escort.escortAttackNextShotTime = now + 300;
            if (escort.escortAttackShotsLeft === 0) {
                escort.nextEscortAttackTime = now + 4000 + Math.random() * 2000;
            }
        }

        // Deactivate if off screen
        if (escort.y > canvasHeight + escort.height) {
            escort.active = false;
        }
    }
    // Consider adding logic to remove inactive escorts from the array eventually
}

/** Draws all active boss escorts */
export function drawEscorts(escorts, ctx) {
    for (const escort of escorts) {
        if (escort.active) {
            ctx.save();
            ctx.translate(escort.x, escort.y);
            ctx.rotate(Math.PI); // Point down

            // Define colors
            let bodyColor = '#B0B0B0';    // Light Gray
            let detailColor = '#808080';   // Mid Gray
            let outlineColor = '#333333'; // Dark Gray Outline (Restored definition)
            let outlineWidth = 1.5;

            // Apply hit flash effect
            if (Date.now() - escort.hitFlashTime < 100) {
                bodyColor = '#FFFFFF';
                detailColor = '#FFFFFF';
                outlineWidth = 2;
            }

            ctx.strokeStyle = outlineColor; // Use the variable (Restored)
            ctx.lineWidth = outlineWidth;

            const w = escort.width;
            const h = escort.height;

            // --- Draw Adjusted Shape --- Tapered wings

            // Main Fuselage (Unchanged from previous adjustment)
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.moveTo(0, -h * 0.5);        // Nose tip (Visual Top)
            ctx.lineTo(-w * 0.1, -h * 0.3);
            ctx.lineTo(-w * 0.1, h * 0.4);
            ctx.lineTo(0, h * 0.5);         // Tail tip center (Visual Bottom)
            ctx.lineTo(w * 0.1, h * 0.4);
            ctx.lineTo(w * 0.1, -h * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Draw tip flash if warning is active
            if (escort.escortAttackWarningTime && Date.now() < escort.escortAttackWarningTime) {
                ctx.save();
                // Pulse alpha like the boss laser warning
                const warningProgress = 1 - (escort.escortAttackWarningTime - Date.now()) / 600;
                const pulse = 0.5 + Math.sin(warningProgress * Math.PI * 8) * 0.5; // 8 pulses in 600ms
                ctx.fillStyle = 'red';
                ctx.globalAlpha = 0.5 + 0.5 * pulse; // Pulses between 0.5 and 1.0
                ctx.beginPath();
                ctx.arc(0, -h * 0.5, w * 0.07, 0, Math.PI * 2); // Slightly smaller circle
                ctx.fill();
                ctx.restore();
            }

            // Wings (Revised path for tapering)
            ctx.fillStyle = bodyColor;
            ctx.beginPath(); // Left Wing
            const innerTopY = -h * 0.1;
            const innerBottomY = h * 0.1;
            const innerX = -w * 0.1;
            const outerTopX = -w * 0.5;
            const outerTopY = -h * 0.05; // Tip top point (closer to center line than bottom)
            const outerBottomX = -w * 0.45;
            const outerBottomY = h * 0.15; // Tip bottom point (further from center line)

            ctx.moveTo(innerX, innerTopY);     // Inner Top Left
            ctx.lineTo(outerTopX, outerTopY);    // Outer Top Left
            ctx.lineTo(outerBottomX, outerBottomY); // Outer Bottom Left
            ctx.lineTo(innerX, innerBottomY);    // Inner Bottom Left
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath(); // Right Wing (Mirrored X coordinates)
            ctx.moveTo(-innerX, innerTopY);     // Inner Top Right
            ctx.lineTo(-outerTopX, outerTopY);    // Outer Top Right
            ctx.lineTo(-outerBottomX, outerBottomY); // Outer Bottom Right
            ctx.lineTo(-innerX, innerBottomY);    // Inner Bottom Right
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cockpit (Moved closer to visual TAIL / engine end)
            ctx.fillStyle = detailColor;
            ctx.beginPath();
            // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
            ctx.ellipse(0, -h * 0.2, w * 0.05, h * 0.18, 0, 0, Math.PI * 2); // Changed center y to be more negative
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }
}

/** Handles timed escort spawning */
export function handleEscortSpawning(game) {
     if (!game.isSpawningEscorts) return;
     const now = Date.now();
     if (now >= game.nextEscortSpawnTime) {
         // Enforce escort limit
         const activeEscorts = game.bossEscorts.filter(e => e.active).length;
         if (activeEscorts >= C.BOSS_ESCORT_LIMIT) {
             // Too many escorts, delay next spawn
             game.nextEscortSpawnTime = now + 1000;
             return;
         }
         const boss = game.enemies.find(e => e.type === 'customBoss');
         if (!boss) return;

         const bossShieldRadius = boss.width * 0.9;
         const safeSpawnMargin = C.BOSS_ESCORT_WIDTH;
         let spawnX;
         let attempts = 0;
         const maxAttempts = 10;

         do {
             spawnX = Math.random() * (game.canvas.width - C.BOSS_ESCORT_WIDTH) + C.BOSS_ESCORT_WIDTH / 2;
             attempts++;
         } while (Math.abs(spawnX - boss.x) < bossShieldRadius + safeSpawnMargin && attempts < maxAttempts);

         if (attempts < maxAttempts) {
             game.bossEscorts.push(createEscort(spawnX, game.canvas.height));
         }

         // Count active revenge missiles
         const revengeMissileCount = game.enemyMissiles.filter(m => m.type === 'revengeMissile').length;
         let interval = C.BOSS_ESCORT_SPAWN_INTERVAL_MIN + Math.random() * (C.BOSS_ESCORT_SPAWN_INTERVAL_MAX - C.BOSS_ESCORT_SPAWN_INTERVAL_MIN);
         if (revengeMissileCount >= 3) {
             interval *= 2; // Slow down spawning if 3 or more revenge missiles
         }
         game.nextEscortSpawnTime = now + interval;
     }
}

/** Checks for collisions between revenge missiles and escorts */
export function checkMissileEscortCollisions(game) {
    for (let k = game.bossEscorts.length - 1; k >= 0; k--) {
        const escort = game.bossEscorts[k];
        if (!escort.active) continue;

        for (let i = game.enemyMissiles.length - 1; i >= 0; i--) {
            const missile = game.enemyMissiles[i];
            if (!missile.isRevengeMissile) continue;

            const dx = escort.x - missile.x; const dy = escort.y - missile.y;
            const distSq = dx * dx + dy * dy;
            const collisionDistSq = Math.pow(escort.width / 2 + missile.width / 2, 2);

            if (distSq < collisionDistSq) {
                game.enemyMissiles.splice(i, 1); // Remove missile
                game.handleEscortDefeat(escort, k, false); // Use standard defeat logic
                break; // Escort destroyed, move to next escort
            }
        }
    }
} 