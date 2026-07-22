// =============================================================================
// DATA LOADER MODULE (WITH ASTRONOMICAL RA INVERSION)
// =============================================================================

var voronoiPoints = [];

/**
 * Parses optical galaxy CSV text and populates global voronoiPoints array.
 * @param {string} csvText - Raw CSV content
 * @param {string} fileName - Name of uploaded file for status reporting
 */
function parseAndLoadGalaxyCSV(csvText, fileName) {
    try {
        const lines = csvText.split(/\r?\n/);
        if (lines.length < 2) {
            alert("CSV file appears to be empty or missing data rows.");
            return;
        }

        // Clean headers
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"#]/g, ''));

        // Identify RA/Dec and X/Y column indexes
        const raIdx = headers.findIndex(h => h === 'ra' || h.includes('right_ascension') || h.includes('ra_deg'));
        const decIdx = headers.findIndex(h => h === 'dec' || h.includes('declination') || h.includes('dec_deg'));
        const xIdx = headers.findIndex(h => h === 'x' || h === 'pos_x' || h === 'px');
        const yIdx = headers.findIndex(h => h === 'y' || h === 'pos_y' || h === 'py');

        if (raIdx === -1 || decIdx === -1) {
            alert("Could not locate RA and DEC columns in your CSV header.");
            return;
        }

        voronoiPoints = [];

        const canvas = document.getElementById('aCanvas');
        const canvasWidth = canvas ? canvas.width : 1000;
        const canvasHeight = canvas ? canvas.height : 800;

        let rawData = [];
        let minRa = Infinity, maxRa = -Infinity;
        let minDec = Infinity, maxDec = -Infinity;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(',');
            if (cols.length <= Math.max(raIdx, decIdx)) continue;

            const ra = parseFloat(cols[raIdx]);
            const dec = parseFloat(cols[decIdx]);

            if (!isNaN(ra) && !isNaN(dec)) {
                minRa = Math.min(minRa, ra);
                maxRa = Math.max(maxRa, ra);
                minDec = Math.min(minDec, dec);
                maxDec = Math.max(maxDec, dec);

                let x = (xIdx !== -1 && cols[xIdx]) ? parseFloat(cols[xIdx]) : null;
                let y = (yIdx !== -1 && cols[yIdx]) ? parseFloat(cols[yIdx]) : null;

                rawData.push({ ra, dec, x, y });
            }
        }

        if (rawData.length === 0) {
            alert("No valid numerical galaxy entries found in CSV.");
            return;
        }

        const raRange = maxRa - minRa || 1;
        const decRange = maxDec - minDec || 1;

        // Build VoronoiPoint instances with proper astronomical projections
        rawData.forEach((item, index) => {
            let px = item.x;
            let py = item.y;

            // Invert RA horizontally: higher RA goes to the left (standard astronomical view)
            if (px === null || isNaN(px)) {
                px = (canvasWidth - 50) - ((item.ra - minRa) / raRange) * (canvasWidth - 100);
            }
            
            // Invert Dec vertically: higher Dec goes to the top
            if (py === null || isNaN(py)) {
                py = (canvasHeight - 50) - ((item.dec - minDec) / decRange) * (canvasHeight - 100);
            }

            let node;
            try {
                node = new VoronoiPoint(px, py);
            } catch (e) {
                node = { point: { x: px, y: py } };
            }

            if (!node.point) node.point = { x: px, y: py };
            else {
                node.point.x = px;
                node.point.y = py;
            }

            node.ra = item.ra;
            node.dec = item.dec;
            node.id = index;
            node.isStart = false;
            node.isEnd = false;
            node.isSelected = false;

            voronoiPoints.push(node);
        });

        // Update status UI
        const status = document.getElementById('status');
        if (status) {
            status.textContent = `Successfully loaded ${voronoiPoints.length} galaxies from ${fileName}.`;
        }

        // Run Delaunay Triangulation & Mesh Generation
        if (typeof computeDelaunay === 'function') {
            computeDelaunay();
        }

        // Trigger Canvas Rendering
        if (typeof tesselate === 'function') {
            tesselate();
        }

    } catch (err) {
        console.error("DataLoader Error:", err);
        alert("Error reading galaxy CSV. Check console for details.");
    }
}