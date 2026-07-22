// =============================================================================
// A* PATHFINDER WITH COSMIC DENSITY PENALTY MECHANICS
// =============================================================================

var generatedPaths = [];

/**
 * Calculates local node density penalty based on Voronoi cell area / edge length.
 * Larger cell area = sparser region = higher penalty cost for A*.
 */
function getNodePenalty(node) {
    if (!node.cellPolygons || node.cellPolygons.length < 3) {
        return 1.0; // Default baseline
    }

    // Estimate Voronoi Cell Area using Shoelace Formula
    let area = 0;
    let pts = node.cellPolygons;
    for (let i = 0; i < pts.length; i++) {
        let j = (i + 1) % pts.length;
        area += pts[i].x * pts[j].y;
        area -= pts[j].x * pts[i].y;
    }
    area = Math.abs(area) / 2.0;

    // Scale penalty: larger cell area = higher penalty multiplier
    return area;
}

/**
 * Heuristic Function (h): Standard Euclidean distance to target end node.
 */
function heuristic(nodeA, nodeB) {
    let dx = nodeA.point.x - nodeB.point.x;
    let dy = nodeA.point.y - nodeB.point.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Custom A* Search implementation using Edge Weight Penalties
 */
function findPathAStar(startNode, endNode, penaltyWeight = 2.0) {
    let openSet = [startNode];
    let cameFrom = new Map();

    let gScore = new Map();
    let fScore = new Map();

    // Normalize penalties across all nodes
    let maxArea = 1;
    voronoiPoints.forEach(p => {
        let pVal = getNodePenalty(p);
        if (pVal > maxArea) maxArea = pVal;
    });

    voronoiPoints.forEach(p => {
        gScore.set(p, Infinity);
        fScore.set(p, Infinity);
    });

    gScore.set(startNode, 0);
    fScore.set(startNode, heuristic(startNode, endNode));

    while (openSet.length > 0) {
        // Pick open node with lowest total estimated cost f(n) = g(n) + h(n)
        openSet.sort((a, b) => fScore.get(a) - fScore.get(b));
        let current = openSet.shift();

        if (current === endNode) {
            // Reconstruct path array
            let path = [current];
            while (cameFrom.has(current)) {
                current = cameFrom.get(current);
                path.unshift(current);
            }
            return path;
        }

        if (!current.neighbors) continue;

        for (let neighbor of current.neighbors) {
            // Distance between parent and neighbor
            let baseDistance = heuristic(current, neighbor);

            // Calculate Void Penalty Multiplier for the target neighbor node
            let normalizedPenalty = getNodePenalty(neighbor) / maxArea; // Range 0 to 1
            let penaltyMultiplier = 1.0 + (penaltyWeight * normalizedPenalty);

            // Cost g(n) = g(parent) + penalized step cost
            let stepCost = baseDistance * penaltyMultiplier;
            let tentativeG = gScore.get(current) + stepCost;

            if (tentativeG < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeG);
                fScore.set(neighbor, tentativeG + heuristic(neighbor, endNode));

                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return null; // Path blocked or unnavigable
}

/**
 * Runs pathfinding across all tagged Start and End groups.
 */
function computeAllPaths() {
    generatedPaths = [];

    let startNodes = voronoiPoints.filter(p => p.isStart);
    let endNodes = voronoiPoints.filter(p => p.isEnd);

    if (startNodes.length === 0 || endNodes.length === 0) return;

    // Get penalty multiplier strength from slider input (defaulting to 2.0 if missing)
    let penaltyInput = document.getElementById('penaltyWeight');
    let penaltyWeight = penaltyInput ? parseFloat(penaltyInput.value) : 2.0;

    startNodes.forEach(start => {
        let targetEnd = null;
        let minDist = Infinity;

        endNodes.forEach(end => {
            let dist = heuristic(start, end);
            if (dist < minDist) {
                minDist = dist;
                targetEnd = end;
            }
        });

        if (targetEnd) {
            let path = findPathAStar(start, targetEnd, penaltyWeight);
            if (path) {
                generatedPaths.push(path);
            }
        }
    });
}

/**
 * Draws the calculated A* paths on canvas.
 */
function drawShortestPath() {
    computeAllPaths();

    if (generatedPaths.length === 0) return;

    let canvas = document.getElementById('aCanvas');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');

    ctx.lineWidth = 3;

    generatedPaths.forEach((path, idx) => {
        const colors = ['#ff0055', '#ffaa00', '#00e5ff', '#33ff00', '#e600ff'];
        ctx.strokeStyle = colors[idx % colors.length];

        ctx.beginPath();
        ctx.moveTo(path[0].point.x, path[0].point.y);

        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].point.x, path[i].point.y);
        }
        ctx.stroke();
    });
}

/**
 * Exports paths to CSV format
 */
function exportPathsCSV() {
    if (generatedPaths.length === 0) {
        alert("No active path to export. Please select Start and End nodes.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Path_ID,Node_Order,RA,Dec,Canvas_X,Canvas_Y\n";

    generatedPaths.forEach((path, pathIdx) => {
        path.forEach((node, nodeIdx) => {
            let row = `${pathIdx + 1},${nodeIdx + 1},${node.ra},${node.dec},${node.point.x},${node.point.y}`;
            csvContent += row + "\n";
        });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "filament_paths_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}