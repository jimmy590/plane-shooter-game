import * as C from './constants.js';
import { getWingPoints } from './utils.js';

// Player class

export class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height - 50;
        this.width = C.PLAYER_WIDTH;
        this.height = C.PLAYER_HEIGHT;
        this.maxSpeed = C.PLAYER_MAX_SPEED_BASE;
        this.acceleration = C.PLAYER_ACCELERATION;
        this.turnSpeed = C.PLAYER_TURN_SPEED;
        this.deceleration = C.PLAYER_DECELERATION;
        this.rotationSpeed = C.PLAYER_ROTATION_SPEED;
        this.invulnerableTime = C.PLAYER_INVULNERABLE_TIME;
        this.hitFlashDuration = C.PLAYER_HIT_FLASH_DURATION;
        this.positionHistoryMaxLength = C.PLAYER_POSITION_HISTORY_MAX_LENGTH;

        // Dynamic state
        this.velocityX = 0;
        this.velocityY = 0;
        this.targetVelocityX = 0;
        this.targetVelocityY = 0;
        this.rotation = 0; // In radians, 0 is pointing up
        this.targetRotation = 0;
        this.health = C.PLAYER_INITIAL_HEALTH;
        this.maxHealth = C.PLAYER_INITIAL_HEALTH;
        this.invulnerable = false;
        this.lastHitTime = 0;
        this.hitFlashStartTime = 0; // Track when hit flash started
        this.devModeInvulnerable = false; // Separate flag for dev mode invincibility
        this.positionHistory = []; // Array to store recent positions for better collision detection

        // <<< ADD INITIALIZATION FOR BULLET DAMAGE >>>
        this.bulletDamage = 1; // Default damage

        // Mouse tracking info - needed for player movement logic
        this.lastMouseMoveTime = 0;
    }

    reset(canvas) {
        this.x = canvas.width / 2;
        this.y = canvas.height - 50;
        this.velocityX = 0;
        this.velocityY = 0;
        this.targetVelocityX = 0;
        this.targetVelocityY = 0;
        this.rotation = 0;
        this.targetRotation = 0;
        this.health = C.PLAYER_INITIAL_HEALTH;
        this.maxHealth = C.PLAYER_INITIAL_HEALTH;
        this.invulnerable = false;
        this.lastHitTime = 0;
        this.hitFlashStartTime = 0;
        this.devModeInvulnerable = false;
        this.positionHistory = [];

        // <<< ADD RESET FOR BULLET DAMAGE >>>
        this.bulletDamage = 1; // Reset to default damage

        // Explicitly reset movement stats to base values
        this.maxSpeed = C.PLAYER_MAX_SPEED_BASE;
        this.acceleration = C.PLAYER_ACCELERATION;
        this.deceleration = C.PLAYER_DECELERATION;
        // Optionally reset turnSpeed and rotationSpeed if they can be upgraded?
        // this.turnSpeed = C.PLAYER_TURN_SPEED;
        // this.rotationSpeed = C.PLAYER_ROTATION_SPEED;
    }

    update(inputState) {
        const timeSinceLastMove = Date.now() - inputState.lastMouseMoveTime;

        const targetVelBeforeX = this.targetVelocityX;
        const targetVelBeforeY = this.targetVelocityY;

        // Check if mouse moved recently
        if (timeSinceLastMove <= 16) { // Check if WITHIN threshold
            // Update target velocity based on current input
            this.targetVelocityX = inputState.mouseVelocityX * this.acceleration;
            this.targetVelocityY = inputState.mouseVelocityY * this.acceleration;

            // Limit target speed
            const targetSpeed = Math.sqrt(this.targetVelocityX * this.targetVelocityX +
                                        this.targetVelocityY * this.targetVelocityY);
            if (targetSpeed > this.maxSpeed) {
                const ratio = this.maxSpeed / targetSpeed;
                this.targetVelocityX *= ratio;
                this.targetVelocityY *= ratio;
            }
        } else {
            // Mouse hasn't moved recently - apply deceleration to existing target velocity
            this.targetVelocityX *= (1 - this.deceleration);
            this.targetVelocityY *= (1 - this.deceleration);

            // Force stop target velocity when very small
            if (Math.abs(this.targetVelocityX) < 0.1) this.targetVelocityX = 0;
            if (Math.abs(this.targetVelocityY) < 0.1) this.targetVelocityY = 0;
        }

        // Store current position in history before updating
        this.positionHistory.push({x: this.x, y: this.y});

        // Trim history to max length
        if (this.positionHistory.length > this.positionHistoryMaxLength) {
            this.positionHistory.shift();
        }

        // Update target rotation based on horizontal velocity
        const rotationScaleFactor = 0.5; // Adjust this value to control bank intensity
        this.targetRotation = -this.velocityX * rotationScaleFactor / this.maxSpeed;

        // Smoothly interpolate current rotation towards target rotation
        this.rotation += (this.targetRotation - this.rotation) * this.rotationSpeed;

        // Smoothly interpolate current velocity towards target velocity
        this.velocityX += (this.targetVelocityX - this.velocityX) * this.turnSpeed;
        this.velocityY += (this.targetVelocityY - this.velocityY) * this.turnSpeed;

        // Force stop when velocity is very small
        if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
        if (Math.abs(this.velocityY) < 0.1) this.velocityY = 0;

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep player within canvas bounds
        if (this.x < this.width / 2) {
            this.x = this.width / 2;
            this.velocityX = 0;
            this.targetVelocityX = 0;
        }
        if (this.x > this.canvas.width - this.width / 2) {
            this.x = this.canvas.width - this.width / 2;
            this.velocityX = 0;
            this.targetVelocityX = 0;
        }
        if (this.y < this.height / 2) {
            this.y = this.height / 2;
            this.velocityY = 0;
            this.targetVelocityY = 0;
        }
        if (this.y > this.canvas.height - this.height / 2) {
            this.y = this.canvas.height - this.height / 2;
            this.velocityY = 0;
            this.targetVelocityY = 0;
        }

        // Update invulnerability status
        if (this.invulnerable && !this.devModeInvulnerable) {
            const timeSinceHit = Date.now() - this.lastHitTime;
            if (timeSinceHit > this.invulnerableTime) {
                this.invulnerable = false;
            }
        }
    }

    draw(ctx, vibration, debugMode) {
        ctx.save();

        // Apply ONLY vibration offset and rotation
        ctx.translate(this.x + vibration.x, this.y + vibration.y);
        ctx.rotate(vibration.rot); // Only vibration rotation here

        // Determine fill style based on state
        const timeSinceHitFlash = Date.now() - this.hitFlashStartTime;
        if (timeSinceHitFlash < this.hitFlashDuration) {
            ctx.fillStyle = '#FF0000'; // Bright red flash
        } else if (this.invulnerable) {
            const timeSinceHit = Date.now() - this.lastHitTime;
            if (Math.floor(timeSinceHit / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5; // Flashing transparency
            }
            ctx.fillStyle = 'white';
        } else {
            ctx.fillStyle = 'white'; // Normal color
        }

        // Calculate wingtip vertical offset based on rotation for banking effect
        // Adjust the multiplier (this.width / 4) to control bank intensity visually
        const wingTipOffset = this.rotation * (this.width / 4);

        // Draw player shape (rotation is handled by adjusting wingtip Y coordinates)
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2); // Top center (always points up)
        ctx.lineTo(-this.width / 2, this.height / 2 + wingTipOffset); // Left wingtip offset based on rotation
        ctx.lineTo(-this.width / 3, this.height / 2);                 // Inner left bottom
        ctx.lineTo(0, this.height / 2.5);                              // Bottom center notch
        ctx.lineTo(this.width / 3, this.height / 2);                 // Inner right bottom
        ctx.lineTo(this.width / 2, this.height / 2 - wingTipOffset); // Right wingtip offset based on rotation
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset alpha

        // Only draw hitbox in debug mode
        if (debugMode) {
            this.drawHitbox(ctx);
        }

        ctx.restore();
    }

    takeDamage(amount = 1) {
        if (!this.invulnerable) {
            this.health -= amount;
            this.invulnerable = true;
            this.lastHitTime = Date.now();
            this.hitFlashStartTime = Date.now();
            return true; // Damage taken
        }
        return false; // No damage taken
    }

    heal(amount = 1, maxHealthOverride) {
        // Use maxHealthOverride if provided, otherwise use this.maxHealth
        const maxHealth = typeof maxHealthOverride === 'number' ? maxHealthOverride : this.maxHealth;
        this.health = Math.min(this.health + amount, maxHealth);
    }

    applyKnockback(directionX, directionY, force) {
        this.velocityX = directionX * force;
        this.velocityY = directionY * force;
        // Optional: briefly override invulnerability for knockback feedback?
        // this.hitFlashStartTime = Date.now();
    }

    toggleDevInvulnerability() {
        this.devModeInvulnerable = !this.devModeInvulnerable;
        this.invulnerable = this.devModeInvulnerable; // Update main flag
        return this.devModeInvulnerable;
    }

    // Method to be called from Game class handleMouseMove
    handleMouseMove(movementX, movementY) {
         // Update last mouse move time is handled in player update now
        // Calculate target velocity based on mouse movement
        this.targetVelocityX = movementX * this.acceleration;
        this.targetVelocityY = movementY * this.acceleration;

        // Limit target speed
        const targetSpeed = Math.sqrt(this.targetVelocityX * this.targetVelocityX +
                                    this.targetVelocityY * this.targetVelocityY);
        if (targetSpeed > this.maxSpeed) {
            const ratio = this.maxSpeed / targetSpeed;
            this.targetVelocityX *= ratio;
            this.targetVelocityY *= ratio;
        }
    }

     // Called on resize
    handleResize(newWidth, newHeight) {
        this.x = Math.max(this.width / 2, Math.min(this.x, newWidth - this.width / 2));
        this.y = Math.max(this.height / 2, Math.min(this.y, newHeight - this.height / 2));
    }

    getTriangleHitbox() {
        // Assume the triangle points up, centered at (this.x, this.y)
        // Vertices: nose (top), left wing, right wing
        const top = { x: this.x, y: this.y - this.height / 2 };
        const left = { x: this.x - this.width / 2, y: this.y + this.height / 2 };
        const right = { x: this.x + this.width / 2, y: this.y + this.height / 2 };
        return [top, left, right];
    }

    drawHitbox(ctx) {
        const [top, left, right] = this.getTriangleHitbox();
        ctx.save();
        ctx.strokeStyle = 'rgba(0,255,0,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
} 