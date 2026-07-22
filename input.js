let hoveredPoint = null;

/**
 * Finds the K-nearest galaxy nodes around a given target RA/Dec coordinate.
 * Flags them as a grouped Start or End set for A* pathfinding.
 */
function snapToKNearestNodes(targetRa, targetDec, countK = 1, setAsStart = true) {
    if (!voronoiPoints || voronoiPoints.length === 0) return null;

    // Calculate distance to every node
    let distances = voronoiPoints.map(node => {
        let deltaRa = (node.ra - targetRa) * Math.cos(targetDec * Math.PI / 180.0);
        let deltaDec = node.dec - targetDec;
        let distSq = deltaRa * deltaRa + deltaDec * deltaDec;
        return { node: node, distSq: distSq };
    });

    distances.sort((a, b) => a.distSq - b.distSq);

    // Grab top K closest nodes
    let kClosest = distances.slice(0, Math.min(countK, distances.length)).map(d => d.node);

    // Clear previous node flags of this type
    voronoiPoints.forEach(p => {
        if (setAsStart) p.isStart = false;
        else p.isEnd = false;
    });

    // Tag all K nodes
    kClosest.forEach(node => {
        if (setAsStart) {
            node.isStart = true;
            node.isEnd = false;
        } else {
            node.isEnd = true;
            node.isStart = false;
        }
    });

    let status = document.getElementById('status');
    if (status) {
        let label = setAsStart ? "Start Group" : "End Group";
        status.textContent = `Selected ${kClosest.length} galaxies for ${label}.`;
    }

    if (typeof tesselate === 'function') tesselate();

    return kClosest;
}

window.addEventListener("load", () => {
    let theCanvas = document.getElementById("aCanvas");
    if (!theCanvas) return;

    // -------------------------------------------------------------------------
    // FILE LOADER
    // -------------------------------------------------------------------------
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const status = document.getElementById('status');
            if (status) status.textContent = "Loading galaxy catalog...";
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                parseAndLoadGalaxyCSV(evt.target.result, file.name);
            };
            reader.readAsText(file);
        });
    }

    // -------------------------------------------------------------------------
    // COORDINATE & GROUPING BUTTON LISTENERS
    // -------------------------------------------------------------------------
    const btnStart = document.getElementById('btnSetStart');
    const btnEnd = document.getElementById('btnSetEnd');
    const btnClear = document.getElementById('btnClearGroups');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            const ra = parseFloat(document.getElementById('inputRa').value);
            const dec = parseFloat(document.getElementById('inputDec').value);
            const k = parseInt(document.getElementById('inputK').value) || 1;

            if (!isNaN(ra) && !isNaN(dec)) {
                snapToKNearestNodes(ra, dec, k, true);
            } else {
                alert("Please enter valid numerical RA and Dec values.");
            }
        });
    }

    if (btnEnd) {
        btnEnd.addEventListener('click', () => {
            const ra = parseFloat(document.getElementById('inputRa').value);
            const dec = parseFloat(document.getElementById('inputDec').value);
            const k = parseInt(document.getElementById('inputK').value) || 1;

            if (!isNaN(ra) && !isNaN(dec)) {
                snapToKNearestNodes(ra, dec, k, false);
            } else {
                alert("Please enter valid numerical RA and Dec values.");
            }
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (voronoiPoints) {
                voronoiPoints.forEach(p => {
                    p.isStart = false;
                    p.isEnd = false;
                    p.isSelected = false;
                });
                let status = document.getElementById('status');
                if (status) status.textContent = "All Start and End node selections cleared.";
                tesselate();
            }
        });
    }

    // -------------------------------------------------------------------------
    // CANVAS INTERACTION & KEYBOARD SHORTCUTS
    // -------------------------------------------------------------------------
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
                closest.isSelected = !closest.isSelected;

                let infoPanel = document.getElementById('dataInfo');
                if (infoPanel) {
                    infoPanel.innerHTML = `
                        <span style="color: #00ff00;"><strong>Selected Node:</strong></span> RA: ${closest.ra ? closest.ra.toFixed(4) : 'N/A'}°, Dec: ${closest.dec ? closest.dec.toFixed(4) : 'N/A'}°
                    `;
                }
            }
        }
        tesselate();
    });

    window.addEventListener("keydown", (event) => {
        if (!voronoiPoints || voronoiPoints.length === 0) return;
        let selectedPoints = voronoiPoints.filter(p => p.isSelected);
        if (selectedPoints.length === 0) return;

        const key = event.key.toLowerCase();
        if (key === 's') {
            selectedPoints.forEach(p => {
                p.isStart = !p.isStart;
                if (p.isStart) p.isEnd = false;
                p.isSelected = false;
            });
            tesselate();
        } else if (key === 'e') {
            selectedPoints.forEach(p => {
                p.isEnd = !p.isEnd;
                if (p.isEnd) p.isStart = false;
                p.isSelected = false;
            });
            tesselate();
        }
    });
});