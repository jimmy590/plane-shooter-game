import * as C from './constants.js';
import { Player } from './player.js';
import { updatePlayerBullets, drawPlayerBullets, spawnPlayerBullet } from './projectile.js';
import {
    updateEnemyBullets, updateEnemyMissiles, drawEnemyBullets, drawEnemyMissiles,
    spawnSpecificEnemyProjectile,
    createRevengeMissile
} from './enemyProjectile.js';
import { createHealthBoost, updateHealthBoosts, drawHealthBoosts } from './healthBoost.js';
import { createPowerup, updatePowerups, drawPowerups } from './powerup.js';
import {
    createExplosionParticles, createSmallExplosion, createEscortExplosion,
    createMissileEscortCollisionExplosion, createShieldImpactEffect,
    createShieldBreakEffect, createBossEngineParticles, updateParticles, drawParticles
} from './particle.js';
import {
    drawScore, drawHearts, drawLevelInfo, drawBossHealthBar,
    updateFloatingTexts, drawFloatingTexts, drawDeveloperInfo,
    drawActivePowerups, drawLowHealthWarning
} from './uiManager.js';
import { checkLevelUp, showUpgradeOptions } from './upgradeManager.js';
import { createEnemy, updateRegularEnemy, drawRegularEnemy, getEnemyHitboxes } from './enemyFactory.js';
import {
    createCustomBoss, updateBoss, drawBoss, createEscort, updateEscorts, drawEscorts,
    handleEscortSpawning, checkMissileEscortCollisions, checkRevengeMissileShieldCollision
} from './boss.js';
import { getWingPoints, pointInTriangle } from './utils.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.menu = document.getElementById('menu');
        this.levelModal = document.getElementById('levelModal');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.startLevelButton = document.getElementById('startLevelButton');
        this.gameStarted = false;
        this.selectedLevel = 1;
        
        this.resizeCanvas();
        
        this.player = new Player(this.canvas);
        this.inputState = { mouseVelocityX: 0, mouseVelocityY: 0, lastMouseMoveTime: 0 };
        
        this.enemies = [];
        this.bossEscorts = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.enemyMissiles = [];
        this.scheduledProjectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.healthBoosts = [];
        this.powerups = [];
        this.activePowerups = [];
        this.lastPowerupDropTime = 0;
        
        this.score = 0;
        this.level = C.INITIAL_LEVEL;
        this.experience = 0;
        this.experienceToNextLevel = C.INITIAL_XP_TO_NEXT_LEVEL;
        this.gameStartTime = 0;
        this.gameRunTime = 0;
        
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = C.BASE_ENEMY_SPAWN_INTERVAL;
        this.lastBulletTime = 0;
        this.bulletInterval = C.PLAYER_BULLET_INTERVAL_BASE;
        this.lastHeartDropTime = 0;
        
        this.customBossSpawned = false;
        this.shootingEnabled = true;
        this.debugMode = C.DEBUG_MODE_ENABLED;
        this.developerMode = C.DEVELOPER_MODE_ENABLED;
        this.pausedForUpgrade = false;
        this.isSpawningEscorts = false;
        
        this.showBossHealthBar = false;
        this.planesDestroyed = 0;
        this.maxHealth = C.PLAYER_INITIAL_HEALTH;
        this.scoreMultiplier = 1;
        this.enemyTypes = ['basic'];
        this.upgrades = {
            maxHealth: 1,
            bulletDamage: 1,
            fireRateBoost: 0,
            baseBulletInterval: C.PLAYER_BULLET_INTERVAL_BASE,
            moveSpeed: 1,
            scoreMultiplier: 1,
            doubleShot: false,
            doubleDamageChance: 0,
            xpMultiplier: 1.0,
            spreadShot: false,
            improvedHandling: false,
            handlingBoost: 0
        };
        this.spreadShotCounter = 0;
        
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = performance.now();
        
        this.playerLaserTargetX = 0;
        this.playerLaserTargetY = 0;
        
        this.lastPreBossEnemy = null; // Track the last enemy spawned before boss
        
        this.canvas.style.display = 'block';
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Level button click handler
        const levelButton = document.querySelector('.level-button');
        levelButton.addEventListener('click', () => {
            this.selectedLevel = parseInt(levelButton.dataset.level);
            this.showLevelModal();
        });

        // Start level button click handler
        this.startLevelButton.addEventListener('click', () => {
            this.hideLevelModal();
            this.startGame();
        });

        // Modal overlay click handler (to close modal)
        this.modalOverlay.addEventListener('click', () => {
            this.hideLevelModal();
        });

        // Existing event listeners
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this), false);
        document.addEventListener('mozpointerlockchange', this.handlePointerLockChange.bind(this), false);
        document.addEventListener('webkitpointerlockchange', this.handlePointerLockChange.bind(this), false);
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    handleResize() {
        if (this.gameStarted) {
            this.resizeCanvas();
            this.player.handleResize(this.canvas.width, this.canvas.height);
        }
    }
    
    showLevelModal() {
        this.levelModal.style.display = 'block';
        this.modalOverlay.style.display = 'block';
        this.levelModal.querySelector('h2').textContent = `Start Level ${this.selectedLevel}?`;
        
        // Trigger reflow to ensure transitions work
        this.levelModal.offsetHeight;
        this.modalOverlay.offsetHeight;
        
        // Add visible class for animation
        this.levelModal.classList.add('visible');
        this.modalOverlay.classList.add('visible');
    }

    hideLevelModal() {
        // Remove visible class for fade out
        this.levelModal.classList.remove('visible');
        this.modalOverlay.classList.remove('visible');
        
        // Wait for transition to complete before hiding
        setTimeout(() => {
            this.levelModal.style.display = 'none';
            this.modalOverlay.style.display = 'none';
        }, 300); // Match transition duration
    }
    
    startGame() {
        // Add hidden class to menu for fade out
        this.menu.classList.add('hidden');
        
        // Wait for menu fade out before starting game
        setTimeout(() => {
            this.gameStarted = true;
            
            // Reset core game state
            this.score = 0;
            this.gameStartTime = Date.now();
            this.gameRunTime = 0;
            this.planesDestroyed = 0;
            this.scoreMultiplier = 1;
            this.level = this.selectedLevel;
            this.experience = 0;
            this.experienceToNextLevel = C.INITIAL_XP_TO_NEXT_LEVEL;

            this.player.reset(this.canvas);
            this.maxHealth = C.PLAYER_INITIAL_HEALTH;
            this.player.maxHealth = this.maxHealth;
            this.player.health = this.maxHealth;
            
            // Reset arrays
            this.enemies = [];
            this.bossEscorts = [];
            this.bullets = [];
            this.enemyBullets = [];
            this.enemyMissiles = [];
            this.scheduledProjectiles = [];
            this.particles = [];
            this.floatingTexts = [];
            this.healthBoosts = [];
            this.powerups = [];
            this.activePowerups = [];
            this.lastPowerupDropTime = 0;
            
            // Reset timers and flags
            this.lastEnemySpawn = 0;
            this.lastBulletTime = 0;
            this.lastHeartDropTime = 0;
            this.customBossSpawned = false;
            this.showBossHealthBar = false;
            this.pausedForUpgrade = false;
            this.isSpawningEscorts = false;
            this.nextEscortSpawnTime = 0;
            
            // Reset upgrades
            this.upgrades = {
                maxHealth: 1,
                bulletDamage: 1,
                fireRateBoost: 0,
                baseBulletInterval: C.PLAYER_BULLET_INTERVAL_BASE,
                moveSpeed: 1,
                scoreMultiplier: 1,
                doubleShot: false,
                doubleDamageChance: 0,
                xpMultiplier: 1.0,
                spreadShot: false,
                improvedHandling: false,
                handlingBoost: 0
            };
            this.bulletInterval = this.upgrades.baseBulletInterval;
            this.enemyTypes = ['basic'];

            // Add visible class to canvas for fade in
            this.canvas.classList.add('visible');

            // Pointer Lock and Game Loop
            this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
            if (this.canvas.requestPointerLock) {
                this.canvas.requestPointerLock();
            }
            this.gameLoop();
        }, 500); // Match menu transition duration
    }
    
    handlePointerLockChange() {
        if (document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas || document.webkitPointerLockElement === this.canvas) {
            this.canvas.style.cursor = 'none';
        } else {
            if (!this.pausedForUpgrade) {
                this.gameStarted = false;
                this.canvas.classList.remove('visible');
                this.menu.classList.remove('hidden');
                this.canvas.style.cursor = 'auto';
            }
        }
    }
    
    handleMouseMove(e) {
        if (!this.gameStarted || this.pausedForUpgrade) return;
        const movementX = (e.movementX || e.mozMovementX || e.webkitMovementX || 0) * 2.0;
        const movementY = (e.movementY || e.mozMovementY || e.webkitMovementY || 0) * 2.0;
        this.inputState.mouseVelocityX = movementX;
        this.inputState.mouseVelocityY = movementY;
        if (movementX !== 0 || movementY !== 0) {
            this.inputState.lastMouseMoveTime = Date.now();
        }
    }
    
    handleKeyDown(e) {
        // console.log('Key pressed:', e.key, 'Shift key:', e.shiftKey, 'KeyCode:', e.keyCode);
        if (e.key === '0') {
            this.developerMode = !this.developerMode;
            this.addFloatingText(this.developerMode ? 'Developer Mode: ON' : 'Developer Mode: OFF', this.player.x, this.player.y - 50);
        }
        else if (e.key === '9' && !e.shiftKey) {
            this.shootingEnabled = !this.shootingEnabled;
            this.addFloatingText(this.shootingEnabled ? 'Shooting: ON' : 'Shooting: OFF', this.player.x, this.player.y - 50);
        }
        else if ((e.key === '9' || e.key === '(' || e.keyCode === 57) && e.shiftKey) {
            // Shift+9: Set enemy timer to 120 and spawn the boss
            if (this.developerMode && this.gameStarted) {
                // Set enemy timer to 120
                this.gameRunTime = 120;
                // Spawn the boss if not already present
                let boss = this.enemies.find(en => en.type === 'customBoss');
                if (!boss) {
                    boss = createCustomBoss(this.canvas);
                    this.enemies.push(boss);
                    this.customBossSpawned = true;
                    this.addFloatingText("Boss Spawned!", this.canvas.width / 2, 100, { color: '#FF00FF', size: 24, life: 1.5 });
                } else {
                    this.addFloatingText("Boss Already Present", this.canvas.width / 2, 100, { color: '#FF00FF', size: 24, life: 1.5 });
                }
                this.addFloatingText("Enemy Timer Set To 120", this.canvas.width / 2, 130, { color: '#00FFFF', size: 20, life: 1.5 });
            }
        }
        else if ((e.key === '8' || e.key === '*' || e.keyCode === 56) && e.shiftKey) {
            // console.log('Shift+8 detected!');
            if (this.developerMode && this.gameStarted && this.customBossSpawned) {
                const boss = this.enemies.find(en => en.type === 'customBoss');
                if (boss) {
                // console.log('Conditions met, setting boss health to 100');
                    boss.hitPoints = 100;
                    this.addFloatingText("Boss Health Set To 100", this.canvas.width / 2, 100, { color: '#FF0000', size: 24, life: 1.5 });
                }
            } else {
                // console.log('Conditions not met: Dev mode:', this.developerMode, 
                            // 'Game started:', this.gameStarted, 
                            // 'Boss spawned:', this.customBossSpawned);
            }
        }
        else if ((e.key === '7' || e.key === '&' || e.keyCode === 55) && e.shiftKey) {
            // console.log('Shift+7 detected!');
            if (this.developerMode && this.gameStarted && this.customBossSpawned) {
                const boss = this.enemies.find(en => en.type === 'customBoss');
                if (boss) {
                    // console.log('Conditions met, forcing shield phase');
                    boss.hitPoints = C.BOSS_SHIELD_HEALTH_THRESHOLD;
                    this.addFloatingText("Forcing Boss Shield Phase", this.canvas.width / 2, 100, { color: '#00FFFF', size: 24, life: 1.5 });
                }
            } else {
                // console.log('Conditions not met: Dev mode:', this.developerMode, 
                            // 'Game started:', this.gameStarted, 
                            // 'Boss spawned:', this.customBossSpawned);
            }
        }
        else if ((e.key === '6' || e.key === '^' || e.keyCode === 54) && e.shiftKey) {
            // console.log('Shift+6 detected!');
            if (this.developerMode && this.gameStarted && this.customBossSpawned) {
                const boss = this.enemies.find(en => en.type === 'customBoss');
                if (boss) {
                    // console.log('Conditions met, forcing final phase');
                    boss.hitPoints = 10;
                    boss.shieldHealth = 0;
                    boss.inShieldPhase = false;
                    boss.isShieldBreaking = false;
                    boss.postShieldPhase = true;
                    boss.finalMissilePhaseActive = true;
                    boss.finalMissileNextTurret = 'left';
                    this.addFloatingText("Forcing Boss Final Phase", this.canvas.width / 2, 100, { color: '#FFA500', size: 24, life: 1.5 });
                }
            } else {
                // console.log('Conditions not met: Dev mode:', this.developerMode, 
                            // 'Game started:', this.gameStarted, 
                            // 'Boss spawned:', this.customBossSpawned);
            }
        }
        else if (e.key === '8' && !e.shiftKey) {
            this.player.devModeInvulnerable = !this.player.devModeInvulnerable;
            this.player.invulnerable = this.player.devModeInvulnerable;
            this.addFloatingText(this.player.devModeInvulnerable ? 'Invincibility: ON' : 'Invincibility: OFF', this.player.x, this.player.y - 50);
        }
        else if (e.key === 'o' || e.key === 'O') {
            if (this.developerMode) {
                this.gameStartTime -= 10000;
                const newGameTime = (Date.now() - this.gameStartTime) / 1000;
                this.addFloatingText(`Game Time +10s (Now: ${newGameTime.toFixed(1)}s)`, this.canvas.width / 2, 100, { color: '#FFFF00', size: 20, life: 1.0 });
            }
        }
        else if (e.key === 'p' || e.key === 'P') {
            if (this.developerMode) {
                this.experience = this.experienceToNextLevel;
                this.addFloatingText(`Forcing Level Up`, this.canvas.width / 2, 100, { color: '#FFD700', size: 20, life: 1.0 });
            }
        }
        else if (e.key === 'd' || e.key === 'D') {
            this.debugMode = !this.debugMode;
            this.addFloatingText(this.debugMode ? 'Debug Hitboxes: ON' : 'Debug Hitboxes: OFF', this.canvas.width / 2, 100, { color: '#00FF00', size: 20, life: 1.0 });
        }
        else if (e.key === 'h' || e.key === 'H') {
            if (this.developerMode) {
                this.healthBoosts.push(createHealthBoost(this.player.x, this.player.y - 100));
                this.addFloatingText(`Spawned Health Boost`, this.player.x, this.player.y - 50);
            }
        }
        else if (e.key === 'u' || e.key === 'U') {
            if (this.developerMode) {
                this.powerups.push(createPowerup(this.player.x, this.player.y - 100));
                this.addFloatingText(`Spawned Powerup`, this.player.x, this.player.y - 50);
            }
        }
    }
    
    update() {
        const now = Date.now();
        this.gameRunTime = (now - this.gameStartTime) / 1000;

        // Secret gradual fire rate boost during boss entrance
        const bossEntrance = this.enemies.find(e => e.type === 'customBoss');
        if (bossEntrance && bossEntrance.invincibleDuringEntrance) {
            if (!this._fireRateBoostDuringBoss) {
                this._fireRateBoostDuringBoss = {
                    startBoost: this.upgrades.fireRateBoost,
                    applied: 0,
                    duration: bossEntrance.healthBarFillDuration || 3000,
                    startTime: bossEntrance.healthBarAnimationStartTime || (now - 1),
                };
            }
            const elapsed = now - this._fireRateBoostDuringBoss.startTime;
            const progress = Math.min(elapsed / this._fireRateBoostDuringBoss.duration, 1);
            const targetBoost = 20 * progress;
            const toApply = targetBoost - this._fireRateBoostDuringBoss.applied;
            if (toApply > 0) {
                this.upgrades.fireRateBoost += toApply;
                this._fireRateBoostDuringBoss.applied += toApply;
                this.bulletInterval = this.upgrades.baseBulletInterval / (1 + this.upgrades.fireRateBoost / 100);
            }
        } else if (this._fireRateBoostDuringBoss && (!bossEntrance || !bossEntrance.invincibleDuringEntrance)) {
            // Clean up after entrance
            this._fireRateBoostDuringBoss = null;
        }

        // Process scheduled projectiles FIRST (so they can be updated/drawn in the same frame they become active)
        if (this.scheduledProjectiles.length > 0) {
            for (let i = this.scheduledProjectiles.length - 1; i >= 0; i--) {
                const scheduled = this.scheduledProjectiles[i];
                if (now >= scheduled.spawnTime) {
                    // Assuming barrage projectiles are always bullets.
                    // If missiles could also be scheduled, we'd need a type check here.
                    this.enemyBullets.push(scheduled.projectile);
                    this.scheduledProjectiles.splice(i, 1);
                }
            }
        }

        this.player.update(this.inputState, this.canvas, now);
        
        updatePlayerBullets(this.bullets, this.canvas.height);
        
        if (this.shootingEnabled && now - this.lastBulletTime > this.bulletInterval) {
            const newBullets = spawnPlayerBullet(this.player, this.upgrades, this.spreadShotCounter);
            this.bullets.push(...newBullets);
            this.lastBulletTime = now;
            if (this.upgrades.spreadShot) {
                 this.spreadShotCounter = (this.spreadShotCounter + 1) % 2;
            }
        }
        
        updateEnemyBullets(this.enemyBullets, this.canvas.height);
        
        updateEnemyMissiles(
            this.enemyMissiles,
            this.player,
            this.gameOver.bind(this),
            this.startVibration.bind(this),
            this.addParticle.bind(this),
            this.canvas.width,
            this.canvas.height
        );
        
        // Ensure revenge missile vs escort collision is checked every frame
        if (this.bossEscorts.length > 0 && this.enemyMissiles.length > 0) {
            checkMissileEscortCollisions(this);
        }
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            let removeEnemy = false;
            
            if (enemy.type === 'customBoss') {
                updateBoss(enemy, this.player, this);
                this.showBossHealthBar = true;
                    } else {
                removeEnemy = updateRegularEnemy(enemy, this.player, this.canvas.height, this.addEnemyProjectile.bind(this));
            }
            
            if (removeEnemy) {
                this.enemies.splice(i, 1);
            }
        }
        
        const boss = this.enemies.find(e => e.type === 'customBoss');
        if (boss && this.bossEscorts.length > 0) {
             updateEscorts(this.bossEscorts, this.player, this.canvas.height, this.addEnemyProjectile.bind(this), this.addParticle.bind(this));
             this.bossEscorts = this.bossEscorts.filter(esc => esc.active);
        }
        
        this.spawnEnemies(this.gameRunTime, now);
        
        if (boss && boss.inShieldPhase && !boss.isShieldBreaking) {
            this.isSpawningEscorts = true;
            handleEscortSpawning(this);
        } else {
            this.isSpawningEscorts = false;
        }
        
        updateParticles(this.particles);
        
        updateFloatingTexts(this.floatingTexts);
        
        updateHealthBoosts(this.healthBoosts, this.player, this.canvas.height, this.addFloatingText.bind(this));
        
        updatePowerups(this.powerups, this.activePowerups, this.player, this, this.canvas.height);
        
        this.checkCollisions(now);
        
        checkLevelUp(this);
        
                    this.vibrationStartTime = Date.now();
    }
    
    spawnEnemies(gameTime, now) {
        // Only proceed if the boss hasn't already spawned
        if (!this.customBossSpawned) {
            // Check if it's time for the boss using gameTime
            if (gameTime >= 120) { // Boss spawns at 120 seconds
                // --- Boss Spawn Actions ---
                const boss = createCustomBoss(this.canvas);
                this.enemies.push(boss);
                this.customBossSpawned = true;
                this.showBossHealthBar = true;
                this.addFloatingText("WARNING: BOSS DETECTED!", this.canvas.width / 2, 100, { color: '#FF0000', size: 36, life: 3.0 });
                return; 
            } else if (gameTime < 110) { // Only spawn normal enemies before 110 seconds
                // --- Regular Spawn Logic ---
                // Use gameTime for checking regular enemy unlocks
                if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
                    this.updateAvailableEnemyTypes(gameTime);
                    const type = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
                    const newEnemy = createEnemy(type, this.canvas, gameTime); // Pass gameTime for HP scaling
                    this.enemies.push(newEnemy);
                    this.lastEnemySpawn = now;
                    // Track the last enemy spawned before boss
                    if (gameTime >= 109) {
                        this.lastPreBossEnemy = newEnemy;
                    }
                }
            }
        }
    }
    
    updateAvailableEnemyTypes(gameTime) {
        // Use gameTime for checks
        if (gameTime > C.TIME_SCOUT_SPAWN && !this.enemyTypes.includes('scout')) {
            this.enemyTypes.push('scout');
        }
        if (gameTime > C.TIME_TANK_SPAWN && !this.enemyTypes.includes('tank')) {
            this.enemyTypes.push('tank');
        }
    }
    
    checkCollisions(now) {
        // --- Player Bullets vs Enemies ---
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            let bulletRemoved = false;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (!enemy.active) {
                    if (this.debugMode) console.log("Skipping inactive enemy:", enemy);
                    continue; // Skip inactive
                }
            
            if (enemy.type === 'customBoss') {
                    // --- Boss Collision Logic ---
                    if (enemy.inShieldPhase && !enemy.isShieldBreaking) {
                        // --- Shield Collision Check (Circular) ---
                        const dx = bullet.x - enemy.x;
                        const dy = bullet.y - enemy.y;
                        const distSq = dx * dx + dy * dy;
                        const shieldRadius = enemy.width * 0.9; // Match shield drawing
                        const shieldCollisionDistSq = Math.pow(shieldRadius + bullet.width / 2, 2);

                        if (distSq < shieldCollisionDistSq) {
                            // Hit the shield
                            this.particles.push(...createShieldImpactEffect(bullet.x, bullet.y));
                            this.bullets.splice(i, 1);
                            bulletRemoved = true;
                            break; // Bullet removed, exit enemy loop
                        }
                        // If it didn't hit shield, bullet continues (passes through invincible boss body)

                    } else {
                        // --- Vulnerable Boss Body Collision Check ---
                        // Check if boss is in a non-shield invulnerable state
                        if (!enemy.invincibleDuringEntrance && !enemy.temporaryInvincible) {
                             // Use Rectangular Check for vulnerable boss body
                            const bulletLeft = bullet.x - bullet.width / 2;
                            const bulletRight = bullet.x + bullet.width / 2;
                            const bulletTop = bullet.y - bullet.height / 2;
                            const bulletBottom = bullet.y + bullet.height / 2;

                            const bossLeft = enemy.x - enemy.width / 2;
                            const bossRight = enemy.x + enemy.width / 2;
                            const bossTop = enemy.y - enemy.height / 2;
                            const bossBottom = enemy.y + enemy.height / 2;

                            if (bulletRight > bossLeft && bulletLeft < bossRight &&
                                bulletBottom > bossTop && bulletTop < bossBottom) {
                                // HIT!
                                const damage = this.player.bulletDamage || 1;
                                
                                // Handle secret double health in final phase
                                if (enemy.postShieldPhase) {
                                    // If this is the first hit after shield break, double the health
                                    if (!enemy.actualHealth) {
                                        enemy.actualHealth = enemy.hitPoints * 2;
                                    }
                                    // Apply half damage to visual health, full damage to actual health
                                    enemy.hitPoints -= damage;
                                    enemy.actualHealth -= damage * 2;
                                    
                                    // Check for death based on actual health
                                    if (enemy.actualHealth <= 0) {
                                        this.handleEnemyDefeat(enemy, j);
                                    }
                                } else {
                                    // Normal damage handling before shield break
                                    enemy.hitPoints -= damage;
                                    if (enemy.hitPoints <= 0) {
                                        this.handleEnemyDefeat(enemy, j);
                                    }
                                }
                                
                                enemy.hitFlashTime = now;
                                // No hit particles for boss body hits (as per previous request)
                                // this.particles.push(...createSmallExplosion(bullet.x, bullet.y));
                                this.bullets.splice(i, 1);
                                bulletRemoved = true;
                                break; // Bullet hit the boss
                            }
                        }
                        // Else: Boss is in a non-shield invulnerable state (entrance/temp), bullet passes through
                    }
            } else {
                     // --- Regular Enemy Collision: Multi-Rectangle Hitbox ---
                     const bulletLeft = bullet.x - bullet.width / 2;
                     const bulletRight = bullet.x + bullet.width / 2;
                     const bulletTop = bullet.y - bullet.height / 2;
                     const bulletBottom = bullet.y + bullet.height / 2;

                     const hitboxes = getEnemyHitboxes(enemy);
                     let hit = false;
                     for (const rect of hitboxes) {
                         if (bulletRight > rect.left && bulletLeft < rect.right &&
                             bulletBottom > rect.top && bulletTop < rect.bottom) {
                             hit = true;
                             break;
                         }
                     }

                     if (this.debugMode) {
                         console.log("Bullet:", { x: bullet.x, y: bullet.y, left: bulletLeft, right: bulletRight, top: bulletTop, bottom: bulletBottom });
                         console.log("Enemy hitboxes:", hitboxes);
                         if (hit) console.log("HIT! Enemy type:", enemy.type);
                     }

                     if (hit) {
                        const damage = this.player.bulletDamage || 1;
                        enemy.hitPoints -= damage;
                        enemy.hitFlashTime = now;
                        this.particles.push(...createSmallExplosion(bullet.x, bullet.y));
                        if (enemy.hitPoints <= 0) {
                            if (this.debugMode) console.log("Enemy destroyed:", enemy.type);
                            this.handleEnemyDefeat(enemy, j);
                        }
                        this.bullets.splice(i, 1);
                        bulletRemoved = true;
                        break; // Bullet hit one enemy
                     }
                 }
            }

            if (bulletRemoved) continue;
            
            // --- Player Bullets vs Boss Escorts (NEW) ---
        for (let k = this.bossEscorts.length - 1; k >= 0; k--) {
            const escort = this.bossEscorts[k];
                if (!escort.active) continue; // Skip inactive escorts

                // Simple Rectangular Collision Check
                const bulletLeft = bullet.x - bullet.width / 2;
                const bulletRight = bullet.x + bullet.width / 2;
                const bulletTop = bullet.y - bullet.height / 2;
                const bulletBottom = bullet.y + bullet.height / 2;

                const escortLeft = escort.x - escort.width / 2;
                const escortRight = escort.x + escort.width / 2;
                const escortTop = escort.y - escort.height / 2;
                const escortBottom = escort.y + escort.height / 2;

                if (bulletRight > escortLeft && bulletLeft < escortRight &&
                    bulletBottom > escortTop && bulletTop < escortBottom) {
                    
                    const damage = this.player.bulletDamage || 1;
                    escort.hitPoints -= damage;
                    escort.hitFlashTime = now; // Trigger hit flash
                    
                    // this.particles.push(...createSmallExplosion(bullet.x, bullet.y)); // REMOVED Hit particle effect
                    
                    if (escort.hitPoints <= 0) {
                         this.handleEscortDefeat(escort, k, true); // Pass flag indicating player kill
                    }
                    
                this.bullets.splice(i, 1);
                    bulletRemoved = true;
                    break; // Bullet hit one escort
                }
            }
             if (bulletRemoved) continue;
        }

        // --- Enemy Projectiles/Ships vs Player ---
        const allEnemyProjectiles = [...this.enemyBullets, ...this.enemyMissiles];
        const playerTriangle = this.player.getTriangleHitbox();
        for (let i = allEnemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = allEnemyProjectiles[i];
            const px = projectile.x;
            const py = projectile.y;
            const shieldPowerupActive = this.activePowerups.some(p => p.type === 'shield');
            // Use triangle hitbox if no shield, else use circle
            let hit = false;
            if (shieldPowerupActive) {
                const playerCollisionRadius = C.PLAYER_SHIELD_RADIUS;
                const dx = this.player.x - px;
                const dy = this.player.y - py;
                const collisionDistSq = Math.pow(playerCollisionRadius + (projectile.width ? projectile.width / 2 : 0), 2);
                const distSq = dx * dx + dy * dy;
                hit = distSq < collisionDistSq;
            } else {
                hit = pointInTriangle(px, py, ...playerTriangle);
            }
            if (hit) {
                if (shieldPowerupActive) {
                    this.particles.push(...createShieldImpactEffect(projectile.x, projectile.y));
                    if (this.enemyBullets.includes(projectile)) this.enemyBullets.splice(this.enemyBullets.indexOf(projectile), 1);
                    if (this.enemyMissiles.includes(projectile)) this.enemyMissiles.splice(this.enemyMissiles.indexOf(projectile), 1);
                } else if (!this.player.invulnerable) {
                    this.handlePlayerHit(projectile);
                    if (this.enemyBullets.includes(projectile)) this.enemyBullets.splice(this.enemyBullets.indexOf(projectile), 1);
                    if (this.enemyMissiles.includes(projectile)) this.enemyMissiles.splice(this.enemyMissiles.indexOf(projectile), 1);
                }
                break;
            }
        }
        // --- Enemy Ships vs Player ---
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (enemy.type === 'customBoss') continue;
            const ex = enemy.x;
            const ey = enemy.y;
            const shieldPowerupActive = this.activePowerups.some(p => p.type === 'shield');
            let hit = false;
            if (shieldPowerupActive) {
                const playerCollisionRadius = C.PLAYER_SHIELD_RADIUS;
                const dx = this.player.x - ex;
                const dy = this.player.y - ey;
                const collisionDistSq = Math.pow(playerCollisionRadius + enemy.width / 2.5, 2);
                const distSq = dx * dx + dy * dy;
                hit = distSq < collisionDistSq;
            } else {
                hit = pointInTriangle(ex, ey, ...playerTriangle);
            }
            if (hit) {
                if (shieldPowerupActive) {
                    this.particles.push(...createShieldImpactEffect(enemy.x, enemy.y));
                    enemy.hitPoints -= C.PLAYER_SHIELD_COLLISION_DAMAGE;
                    enemy.hitFlashTime = now;
                } else if (!this.player.invulnerable) {
                    this.handlePlayerHit(enemy);
                    this.handleEnemyDefeat(enemy, j);
                }
                break;
            }
        }
        // --- Boss Escorts vs Player ---
        for (let k = this.bossEscorts.length - 1; k >= 0; k--) {
            const escort = this.bossEscorts[k];
            if (!escort.active) continue;
            const ex = escort.x;
            const ey = escort.y;
            const shieldPowerupActive = this.activePowerups.some(p => p.type === 'shield');
            let hit = false;
            if (shieldPowerupActive) {
                const playerCollisionRadius = C.PLAYER_SHIELD_RADIUS;
                const dx = this.player.x - ex;
                const dy = this.player.y - ey;
                const collisionDistSq = Math.pow(playerCollisionRadius + escort.width / 2, 2);
                const distSq = dx * dx + dy * dy;
                hit = distSq < collisionDistSq;
            } else {
                hit = pointInTriangle(ex, ey, ...playerTriangle);
            }
            if (hit) {
                if (shieldPowerupActive) {
                    this.particles.push(...createShieldImpactEffect(escort.x, escort.y));
                    escort.hitPoints -= C.PLAYER_SHIELD_COLLISION_DAMAGE;
                    escort.hitFlashTime = now;
                } else if (!this.player.invulnerable) {
                    this.handlePlayerHit({ damage: 1 });
                    this.handleEscortDefeat(escort, k);
                }
                break;
            }
        }
        
        const boss = this.enemies.find(e => e.type === 'customBoss');
        const shieldPowerupActiveForLaser = this.activePowerups.some(p => p.type === 'shield');
        if (boss && boss.laserAttackActive && !boss.isPreparingLaser && !this.player.invulnerable && !shieldPowerupActiveForLaser) {
            this.checkLaserCollision(boss);
        }
        
        if (boss && this.isSpawningEscorts) {
            checkMissileEscortCollisions(this);
        }
        
        if (boss && boss.inShieldPhase) {
            checkRevengeMissileShieldCollision(this);
        }
    }
    
    handleEnemyDefeat(enemy, index) {
        const now = Date.now();
        const xpGain = enemy.experienceValue * this.upgrades.xpMultiplier;
        this.experience += xpGain;

        let scoreGain = 0;
        if (enemy.type === 'customBoss') {
            scoreGain = 1000;
            this.particles.push(...createExplosionParticles(enemy.x, enemy.y)); // Boss death uses large explosion
            this.gameOver(true);
        } else {
            scoreGain = 50;
            this.particles.push(...createSmallExplosion(enemy.x, enemy.y)); // RESTORED regular enemy death explosion
        }
        this.score += scoreGain;
        this.planesDestroyed++;

        this.addFloatingText(`+${scoreGain.toFixed(0)}`, enemy.x, enemy.y, { color: 'white', size: 16 });
        this.addFloatingText(`+${xpGain.toFixed(0)} XP`, enemy.x, enemy.y - 20, { color: '#4A90E2', size: 14 });

        // --- Drops ---
        // Force heart drop if this is the last pre-boss enemy and player is missing health
        if (enemy === this.lastPreBossEnemy && this.player.health < this.maxHealth) {
            this.healthBoosts.push(createHealthBoost(enemy.x, enemy.y));
            this.lastPreBossEnemy = null; // Only do this once
        } else {
            // Health Boost
            if (this.player.health < this.maxHealth) { // Only consider dropping if not at full health
                let dropChance = 0.05; // Default drop chance is 5%
                if (this.player.health === 1 || this.player.health < this.maxHealth * 0.40) {
                    dropChance = 0.10; // Increase to 10% if health is 1 or below 40%
                }

                if (Math.random() < dropChance) {
                    this.healthBoosts.push(createHealthBoost(enemy.x, enemy.y));
                }
            }
        }

        // Powerup Drop (Global Cooldown Logic)
        if (enemy.type !== 'customBoss') {
            const timeSinceLastDrop = now - this.lastPowerupDropTime;
            let currentDropChance;

            // Determine drop chance based on global cooldown
            if (timeSinceLastDrop <= C.POWERUP_GLOBAL_COOLDOWN_DURATION) {
                currentDropChance = C.POWERUP_GLOBAL_COOLDOWN_CHANCE; // 5%
            } else {
                currentDropChance = C.POWERUP_DROP_CHANCE_BASE; // 10%
            }

            if (Math.random() < currentDropChance) {
                // Spawn a random powerup (no type filtering needed)
                const newPowerup = createPowerup(enemy.x, enemy.y);
                if (newPowerup) {
                    this.powerups.push(newPowerup);
                    this.lastPowerupDropTime = now; // Update last drop time
                    console.log(`>>> Powerup Dropped (Chance: ${currentDropChance * 100}%)! Type: ${newPowerup.type}.`);
                }
        } else {
                // console.log(`Powerup drop failed (Chance: ${currentDropChance*100}%)`);
            }
        }
        // --- End Drops ---

        this.enemies.splice(index, 1);
    }
    
    handleEscortDefeat(escort, index, killedByPlayer = false) {
        if (!escort.active) return; // Prevent multiple defeats
        escort.active = false;
        
        this.particles.push(...createEscortExplosion(escort.x, escort.y));
        
        // Spawn revenge missile regardless of kill reason
        this.enemyMissiles.push(createRevengeMissile(escort, this.player));

        if (killedByPlayer) {
            // Escort killed by player - NO score or XP awarded
            // console.log("Escort defeated by player.");
        } else {
             // If not killed by player (e.g., shield break explosion)
             // We already spawned the revenge missile above, so nothing else needed here
        }
        
        // Optionally remove from array immediately or handle cleanup elsewhere
        // this.bossEscorts.splice(index, 1);
    }
    
    handlePlayerHit(source) {
        if (this.player.invulnerable) return;
        
        const damage = source.damage || 1;
        this.player.takeDamage(damage);
        this.startVibration();
        
                        if (this.player.health <= 0) {
            this.gameOver(false);
            } else {
                        this.player.invulnerable = true;
                        this.player.lastHitTime = Date.now();
        }
    }
    
    checkLaserCollision(boss) {
        if (!boss || !boss.laserAttackActive || boss.isPreparingLaser) return;
        
        const laserX = boss.x;
        const laserWidth = 6;
        const laserYStart = boss.y + boss.height / 2.2;
        
        const playerLeft = this.player.x - this.player.width / 2;
        const playerRight = this.player.x + this.player.width / 2;
        const playerTop = this.player.y - this.player.height / 2;
        const playerBottom = this.player.y + this.player.height / 2;
        
        const laserLeft = laserX - laserWidth / 2;
        const laserRight = laserX + laserWidth / 2;
        
        if (playerRight > laserLeft && playerLeft < laserRight && playerBottom > laserYStart) {
            const dx = this.player.x - laserX;
            const distSq = dx * dx;
            if (distSq < Math.pow(this.player.width/2 + laserWidth/2, 2)) {
                // Use standard damage handling with 1 damage
                this.handlePlayerHit({ damage: 1 });
            }
        }
    }
    
    storePlayerPositionForLaser() {
        this.playerLaserTargetX = this.player.x;
        this.playerLaserTargetY = this.player.y;
    }
    
    startVibration() {
                this.vibrationStartTime = Date.now();
    }
    
    draw() {
        const now = Date.now();
        let vibrationX = 0, vibrationY = 0, vibrationRot = 0;
        
        if (now < this.vibrationStartTime + this.vibrationDuration) {
            const elapsed = now - this.vibrationStartTime;
            const progress = elapsed / this.vibrationDuration;
            const shake = Math.sin(progress * Math.PI * 4);
            vibrationX = (Math.random() - 0.5) * 2 * this.vibrationIntensity * shake;
            vibrationY = (Math.random() - 0.5) * 2 * this.vibrationIntensity * shake;
            vibrationRot = (Math.random() - 0.5) * 2 * this.vibrationRotation * shake;
        }
        const vibration = { x: vibrationX, y: vibrationY, rot: vibrationRot };
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.player.draw(this.ctx, vibration, this.debugMode);
        
        drawPlayerBullets(this.bullets, this.ctx, vibration);
        
        for (const enemy of this.enemies) {
            if (enemy.type === 'customBoss') {
                drawBoss(enemy, this.ctx, vibration, this.debugMode);
            } else {
                drawRegularEnemy(enemy, this.ctx, vibration, this.debugMode, getWingPoints);
            }
        }
        
        drawEscorts(this.bossEscorts, this.ctx);
        
        drawEnemyBullets(this.enemyBullets, this.ctx, vibration);
        
        drawEnemyMissiles(this.enemyMissiles, this.ctx, vibration);
        
        drawParticles(this.particles, this.ctx);
        
        drawHealthBoosts(this.healthBoosts, this.ctx);
        
        drawPowerups(this.powerups, this.ctx);
        
        if (this.showBossHealthBar) {
            const boss = this.enemies.find(e => e.type === 'customBoss');
            if (boss) {
                const displayHealth = boss.invincibleDuringEntrance
                    ? boss.displayedHealthPercentage * boss.maxHitPoints
                    : boss.hitPoints;
                drawBossHealthBar(this.ctx, displayHealth, boss.maxHitPoints, this.canvas.width);
            }
        } else {
            drawLevelInfo(this.ctx, this.experience, this.experienceToNextLevel, this.canvas.width);
        }
        drawScore(this.ctx, this.score, !this.gameStarted, this.canvas.width, this.canvas.height);
        drawHearts(this.ctx, this.player.health, this.maxHealth);
        drawActivePowerups(this.ctx, this.activePowerups);
        drawFloatingTexts(this.ctx, this.floatingTexts);
        drawLowHealthWarning(this.ctx, this.player.health, this.canvas.width, this.canvas.height);
        
        if (this.developerMode) {
            const currentTime = performance.now();
            this.frameCount++;
            if (currentTime - this.fpsUpdateTime > 500) {
                this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime));
                this.fpsUpdateTime = currentTime;
                this.frameCount = 0;
            }
            drawDeveloperInfo(this.ctx, this, this.canvas.height);
            // Draw player hitbox as triangle
            this.player.drawHitbox(this.ctx);
        }
    }
    
    addFloatingText(value, x, y, options = {}) {
        this.floatingTexts.push({
            value: value,
                x: x,
                y: y,
            life: options.life || 1.0,
            color: options.color || 'white',
            size: options.size || 20
        });
    }
    
    addParticle(particleData) {
        this.particles.push(particleData);
    }
    
    addEnemyProjectile(sourceType, sourceEnemy) {
        const projectiles = spawnSpecificEnemyProjectile(sourceType, sourceEnemy, this.player);
        // Safety checks remain, debug logs removed
        if (projectiles.bullets && projectiles.bullets instanceof Array) this.enemyBullets.push(...projectiles.bullets);
        else if (projectiles.bullets && !(projectiles.bullets instanceof Array)) console.error("RUNTIME_WARNING: projectiles.bullets was not an array in addEnemyProjectile");
        
        if (projectiles.missiles && projectiles.missiles instanceof Array) this.enemyMissiles.push(...projectiles.missiles);
        else if (projectiles.missiles && !(projectiles.missiles instanceof Array)) console.error("RUNTIME_WARNING: projectiles.missiles was not an array in addEnemyProjectile");
    }
    
    addScheduledProjectiles(projectilesDataArray) {
        // Safety checks remain, debug logs removed
        if (projectilesDataArray && projectilesDataArray.length > 0 && projectilesDataArray instanceof Array && this.scheduledProjectiles instanceof Array) {
            this.scheduledProjectiles.push(...projectilesDataArray);
        } else {
            if (!(projectilesDataArray instanceof Array)) {
                // console.error("RUNTIME_WARNING: projectilesDataArray was not an array in addScheduledProjectiles.");
            }
            if (!(this.scheduledProjectiles instanceof Array)) {
                // console.error("RUNTIME_WARNING: this.scheduledProjectiles was not an array in addScheduledProjectiles.");
            }
        }
    }
    
    gameOver(playerWon) {
        this.gameStarted = false;
        
        // Remove visible class from canvas for fade out
        this.canvas.classList.remove('visible');
        
        // Wait for canvas fade out before showing menu
        setTimeout(() => {
            this.menu.classList.remove('hidden');
            const levelButton = document.querySelector('.level-button');
            levelButton.textContent = playerWon ? "Level 1 (Completed!)" : "Level 1 (Try Again)";
            if (document.exitPointerLock) document.exitPointerLock();
            
            this.draw();
            this.canvas.style.cursor = 'auto';
        }, 500); // Match transition duration
    }
    
    gameLoop() {
        if (!this.gameStarted) {
            if (this.player.health <= 0 || (this.customBossSpawned && !this.enemies.find(e=>e.type==='customBoss'))) {
                this.draw();
            }
            return;
        }
        
        if (!this.pausedForUpgrade) {
            this.update();
        }
        
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    getAvailableUpgrades() {
        const availableUpgrades = [];
        
        // Fire Rate - always available
        availableUpgrades.push({
            id: 'fireRate',
            name: 'Fire Rate +20%',
            // Only show the permanent upgrade boost, not temporary/boss boosts
            description: `Shoot faster (Current boost: ${this.upgrades.fireRateBoost.toFixed(0)}%)`,
            color: '#4A90E2',
            action: () => {
                this.upgrades.fireRateBoost += 20;
                // Recalculate bullet interval based on percentage boost
                this.bulletInterval = this.upgrades.baseBulletInterval / (1 + this.upgrades.fireRateBoost / 100);
            }
        });
        // ... existing code ...
    }
}

window.addEventListener('load', () => {
    const game = new Game();
}); 