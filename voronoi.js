// =============================================================================
// RENDERING ENGINE: DELAUNAY, VORONOI & PATH DRAWING
// =============================================================================

function resizeCanvas() {
    let canvas = document.getElementById('aCanvas');
    if (canvas) {
        canvas.width = canvas.width || 1000;
        canvas.height = canvas.height || 800;
    }
}

resizeCanvas();

/**
 * Main draw loop.
 */
function tesselate() {
    let canvas = document.getElementById('aCanvas');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');

    // Clear background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!voronoiPoints || voronoiPoints.length === 0) return;

    let renderBg = document.getElementById('renderBackground');
    let showGrid = renderBg ? renderBg.checked : true;

    if (showGrid) {
        // 1. DRAW VORONOI CELL BOUNDARIES (Grey lines)
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.8;
        voronoiPoints.forEach(p => {
            if (p.cellPolygons && p.cellPolygons.length > 2) {
                ctx.beginPath();
                ctx.moveTo(p.cellPolygons[0].x, p.cellPolygons[0].y);
                for (let i = 1; i < p.cellPolygons.length; i++) {
                    ctx.lineTo(p.cellPolygons[i].x, p.cellPolygons[i].y);
                }
                ctx.closePath();
                ctx.stroke();
            }
        });

        // 2. DRAW DELAUNAY TRIANGULATION MESH (Cyan/Blue network lines)
        ctx.strokeStyle = '#a4d4f2';
        ctx.lineWidth = 0.5;
        if (typeof delaunayTriangles !== 'undefined') {
            delaunayTriangles.forEach(tri => {
                ctx.beginPath();
                ctx.moveTo(tri.a.point.x, tri.a.point.y);
                ctx.lineTo(tri.b.point.x, tri.b.point.y);
                ctx.lineTo(tri.c.point.x, tri.c.point.y);
                ctx.closePath();
                ctx.stroke();
            });
        }
    }

    // 3. DRAW A* PATHFINDING FILAMENTS
    if (typeof drawShortestPath === 'function') {
        drawShortestPath();
    }

    // 4. DRAW GALAXY NODES OVERLAY
    voronoiPoints.forEach(p => {
        let x = p.point ? p.point.x : p.x;
        let y = p.point ? p.point.y : p.y;

        if (x === undefined || y === undefined) return;

        ctx.beginPath();
        let radius = 3;
        ctx.fillStyle = "#222222";

        if (p.isSelected) {
            radius = 6;
            ctx.fillStyle = "#00ff00"; // Green highlight for clicked galaxy
        } else if (p.isStart) {
            radius = 7;
            ctx.fillStyle = "#007acc"; // Blue for Start node
        } else if (p.isEnd) {
            radius = 7;
            ctx.fillStyle = "#9900cc"; // Purple for End node
        }

        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    });
}