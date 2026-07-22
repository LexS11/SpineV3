// =============================================================================
// DELAUNAY TRIANGULATION & GRAPH GENERATOR
// =============================================================================

var delaunayTriangles = [];

/**
 * Computes Delaunay Triangulation using Bowyer-Watson / Circumcircle checking
 * and links neighbors into adjacency lists for A* pathfinding.
 */
function computeDelaunay() {
    if (!voronoiPoints || voronoiPoints.length < 3) return;

    // Clear previous graph links
    voronoiPoints.forEach(p => {
        p.neighbors = [];
        p.cellPolygons = [];
    });

    delaunayTriangles = [];

    // Define Super-Triangle enclosing the canvas area
    const canvas = document.getElementById('aCanvas');
    const w = canvas ? canvas.width * 3 : 3000;
    const h = canvas ? canvas.height * 3 : 2400;

    let p1 = { point: { x: -w, y: -h }, isSuper: true };
    let p2 = { point: { x: 2 * w, y: -h }, isSuper: true };
    let p3 = { point: { x: w / 2, y: 2 * h }, isSuper: true };

    let triangles = [{ a: p1, b: p2, c: p3 }];

    // Incremental point insertion
    voronoiPoints.forEach(p => {
        let badTriangles = [];

        for (let i = 0; i < triangles.length; i++) {
            let tri = triangles[i];
            if (inCircumcircle(p, tri.a, tri.b, tri.c)) {
                badTriangles.push(tri);
            }
        }

        let polygon = [];
        for (let i = 0; i < badTriangles.length; i++) {
            let tri = badTriangles[i];
            let edges = [
                { p1: tri.a, p2: tri.b },
                { p1: tri.b, p2: tri.c },
                { p1: tri.c, p2: tri.a }
            ];

            for (let j = 0; j < 3; j++) {
                let edge = edges[j];
                let isShared = false;
                for (let k = 0; k < badTriangles.length; k++) {
                    if (i === k) continue;
                    let other = badTriangles[k];
                    let otherEdges = [
                        { p1: other.a, p2: other.b },
                        { p1: other.b, p2: other.c },
                        { p1: other.c, p2: other.a }
                    ];
                    for (let m = 0; m < 3; m++) {
                        if (sameEdge(edge, otherEdges[m])) {
                            isShared = true;
                            break;
                        }
                    }
                    if (isShared) break;
                }
                if (!isShared) polygon.push(edge);
            }
        }

        // Remove bad triangles
        triangles = triangles.filter(t => !badTriangles.includes(t));

        // Re-triangulate hole
        polygon.forEach(edge => {
            triangles.push({ a: edge.p1, b: edge.p2, c: p });
        });
    });

    // Remove super-triangle vertices
    triangles = triangles.filter(t => !t.a.isSuper && !t.b.isSuper && !t.c.isSuper);
    delaunayTriangles = triangles;

    // Link neighbor points for graph traversal
    delaunayTriangles.forEach(tri => {
        addNeighbor(tri.a, tri.b);
        addNeighbor(tri.b, tri.c);
        addNeighbor(tri.c, tri.a);
    });

    // Generate Voronoi cell vertices from circumcenters
    generateVoronoiCells();
}

function addNeighbor(p1, p2) {
    if (!p1.neighbors) p1.neighbors = [];
    if (!p2.neighbors) p2.neighbors = [];
    if (!p1.neighbors.includes(p2)) p1.neighbors.push(p2);
    if (!p2.neighbors.includes(p1)) p2.neighbors.push(p1);
}

function sameEdge(e1, e2) {
    return (e1.p1 === e2.p1 && e1.p2 === e2.p2) || (e1.p1 === e2.p2 && e1.p2 === e2.p1);
}

function inCircumcircle(p, a, b, c) {
    let ax = a.point.x, ay = a.point.y;
    let bx = b.point.x, by = b.point.y;
    let cx = c.point.x, cy = c.point.y;
    let px = p.point.x, py = p.point.y;

    let D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(D) < 1e-9) return false;

    let ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    let uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;

    let rSq = (ax - ux) * (ax - ux) + (ay - uy) * (ay - uy);
    let pDistSq = (px - ux) * (px - ux) + (py - uy) * (py - uy);

    return pDistSq <= rSq;
}

function getCircumcenter(a, b, c) {
    let ax = a.point.x, ay = a.point.y;
    let bx = b.point.x, by = b.point.y;
    let cx = c.point.x, cy = c.point.y;

    let D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(D) < 1e-9) return { x: ax, y: ay };

    let ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    let uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;

    return { x: ux, y: uy };
}

function generateVoronoiCells() {
    delaunayTriangles.forEach(tri => {
        let center = getCircumcenter(tri.a, tri.b, tri.c);
        [tri.a, tri.b, tri.c].forEach(p => {
            if (!p.cellPolygons) p.cellPolygons = [];
            p.cellPolygons.push(center);
        });
    });

    // Sort cell vertices radially to form clean polygons
    voronoiPoints.forEach(p => {
        if (p.cellPolygons && p.cellPolygons.length > 2) {
            let cx = p.point.x;
            let cy = p.point.y;
            p.cellPolygons.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
        }
    });
}