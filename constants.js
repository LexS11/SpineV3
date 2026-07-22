// =============================================================================
// GLOBAL CONSTANTS & HELPER FUNCTIONS
// =============================================================================

/**
 * Returns a random floating-point number between min (inclusive) and max (exclusive).
 * Used by VoronoiPoint when initializing random position defaults.
 */
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Calculates squared Euclidean distance between two 2D points.
 * Avoids Math.sqrt for performance-critical inner loops.
 */
function getDistanceNoSqrt(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return dx * dx + dy * dy;
}