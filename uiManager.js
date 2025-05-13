import * as C from './constants.js';
// Import powerup drawing helpers if they are needed for active powerup display
import { drawRapidFireIcon, drawShieldIcon, drawBootsIcon, drawMultiplier } from './powerup.js';

/** Draws the score display */
export function drawScore(ctx, score, isGameOver, canvasWidth, canvasHeight) {
    ctx.fillStyle = 'white';
    if (isGameOver) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(`Final Score: ${score}`, canvasWidth / 2, canvasHeight / 2);
        ctx.font = 'bold 64px Arial';
        ctx.fillText('Game Over', canvasWidth / 2, canvasHeight / 2 - 80);
    } else {
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Score: ${score}`, canvasWidth - 20, 50);
    }
}

/** Draws the player health hearts */
export function drawHearts(ctx, currentHealth, maxHealth) {
    ctx.save();
    const heartSize = 40;
    const padding = 12;
    for (let i = 0; i < maxHealth; i++) {
        const x = padding + i * (heartSize + padding);
        const y = padding;
        ctx.beginPath();
        ctx.moveTo(x + heartSize / 2, y + heartSize / 4);
        ctx.bezierCurveTo(x, y, x, y + heartSize / 2, x + heartSize / 2, y + heartSize);
        ctx.bezierCurveTo(x + heartSize, y + heartSize / 2, x + heartSize, y, x + heartSize / 2, y + heartSize / 4);
        if (i < currentHealth) {
            ctx.fillStyle = 'red';
            ctx.fill();
        } else {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }
    ctx.restore();
}

/** Draws the XP bar */
export function drawLevelInfo(ctx, experience, experienceToNextLevel, canvasWidth) {
    const barWidth = 400;
    const barHeight = 20;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = 15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const progress = experience / experienceToNextLevel;
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(barX, barY, barWidth * Math.min(1, progress), barHeight);
}

/** Draws the boss health bar */
export function drawBossHealthBar(ctx, currentHealth, maxHealth, canvasWidth) {
    const barWidth = 400;
    const barHeight = 15;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = 15;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const healthPercent = Math.max(0, currentHealth / maxHealth);
    ctx.fillStyle = '#FF0000'; // Red
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

/** Updates floating text positions and lifetimes */
export function updateFloatingTexts(floatingTexts) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const text = floatingTexts[i];
        text.y -= 1; // Move up slowly
        text.life -= 0.02; // Fade out
        if (text.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

/** Draws floating text messages */
export function drawFloatingTexts(ctx, floatingTexts) {
    ctx.save();
    ctx.textAlign = 'center';
    for (const text of floatingTexts) {
        ctx.fillStyle = text.color || 'white';
        ctx.globalAlpha = text.life;
        ctx.font = `${text.size || 20}px Arial`;
        ctx.fillText(text.value, text.x, text.y);
    }
    ctx.restore(); // Restores alpha and other settings
}

/** Draws developer mode information */
export function drawDeveloperInfo(ctx, game, canvasHeight) {
    const startY = canvasHeight - 160; // Base Y position
    const lineHeight = 15; // Adjusted line height to match original monospace better
    ctx.save(); // Save context before changing style
    ctx.fillStyle = 'white'; // <<< Restore original white color
    ctx.font = '12px monospace'; // <<< Restore original monospace font
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom'; // Use bottom baseline like original potentially did
    const padding = 10; // Use padding like original

    // Dev Commands List (adjust Y positions)
    let y = canvasHeight - padding; // Start from bottom with padding
    ctx.fillText(`U: Spawn Powerup`, padding, y); y -= lineHeight;
    ctx.fillText(`H: Spawn Health Boost`, padding, y); y -= lineHeight;
    ctx.fillText(`D: Debug Hitboxes (${game.debugMode ? 'ON' : 'OFF'})`, padding, y); y -= lineHeight;
    ctx.fillText('P: Level Up', padding, y); y -= lineHeight;
    ctx.fillText('O: Game Time +10s', padding, y); y -= lineHeight;
    ctx.fillText('S+6: Boss Final Phase', padding, y); y -= lineHeight;
    ctx.fillText('S+7: Boss Shield Phase', padding, y); y -= lineHeight;
    ctx.fillText('S+8: Boss HP=100', padding, y); y -= lineHeight;
    ctx.fillText('S+9: Boss HP=150', padding, y); y -= lineHeight;
    ctx.fillText(`8: Toggle Invincibility (${game.player.devModeInvulnerable ? 'ON' : 'OFF'})`, padding, y); y -= lineHeight;
    ctx.fillText(`9: Toggle Shooting (${game.shootingEnabled ? 'ON' : 'OFF'})`, padding, y); y -= lineHeight;
    ctx.fillText(`0: Toggle Dev Mode (${game.developerMode ? 'ON' : 'OFF'})`, padding, y); y -= lineHeight;
    ctx.fillText('COMMANDS:', padding, y); y -= lineHeight * 1.5; // Extra space before state

    // Game State Info (adjust Y positions)
    ctx.fillText(`Player Pos: (${game.player.x.toFixed(0)}, ${game.player.y.toFixed(0)})`, padding, y); y -= lineHeight;
    ctx.fillText('DEVELOPER MODE', padding, y); y -= lineHeight;
    ctx.fillText(`FPS: ${game.fps}`, padding, y); y -= lineHeight;
    ctx.fillText(`Level: ${game.level}`, padding, y); y -= lineHeight;
    ctx.fillText(`Game Time: ${game.gameRunTime.toFixed(1)}s`, padding, y); y -= lineHeight;
    ctx.fillText(`XP: ${game.experience.toFixed(0)}/${game.experienceToNextLevel}`, padding, y); y -= lineHeight;
    ctx.fillText(`Player HP: ${game.player.health}/${game.maxHealth}`, padding, y); y -= lineHeight;
    ctx.fillText(`Bullets: ${game.bullets.length}`, padding, y); y -= lineHeight;
    ctx.fillText(`Enemy Proj: ${game.enemyBullets.length + game.enemyMissiles.length}`, padding, y); y -= lineHeight;
    ctx.fillText(`Enemies: ${game.enemies.length}`, padding, y); y -= lineHeight;
    ctx.fillText(`Particles: ${game.particles.length}`, padding, y); y -= lineHeight;

    ctx.restore(); // Restore original context style
}

/** Draws the status of active powerups */
export function drawActivePowerups(ctx, activePowerups) {
    if (!activePowerups || activePowerups.length === 0) return;

    ctx.save();
    const iconSize = 30;
    const padding = 12;
    const startY = padding + 40 + padding; // Below hearts
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    activePowerups.forEach((powerup, index) => {
        const y = startY + index * (iconSize + 10);
        const x = padding;
        const timeRemaining = Math.max(0, (C.POWERUP_DURATION - (Date.now() - powerup.startTime)) / 1000);
        const timeRemainingText = timeRemaining.toFixed(1) + 's';

        // Save context for icon drawing
        ctx.save();
        ctx.translate(x + iconSize / 2, y + iconSize / 2);
        ctx.fillStyle = '#0080FF'; // Use the same blue as falling powerups

        // Draw icon using helpers from powerup.js
        switch (powerup.type) {
            case 'rapidFire': drawRapidFireIcon(ctx, 0, 0, iconSize / 2); break;
            case 'shield': drawShieldIcon(ctx, 0, 0, iconSize / 2); break;
            case 'speedBoost': drawBootsIcon(ctx, 0, 0, iconSize / 2); break;
            case 'doubleScore': drawMultiplier(ctx, 0, 0, iconSize); break; // Use slightly larger font size
        }
        ctx.restore(); // Restore context after drawing icon

        // Draw text label
        ctx.fillStyle = 'white';
        let label = powerup.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Format label
        ctx.fillText(label, x + iconSize + 5, y + iconSize / 2);

        // Draw time remaining text
        ctx.fillText(timeRemainingText, x + iconSize + 120, y + iconSize / 2);

        // Draw progress bar
        const barWidth = 60;
        const barHeight = 6;
        const barX = x + iconSize + 165;
        const barY = y + iconSize / 2 - barHeight / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const progress = timeRemaining / (C.POWERUP_DURATION / 1000);
        ctx.fillStyle = '#0080FF';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    });

    ctx.restore();
}

/** Draws the low health pulsating red border warning */
export function drawLowHealthWarning(ctx, playerHealth, canvasWidth, canvasHeight) {
     if (playerHealth === 1) {
        const time = Date.now();
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(canvasWidth, canvasHeight) / 1.2
        );
        const wave = Math.sin(time * 0.002) * 0.15 + 0.25;
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(0.3, `rgba(255, 0, 0, ${wave * 0.3})`);
        gradient.addColorStop(0.6, `rgba(255, 0, 0, ${wave * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, ${wave * 0.7})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
}

// Add helper drawing functions if needed 