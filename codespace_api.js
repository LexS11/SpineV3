class Point
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
}

function randomBetween(min, max)
{
    return Math.random() * (max - min) + min;
}

function resizeCanvas(canvas, fullScreen = false)
{
    if (fullScreen)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

const Constants = {
    TWO_PI: Math.PI * 2
};

function getDistanceNoSqrt(x1, y1, x2, y2)
{
    let dx = x2 - x1;
    let dy = y2 - y1;
    return (dx * dx) + (dy * dy);
}