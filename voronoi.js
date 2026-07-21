var GAP = 3; // Leave at 6 or 8 for excellent, responsive frame rates
var ctx = null;
var width = 0;
var height = 0;
var voronoiPoints = [];

window.addEventListener("load", (event) => {
    let theCanvas = document.getElementById("aCanvas");
    if (!theCanvas) return;
    
    resizeCanvas(theCanvas, false);
    width = theCanvas.width;
    height = theCanvas.height;
    ctx = theCanvas.getContext("2d");
    ctx.lineWidth = 0.5;

    clearCanvasToBlankGrid();
});

function clearCanvasToBlankGrid() {
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    for (let x = 50; x < width; x += 100) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 50; y < height; y += 100) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, height); ctx.stroke();
    }
}

function getClosestVoronoiPoint(x, y) {
    if (!voronoiPoints || voronoiPoints.length === 0) return null;
    let closest = null;
    let minDist = Infinity;
    for (let i = 0; i < voronoiPoints.length; i++) {
        let p = voronoiPoints[i].point;
        let dist = (x - p.x) * (x - p.x) + (y - p.y) * (y - p.y);
        if (dist < minDist) {
            minDist = dist;
            closest = voronoiPoints[i];
        }
    }
    return closest;
}

function tesselate() {
    if (!ctx) return;
    if (!voronoiPoints || voronoiPoints.length === 0) {
        clearCanvasToBlankGrid();
        return;
    }

    // Always reset integration counters before measuring current configurations
    voronoiPoints.forEach(pnt => pnt.pixelCount = 0);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    const shouldRenderCells = document.getElementById('renderBackground')?.checked ?? true;

    // Grid Evaluation loop running area tallies
    for (let x = 0; x < width; x += GAP) {
        for (let y = 0; y < height; y += GAP) {
            let closestPoint = getClosestVoronoiPoint(x, y);
            if (closestPoint) {
                // Register structural coordinate footprint claim
                closestPoint.pixelCount += 1;

                if (shouldRenderCells) {
                    ctx.fillStyle = closestPoint.clr;
                    ctx.fillRect(x, y, GAP, GAP);
                }
            }
        }
    }

    // Draw grid backup lines if cells are turned off for quick UI processing
    if (!shouldRenderCells) {
        ctx.strokeStyle = "#f9f9f9";
        ctx.lineWidth = 1;
        for (let x = 50; x < width; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        for (let y = 50; y < height; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    }

    if (typeof drawDelaunay === 'function') drawDelaunay();
    if (typeof drawShortestPath === 'function') drawShortestPath();

    voronoiPoints.forEach(vPnt => {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";

        if (vPnt.isStart) {
            ctx.fillStyle = "#0000FF";
            ctx.arc(vPnt.point.x, vPnt.point.y, 6, 0, Constants.TWO_PI, true);
            ctx.fill(); ctx.stroke();
        } else if (vPnt.isEnd) {
            ctx.fillStyle = "#800080";
            ctx.arc(vPnt.point.x, vPnt.point.y, 6, 0, Constants.TWO_PI, true);
            ctx.fill(); ctx.stroke();
        } else if (vPnt.isSelected) {
            ctx.fillStyle = "#00FF00";
            ctx.arc(vPnt.point.x, vPnt.point.y, 6, 0, Constants.TWO_PI, true);
            ctx.fill(); ctx.stroke();
        } else if (typeof hoveredPoint !== 'undefined' && hoveredPoint === vPnt) {
            ctx.fillStyle = "#FF0000";
            ctx.arc(vPnt.point.x, vPnt.point.y, 5, 0, Constants.TWO_PI, true);
            ctx.fill(); ctx.stroke();
        } else {
            ctx.fillStyle = "#000000";
            ctx.arc(vPnt.point.x, vPnt.point.y, 3, 0, Constants.TWO_PI, true);
            ctx.fill();
        }
    });
}