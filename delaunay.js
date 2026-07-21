function getCircumcircle(p1, p2, p3)
{
    let ax = p1.x, ay = p1.y;
    let bx = p2.x, by = p2.y;
    let cx = p3.x, cy = p3.y;

    let d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < 0.000001) return null;

    let ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
    let uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
    let r2 = (ux - ax) * (ux - ax) + (uy - ay) * (uy - ay);

    return { x: ux, y: uy, r2: r2 };
}

function isDelaunayTriangle(i, j, k)
{
    let p1 = voronoiPoints[i].point;
    let p2 = voronoiPoints[j].point;
    let p3 = voronoiPoints[k].point;

    let circle = getCircumcircle(p1, p2, p3);
    if (!circle) return false;

    for (let m = 0; m < voronoiPoints.length; m++)
    {
        if (m === i || m === j || m === k) continue;
        let p = voronoiPoints[m].point;
        let dx = p.x - circle.x;
        let dy = p.y - circle.y;
        if ((dx * dx + dy * dy) < circle.r2 - 0.000001)
        {
            return false;
        }
    }
    return true;
}

function drawDelaunay()
{
    if (!ctx || !voronoiPoints || voronoiPoints.length < 3) return;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    let drawnEdges = new Set();

    for (let i = 0; i < voronoiPoints.length; i++)
    {
        for (let j = i + 1; j < voronoiPoints.length; j++)
        {
            for (let k = j + 1; k < voronoiPoints.length; k++)
            {
                if (isDelaunayTriangle(i, j, k))
                {
                    let p1 = voronoiPoints[i].point;
                    let p2 = voronoiPoints[j].point;
                    let p3 = voronoiPoints[k].point;

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.stroke();

                    drawEdgeLength(voronoiPoints[i], voronoiPoints[j], drawnEdges);
                    drawEdgeLength(voronoiPoints[j], voronoiPoints[k], drawnEdges);
                    drawEdgeLength(voronoiPoints[k], voronoiPoints[i], drawnEdges);
                }
            }
        }
    }
}

function drawEdgeLength(p1, p2, drawnEdges)
{
    let edgeKey = p1.x < p2.x ? `${p1.x},${p1.y},${p2.x},${p2.y}` : `${p2.x},${p2.y},${p1.x},${p1.y}`;
    if (drawnEdges.has(edgeKey)) return;
    drawnEdges.add(edgeKey);

    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Only draw labels if the distance isn't massive (culls cluttered text)
    if (distance > 150) return; 

    let midX = (p1.x + p2.x) / 2;
    let midY = (p1.y + p2.y) / 2;

    ctx.save();
    ctx.fillStyle = "rgba(80, 80, 80, 0.6)";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.fillText(distance.toFixed(0), midX, midY - 2); // rounded to 0 decimals saves string time
    ctx.restore();
}