// Global tuning weights for the cosmic path evaluation engine
var AREA_WEIGHT = 0.3;      // How heavily to penalize low-density/large cells
var DISTANCE_WEIGHT = 2.0;  // How heavily to penalize long, inefficient leaps

function buildGraphFromTriangulation() {
    let graph = new Map();
    voronoiPoints.forEach(p => graph.set(p, []));

    for (let i = 0; i < voronoiPoints.length; i++) {
        for (let j = i + 1; j < voronoiPoints.length; j++) {
            for (let k = j + 1; k < voronoiPoints.length; k++) {
                if (isDelaunayTriangle(i, j, k)) {
                    let pA = voronoiPoints[i];
                    let pB = voronoiPoints[j];
                    let pC = voronoiPoints[k];

                    if (!graph.get(pA).includes(pB)) graph.get(pA).push(pB);
                    if (!graph.get(pA).includes(pC)) graph.get(pA).push(pC);
                    if (!graph.get(pB).includes(pA)) graph.get(pB).push(pA);
                    if (!graph.get(pB).includes(pC)) graph.get(pB).push(pC);
                    if (!graph.get(pC).includes(pA)) graph.get(pC).push(pA);
                    if (!graph.get(pC).includes(pB)) graph.get(pC).push(pB);
                }
            }
        }
    }
    return graph;
}

// Custom scoring function that combines jump distance and cell area (density)
function calculateEdgeCost(nodeA, nodeB) {
    let dx = nodeB.point.x - nodeA.point.x;
    let dy = nodeB.point.y - nodeA.point.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    // Get the cell area footprint of the destination node
    let cellArea = nodeB.pixelCount * (typeof GAP !== 'undefined' ? GAP * GAP : 36);

    // Dynamic cost balance: penalize long jumps and large areas
    return (distance * DISTANCE_WEIGHT) + (cellArea * AREA_WEIGHT);
}

// Standard A* heuristic function: straight line distance to target
function getHeuristic(node, endNode) {
    let dx = endNode.point.x - node.point.x;
    let dy = endNode.point.y - node.point.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function runAStarSearch(graph, start, end) {
    let openSet = new Set([start]);
    let cameFrom = new Map();

    let gScore = new Map();
    let fScore = new Map();

    voronoiPoints.forEach(p => {
        gScore.set(p, Infinity);
        fScore.set(p, Infinity);
    });

    gScore.set(start, 0);
    fScore.set(start, getHeuristic(start, end));

    while (openSet.size > 0) {
        // Find the node in openSet having the lowest fScore value
        let current = null;
        let lowestF = Infinity;
        openSet.forEach(node => {
            if (fScore.get(node) < lowestF) {
                lowestF = fScore.get(node);
                current = node;
            }
        });

        if (current === end) {
            // Reconstruct path
            let path = [current];
            while (cameFrom.has(current)) {
                current = cameFrom.get(current);
                path.unshift(current);
            }
            return path;
        }

        openSet.delete(current);
        let neighbors = graph.get(current) || [];

        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            
            // Calculate movement cost including density penalty
            let edgeCost = calculateEdgeCost(current, neighbor);
            let tentativeGScore = gScore.get(current) + edgeCost;

            if (tentativeGScore < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + getHeuristic(neighbor, end));
                openSet.add(neighbor);
            }
        }
    }
    return null; // No path found
}

function drawShortestPath() {
    try {
        if (typeof voronoiPoints === 'undefined' || !voronoiPoints) return;
        
        let startNode = voronoiPoints.find(p => p.isStart);
        let endNode = voronoiPoints.find(p => p.isEnd);
        if (!startNode || !endNode) return;

        let graph = buildGraphFromTriangulation();
        if (!graph) return;

        // Execute optimized A* structural search
        let path = runAStarSearch(graph, startNode, endNode);

        if (path && path.length > 1) {
            ctx.save();
            ctx.strokeStyle = "#FF8C00"; // Clean orange filament line
            ctx.lineWidth = 5;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            ctx.beginPath();
            ctx.moveTo(path[0].point.x, path[0].point.y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].point.x, path[i].point.y);
            }
            ctx.stroke();
            ctx.restore();
            
            let status = document.getElementById('status');
            if (status) status.textContent = `Path mapped successfully using A* engine (${path.length} nodes).`;
        } else {
            let status = document.getElementById('status');
            if (status && voronoiPoints.length > 0) {
                status.textContent = "Pathfinding Error: Unable to resolve optimal cosmic spine line.";
            }
        }
    } catch (e) {
        console.error("Pathfinding error: ", e);
    }
}