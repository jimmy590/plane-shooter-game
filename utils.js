// Utility functions can be placed here

/**
 * Calculates the points defining the visual outline of a plane (player or enemy).
 * Used for debug drawing and potentially refined collision detection.
 * @param {object} plane - The player or enemy object.
 * @returns {Array<object>} An array of {x, y} points.
 */
export function getWingPoints(plane) {
    const points = [];
    const isPlayer = plane.positionHistory !== undefined; // Crude check for player object

    // Front points (nose and cockpit area)
    points.push({
        x: plane.x,
        y: plane.y - plane.height/2
    });

    // Left wing points
    const leftWingStartX = plane.x - plane.width/2;
    const leftWingEndX = plane.x - plane.width/3;
    const leftWingY = plane.y;

    // Add points along the left wing's curved shape
    for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        const x = leftWingStartX + (leftWingEndX - leftWingStartX) * t;
        const y = leftWingY - (isPlayer ? plane.height/4 : plane.height/3) * (1 - t * 0.5);
        points.push({ x, y });
    }

    // Left wing tip
    points.push({
        x: plane.x - plane.width/2,
        y: plane.y
    });

    // Left side fuselage points
    for (let i = 0; i <= 3; i++) {
        const t = i / 3;
        const x = plane.x - plane.width/3;
        const y = plane.y + plane.height/2 * t;
        points.push({ x, y });
    }

    // Back points (tail area)
    points.push({
        x: plane.x,
        y: plane.y + plane.height/2
    });

    // Right side fuselage points
    for (let i = 0; i <= 3; i++) {
        const t = i / 3;
        const x = plane.x + plane.width/3;
        const y = plane.y + plane.height/2 * t;
        points.push({ x, y });
    }

    // Right wing points
    const rightWingStartX = plane.x + plane.width/3;
    const rightWingEndX = plane.x + plane.width/2;
    const rightWingY = plane.y;

    // Add points along the right wing's curved shape
    for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        const x = rightWingStartX + (rightWingEndX - rightWingStartX) * t;
        const y = rightWingY - (isPlayer ? plane.height/4 : plane.height/3) * (1 - t * 0.5);
        points.push({ x, y });
    }

    // Right wing tip
    points.push({
        x: plane.x + plane.width/2,
        y: plane.y
    });

    // Add points for tail stabilizers if it's an enemy plane
    if (!isPlayer) {
        // Left tail stabilizer
        points.push({
            x: plane.x - plane.width/4,
            y: plane.y + plane.height/2
        });
        points.push({
            x: plane.x - plane.width/3,
            y: plane.y + plane.height/1.5
        });

        // Right tail stabilizer
        points.push({
            x: plane.x + plane.width/4,
            y: plane.y + plane.height/2
        });
        points.push({
            x: plane.x + plane.width/3,
            y: plane.y + plane.height/1.5
        });
    }

    return points;
}

/**
 * Returns true if point (px, py) is inside the triangle defined by v1, v2, v3.
 * v1, v2, v3 are objects with x and y.
 */
export function pointInTriangle(px, py, v1, v2, v3) {
    // Barycentric technique
    const dX = px - v3.x;
    const dY = py - v3.y;
    const dX21 = v3.x - v2.x;
    const dY12 = v2.y - v3.y;
    const D = dY12 * (v1.x - v3.x) + dX21 * (v1.y - v3.y);
    const s = dY12 * dX + dX21 * dY;
    const t = (v3.y - v1.y) * dX + (v1.x - v3.x) * dY;
    if (D < 0) return s <= 0 && t <= 0 && s + t >= D;
    return s >= 0 && t >= 0 && s + t <= D;
}
 