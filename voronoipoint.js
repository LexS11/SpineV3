class VoronoiPoint
{
    constructor(x, y, originalRa, originalDec) {
        this.point = { x: x, y: y };
        this.ra = originalRa;
        this.dec = originalDec;

        var r = Math.floor(randomBetween(50, 255));
        var g = Math.floor(randomBetween(50, 255));
        var b = Math.floor(randomBetween(50, 255));
        this.clr = "rgb(" + r + "," + g + "," + b + ")";

        this.isSelected = false;
        this.isStart = false;
        this.isEnd = false;

        this.pixelCount = 0;
    }
}