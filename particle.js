// Particle effects logic

import * as C from './constants.js';

/**
 * Creates particles for a standard explosion.
 * @param {number} x - Center x coordinate.
 * @param {number} y - Center y coordinate.
 * @returns {Array<object>} Array of particle objects.
 */
export function createExplosionParticles(x, y) {
    const particles = [];
    const numParticles = 30;
    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.PI * 2 * i) / numParticles;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 3,
            color: `hsl(${Math.random() * 30 + 15}, 100%, 50%)`, // Orange/red
            life: 1.0,
            shape: 'circle'
        });
    }
    return particles;
}

/**
 * Creates particles for a smaller explosion effect.
 * @param {number} x - Center x coordinate.
 * @param {number} y - Center y coordinate.
 * @returns {Array<object>} Array of particle objects.
 */
export function createSmallExplosion(x, y) {
    const particles = [];
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.PI * 2 * i) / numParticles;
        const speed = 1 + Math.random() * 2;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 2,
            color: `hsl(${Math.random() * 30 + 15}, 100%, 50%)`,
            life: 0.8,
            shape: 'circle'
        });
    }
    return particles;
}

/**
 * Creates particles for an escort explosion.
 * @param {number} x - Center x coordinate.
 * @param {number} y - Center y coordinate.
 * @returns {Array<object>} Array of particle objects.
 */
export function createEscortExplosion(x, y) {
    const particles = [];
    const numParticles = 50;
    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.PI * 2 * i) / numParticles;
        const speed = 1.2 + Math.random() * 2.8;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3.5 + Math.random() * 3.5,
            color: `hsl(${Math.random() * 30 + 15}, 100%, 50%)`,
            life: 0.7 + Math.random() * 0.4,
            shape: 'circle'
        });
    }
    return particles;
}

/**
 * Creates particles for a larger missile-escort collision explosion.
 * @param {number} x - Center x coordinate.
 * @param {number} y - Center y coordinate.
 * @returns {Array<object>} Array of particle objects.
 */
export function createMissileEscortCollisionExplosion(x, y) {
    const particles = [];
    const numParticles = 45;
    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.PI * 2 * i) / numParticles;
        const speed = 0.5 + Math.random() * 2.5;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 2.5,
            color: `hsl(${Math.random() * 40 + 10}, 100%, 50%)`,
            life: 0.5 + Math.random() * 0.4,
            shape: 'circle'
        });
    }
    return particles;
}

/**
 * Creates particles for a shield impact effect.
 * @param {number} x - Impact x coordinate.
 * @param {number} y - Impact y coordinate.
 * @returns {Array<object>} Array of particle objects.
 */
export function createShieldImpactEffect(x, y) {
    const particles = [];
    const numParticles = 8;
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 1.5;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 1 + Math.random() * 2,
            color: `rgba(180, 220, 255, ${0.5 + Math.random() * 0.5})`,
            life: 0.2 + Math.random() * 0.2,
            shape: 'circle'
        });
    }
    return particles;
}

/**
 * Creates particles for the shield breaking effect.
 * @param {number} x - Center x coordinate.
 * @param {number} y - Center y coordinate.
 * @returns {Array<object>} Array of particle objects.
 */
export function createShieldBreakEffect(x, y) {
    const particles = [];
    const numParticles = 40;
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 3,
            color: `rgba(150, 200, 255, ${0.6 + Math.random() * 0.4})`,
            life: 0.5 + Math.random() * 0.5,
            shape: 'circle'
        });
    }
    return particles;
}

/**
 * Creates boss engine exhaust particles.
 * @param {object} boss - The boss object.
 * @returns {Array<object>} Array of particle objects.
 */
export function createBossEngineParticles(boss) {
    const particles = [];
    const particleCountPerEngine = 2;
    const engineYOffset = boss.height / 4;
    const enginePositions = [
        { x: boss.x - boss.width / 3, y: boss.y + engineYOffset }, // Left
        { x: boss.x + boss.width / 3, y: boss.y + engineYOffset }  // Right
    ];

    for (const pos of enginePositions) {
        for (let i = 0; i < particleCountPerEngine; i++) {
            particles.push({
                x: pos.x,
                y: pos.y,
                vx: (Math.random() - 0.5) * 1.0,
                vy: Math.random() * 3 + 4,
                size: Math.random() * 2 + 1,
                color: Math.random() < 0.7 ? '#ff7700' : '#ffaa00',
                alpha: 0.7,
                fadeRate: 0.04 + Math.random() * 0.04,
                shape: 'circle'
            });
        }
    }
    return particles;
}

/**
 * Updates the state of all active particles.
 * @param {Array<object>} particles - The main array of particle objects.
 */
export function updateParticles(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // Update position
        particle.x += particle.vx || 0; // Use velocityX if available
        particle.y += particle.vy || 0; // Use velocityY if available

        // Update rotation for line particles
        if (particle.shape === 'line') {
            particle.angle = (particle.angle || 0) + (particle.rotationSpeed || 0);
        }

        // Update life/alpha
        if (particle.alpha !== undefined) {
            particle.alpha -= particle.fadeRate || 0.02;
            if (particle.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }
        } else {
            particle.life -= 0.02;
            if (particle.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
        }
    }
}

/**
 * Draws all active particles.
 * @param {Array<object>} particles - The main array of particle objects.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawParticles(particles, ctx) {
    for (const p of particles) {
        if (typeof p.x !== 'number' || typeof p.y !== 'number' || isNaN(p.x) || isNaN(p.y) || (p.x === 0 && p.y === 0)) {
            continue;
        }

        ctx.save();
        const alpha = p.alpha !== undefined ? p.alpha : (p.life !== undefined ? Math.max(0, p.life * 2) : 1.0);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha)); // Ensure alpha is valid
        ctx.fillStyle = p.color || 'white';

        if (p.shape === 'line') {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle || 0);
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else { // Default to circle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    // ctx.globalAlpha = 1.0; // Game loop should reset alpha if needed after all drawing
}
 