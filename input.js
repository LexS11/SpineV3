let hoveredPoint = null;

window.addEventListener("load", () => {
    let theCanvas = document.getElementById("aCanvas");
    if (!theCanvas) return;

    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            document.getElementById('status').textContent = "Loading data catalog...";
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                parseAndLoadGalaxyCSV(evt.target.result, file.name);
            };
            reader.readAsText(file);
        });
    }

    theCanvas.addEventListener("mousemove", (event) => {
        const rect = theCanvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        let xSpan = document.getElementById('x-value');
        let ySpan = document.getElementById('y-value');
        if (xSpan) xSpan.textContent = Math.floor(mouseX);
        if (ySpan) ySpan.textContent = Math.floor(mouseY);

        if (!voronoiPoints || voronoiPoints.length === 0) return;
        let closest = getClosestVoronoiPoint(mouseX, mouseY);

        if (closest) {
            let dist = getDistanceNoSqrt(mouseX, mouseY, closest.point.x, closest.point.y);
            if (dist < 400) { 
                if (hoveredPoint !== closest) {
                    hoveredPoint = closest;
                    tesselate();
                }
            } else {
                if (hoveredPoint !== null) {
                    hoveredPoint = null;
                    tesselate();
                }
            }
        }
    });

    theCanvas.addEventListener("click", (event) => {
        if (!voronoiPoints || voronoiPoints.length === 0) return;
        const rect = theCanvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        let closest = getClosestVoronoiPoint(mouseX, mouseY);
        if (closest) {
            let dist = getDistanceNoSqrt(mouseX, mouseY, closest.point.x, closest.point.y);
            if (dist < 400) {
                voronoiPoints.forEach(p => p.isSelected = false);
                closest.isSelected = true;

                // --- INTEGRATED AREA MATHEMATICS ENGINE ---
                let blockArea = GAP * GAP; 
                let finalCalculatedArea = closest.pixelCount * blockArea;

                let infoPanel = document.getElementById('dataInfo');
                if (infoPanel) {
                    infoPanel.innerHTML = `
                        <span style="color: #00ff00;"><strong>Selected Galaxy:</strong></span> RA: ${closest.ra.toFixed(4)}°, Dec: ${closest.dec.toFixed(4)}°<br>
                        <strong>Tessellation Boundary Size:</strong> ${finalCalculatedArea.toLocaleString()} square pixels<br>
                        <small style="color:#aaa;">(Calculated via discrete Riemann pixel integration grid)</small>
                    `;
                }
            }
        } else {
            voronoiPoints.forEach(p => p.isSelected = false);
        }
        tesselate();
    });

    theCanvas.addEventListener("mouseleave", () => {
        hoveredPoint = null;
        tesselate();
    });

    window.addEventListener("keydown", (event) => {
        if (!voronoiPoints || voronoiPoints.length === 0) return;
        let selectedPoint = voronoiPoints.find(p => p.isSelected);
        if (!selectedPoint) return;

        const key = event.key.toLowerCase();
        if (key === 's') {
            voronoiPoints.forEach(p => p.isStart = false);
            selectedPoint.isStart = true;
            selectedPoint.isEnd = false; 
            selectedPoint.isSelected = false;
            tesselate();
        } else if (key === 'e') {
            voronoiPoints.forEach(p => p.isEnd = false);
            selectedPoint.isEnd = true;
            selectedPoint.isStart = false;
            selectedPoint.isSelected = false;
            tesselate();
        }
    });
});