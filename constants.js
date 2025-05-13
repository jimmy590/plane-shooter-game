// Constants for game settings

// Player initial settings & physics
export const PLAYER_INITIAL_HEALTH = 3;
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 40;
export const PLAYER_MAX_SPEED_BASE = 10.0;
export const PLAYER_ACCELERATION = 0.9;
export const PLAYER_TURN_SPEED = 0.35;
export const PLAYER_DECELERATION = 0.08;
export const PLAYER_ROTATION_SPEED = 0.15;
export const PLAYER_INVULNERABLE_TIME = 1500; // ms
export const PLAYER_HIT_FLASH_DURATION = 100; // ms
export const PLAYER_POSITION_HISTORY_MAX_LENGTH = 5;

// Bullet settings
export const PLAYER_BULLET_INTERVAL_BASE = 400; // ms
export const PLAYER_BULLET_SPEED = 10;
export const PLAYER_BULLET_WIDTH = 4;
export const PLAYER_BULLET_HEIGHT = 12;

// Enemy settings
export const BASE_ENEMY_SPAWN_INTERVAL = 2000; // ms
export const BASE_ENEMY_SPEED = 2;
export const ENEMY_SPAWN_RATE_INCREASE_FACTOR = 5; // Interval decreases by this * gameTime
export const MIN_ENEMY_SPAWN_INTERVAL = 500; // ms

// Specific Enemy XP Values
export const XP_BASIC = 100;
export const XP_BASIC_MISSILE = 150;
export const XP_SCOUT = 200;
export const XP_TANK = 300;
export const XP_BOSS = 5000;
export const XP_ESCORT = 25; // Added XP for escorts

// Leveling
export const INITIAL_LEVEL = 0;
export const INITIAL_XP_TO_NEXT_LEVEL = 600;
export const XP_LEVEL_MULTIPLIER = 1.25;
export const XP_INCREASE_FACTOR = 1.5; 
export const XP_BASIC_ENEMY = 10;
export const XP_SWARM_ENEMY = 12;
export const XP_FAST_ENEMY = 15;
export const XP_TANK_ENEMY = 20;

// Powerups
export const POWERUP_DURATION = 10000; // ms
export const POWERUP_WIDTH = 30;
export const POWERUP_HEIGHT = 30;
export const POWERUP_SPEED = 1;
export const POWERUP_TYPES = ['rapidFire', 'shield', 'speedBoost', 'doubleXP'];
export const POWERUP_DROP_CHANCE_BASE = 0.10; // 10% base chance
export const POWERUP_GLOBAL_COOLDOWN_DURATION = 10000; // ms (10s)
export const POWERUP_GLOBAL_COOLDOWN_CHANCE = 0.05; // 5% chance during cooldown

// Health Boosts
export const HEALTH_BOOST_DROP_THRESHOLD = 10; // Planes destroyed
export const HEALTH_BOOST_COOLDOWN = 10000; // ms
export const HEALTH_BOOST_WIDTH = 30;
export const HEALTH_BOOST_HEIGHT = 30;
export const HEALTH_BOOST_SPEED = 0.7; // Slower so hearts stay on screen longer

// Effects
export const EXPLOSION_DURATION = 1000; // ms (for game over)
export const VIBRATION_DURATION = 300; // ms
export const VIBRATION_INTENSITY = 4; // pixels
export const VIBRATION_ROTATION = 0.05; // radians

// Boss Settings
export const BOSS_MAX_HEALTH = 200; // (Was 400)
export const BOSS_TARGET_Y = 60;
export const BOSS_SPEED = 0.25;
export const BOSS_ENTRANCE_SPEED = 0.9; // Entrance speed (slightly slower than original, much faster than normal)
// Boss Movement
export const BOSS_BASE_WAVE_SPEED = 0.005;
export const BOSS_SPEED_VARIATION_INTERVAL = 3000; // ms
export const BOSS_BASE_WAVE_AMPLITUDE = 250;
export const BOSS_AMPLITUDE_VARIATION_INTERVAL = 5000; // ms
export const BOSS_MIN_AMPLITUDE = 200;
export const BOSS_MAX_AMPLITUDE = 450;
export const BOSS_TRANSITION_SPEED = 0.05;
// Boss Attacks
export const BOSS_MISSILE_INTERVAL = 4000; // ms
export const BOSS_MISSILE_SPEED = 4;
export const BOSS_MISSILE_DAMAGE = 1;
export const BOSS_MISSILE_HOMING_STRENGTH_INITIAL = 0.008;
export const BOSS_MISSILE_HOMING_DECAY_RATE = 0.00002;
export const BOSS_MISSILE_HOMING_STRENGTH_MIN = 0.001;
export const BOSS_BARRAGE_INTERVAL_MIN = 6000;
export const BOSS_BARRAGE_INTERVAL_MAX = 8000;
export const BOSS_BARRAGE_EXTRA_ROUND_CHANCE = 0.3;
export const BOSS_BARRAGE_MAIN_ROUND_DELAY = 100;
export const BOSS_BURST_COUNT_MIN = 5;
export const BOSS_BURST_COUNT_MAX = 7;
export const BOSS_BURST_COOLDOWN = 350;
export const BOSS_FINAL_PHASE_BURST_COUNT_MIN = 5;
export const BOSS_FINAL_PHASE_BURST_COUNT_MAX = 7;
export const BOSS_FINAL_PHASE_BURST_COOLDOWN = 350;
export const BOSS_LASER_HEALTH_THRESHOLD = 100;
export const BOSS_LASER_WARNING_DURATION = 1000; // ms
export const BOSS_LASER_FIRING_DURATION = 2000; // ms
export const BOSS_LASER_COOLDOWN_MIN = 4000; // ms
export const BOSS_LASER_COOLDOWN_MAX = 7000; // ms
// Boss Shield
export const BOSS_SHIELD_HEALTH_THRESHOLD = 40; // HP to activate
export const BOSS_SHIELD_INVINCIBLE_THRESHOLD = 21; // HP to become temp invincible before shield
export const BOSS_SHIELD_HEALTH = 2;
export const BOSS_SHIELD_ROCKET_INTERVAL_MIN = 5000; // ms
export const BOSS_SHIELD_ROCKET_INTERVAL_MAX = 10000; // ms
export const BOSS_SHIELD_BREAK_DURATION = 1500; // ms
export const BOSS_FINAL_PHASE_MISSILE_DELAY = 1000; // ms after barrage
// Boss Escorts
export const BOSS_ESCORT_SPAWN_INTERVAL_MIN = 6000; // ms (was 5000)
export const BOSS_ESCORT_SPAWN_INTERVAL_MAX = 8000; // ms (was 7000)
export const BOSS_ESCORT_HEALTH = 25;
export const BOSS_ESCORT_WIDTH = 75;
export const BOSS_ESCORT_HEIGHT = 75;
export const BOSS_ESCORT_SPEED = 0.5;
export const BOSS_ESCORT_BARRAGE_INTERVAL = 2500; // ms
export const BOSS_ESCORT_REVENGE_MISSILE_SPEED = 0.75;
export const BOSS_ESCORT_REVENGE_MISSILE_ACCEL = 0.022;
export const BOSS_ESCORT_REVENGE_MISSILE_HOMING = 0.02;
// Revenge Missile Constants (NEW)
export const BOSS_ESCORT_REVENGE_MISSILE_WIDTH = 12; 
export const BOSS_ESCORT_REVENGE_MISSILE_HEIGHT = 30;
export const BOSS_ESCORT_REVENGE_MISSILE_COLOR = '#A0A0A0'; // Gray
export const BOSS_ESCORT_REVENGE_MISSILE_DAMAGE = 1;
export const BOSS_ESCORT_REVENGE_MISSILE_INITIAL_SPEED = 1.2;
export const BOSS_ESCORT_REVENGE_MISSILE_ACCELERATION = 0.022;
export const BOSS_ESCORT_REVENGE_MISSILE_MAX_SPEED = 5;
export const BOSS_ESCORT_REVENGE_MISSILE_HOMING_FACTOR = 0.03;
export const BOSS_ESCORT_LIMIT = 3;

// Timescale for Enemy Availability
export const TIME_TANK_SPAWN = 25; // seconds
export const TIME_SCOUT_SPAWN = 40; // seconds
export const TIME_BOSS_SPAWN = 120; // seconds

// Misc
export const DEBUG_MODE_ENABLED = false;
export const DEVELOPER_MODE_ENABLED = false;

// Score
export const SCORE_BASIC_ENEMY = 10;
export const SCORE_SWARM_ENEMY = 12;
export const SCORE_FAST_ENEMY = 15;
export const SCORE_TANK_ENEMY = 20;
export const SCORE_BOSS = 1000;
export const SCORE_ESCORT = 50; // Added score for escorts

export {}; // Placeholder export 