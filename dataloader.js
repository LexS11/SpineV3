function parseAndLoadGalaxyCSV(csvText, filename)
{
    const lines = csvText.split('\n');
    let rawGalaxies = [];

    for (let i = 0; i < lines.length; i++)
    {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        if (i === 0 && (isNaN(cols[0]) || isNaN(cols[1]))) continue;

        const ra = parseFloat(cols[0]);
        const dec = parseFloat(cols[1]);
        if (!isNaN(ra) && !isNaN(dec)) {
            rawGalaxies.push({ ra, dec });
        }
    }

    if (rawGalaxies.length === 0)
    {
        document.getElementById('status').textContent = "Error: No valid coordinate data found.";
        return;
    }

    const minRa = Math.min(...rawGalaxies.map(g => g.ra));
    const maxRa = Math.max(...rawGalaxies.map(g => g.ra));
    const minDec = Math.min(...rawGalaxies.map(g => g.dec));
    const maxDec = Math.max(...rawGalaxies.map(g => g.dec));

    const raRange = (maxRa - minRa) || 1;
    const decRange = (maxDec - minDec) || 1;

    let theCanvas = document.getElementById("aCanvas");
    const padding = 60; 

    voronoiPoints = [];
    if (typeof hoveredPoint !== 'undefined') hoveredPoint = null; 

    rawGalaxies.forEach(galaxy => {
        let x = padding + (1 - ((galaxy.ra - minRa) / raRange)) * (theCanvas.width - padding * 2);
        let y = theCanvas.height - padding - ((galaxy.dec - minDec) / decRange) * (theCanvas.height - padding * 2);
        voronoiPoints.push(new VoronoiPoint(x, y, galaxy.ra, galaxy.dec));
    });

    document.getElementById('status').textContent = `Successfully plotted ${voronoiPoints.length} galaxies!`;
    document.getElementById('dataInfo').innerHTML = `
        <strong>File:</strong> ${filename} | 
        <strong>RA Range:</strong> [${minRa.toFixed(2)}° to ${maxRa.toFixed(2)}°] | 
        <strong>Dec Range:</strong> [${minDec.toFixed(2)}° to ${maxDec.toFixed(2)}°]
    `;

    tesselate();
}