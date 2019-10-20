/*

DOCUMENTATION

* Overlap: Areas cross
* Intersect: Perimeters cross
* Call "overlap[Shape][Shape]" or "intersect[Shape][Shape]", where shapes are in alphabetical order
* Rectangles are corner-aligned
* Ellipses and circles are defined by diameters, not radii

*/

// Is between (inclusive)
var isBetween = function(a, b, c) {
    return a >= min(b, c) && a <= max(b, c); // Is "a" between "b" and "c"?
};

// Circle-point overlap
var overlapCirclePoint = function(xc, yc, d, x, y) {
    return dist(xc, yc, x, y) < d / 2;
};

// Rectangle-rectangle overlap
var overlapRectRect = function(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
};

// Circle-circle overlap
var overlapCircleCircle = function(x1, y1, d1, x2, y2, d2) {
    return dist(x1, y1, x2, y2) < d1 / 2 + d2 / 2;
};

// Ellipse-line intersection
var intersectEllipseLine = function(x, y, w, h, x1, y1, x2, y2) {
    if(x1 === x2) {
        return intersectEllipseLine(y, x, h, w, y1, x1, y2, x2); // Line is vertical, so swap coordinates
    }
    x1 -= x; // Places ellipse center at origin
    x2 -= x;
    y1 -= y;
    y2 -= y;
    var A = w * w / 4; // Ellipse's x-radius squared
    var B = h * h / 4; // Ellipse's y-radius squared
    var m = (y2 - y1) / (x2 - x1); // Line slope
    var k = y1 - (m * x1); // Solve standard line equation for "k"
    // Substitute "y" for "m * x + k" in standard ellipse equation, then expand - result is in standard quadratic form
    var a = (1 / A) + (m * m / B);
    var b = 2 * m * k / B;
    var c = k * k / B - 1;
    var discriminant = b * b - 4 * a * c; // Expression under square root sign in quadratic formula
    if(discriminant < 0) { return false; } // Square root of negative has no solution
    var xPlus = (-b + sqrt(discriminant)) / (2 * a); // Quadratic formula
    var xMinus = (-b - sqrt(discriminant)) / (2 * a); // Plus or minus
    return isBetween(xPlus, x1, x2) || isBetween(xMinus, x1, x2);
};

// Ellipse-rectangle intersection
var intersectEllipseRect = function(xe, ye, we, he, xr, yr, wr, hr) {
    var top = intersectEllipseLine(xe, ye, we, he, xr, yr, xr + wr, yr);
    var bottom = intersectEllipseLine(xe, ye, we, he, xr, yr + hr, xr + wr, yr + hr);
    var left = intersectEllipseLine(xe, ye, we, he, xr, yr, xr, yr + hr);
    var right = intersectEllipseLine(xe, ye, we, he, xr + wr, yr, xr + wr, yr + hr);
    return top || bottom || left || right;
};

// Circle-rectangle overlap
var overlapCircleRect = function(xc, yc, d, xr, yr, w, h) {
    var xDist = Math.abs(xc - xr - w / 2);
    var yDist = Math.abs(yc - yr - h / 2);
    if(xDist > (w / 2 + d / 2) || yDist > (h / 2 + d / 2)) {
        return false;
    }
    if(xDist < w / 2 || yDist < h / 2) {
        return true;
    }
    var a = xDist - w / 2;
    var b = yDist - h / 2;
    var c = d / 2;
    return a * a + b * b < c * c;
};

// Line-line intersection
var intersectLineLine = function(x1, y1, x2, y2, x3, y3, x4, y4) {
    var xMin1 = min(x1, x2);
    var xMax1 = max(x1, x2);
    var yMin1 = min(y1, y2);
    var yMax1 = max(y1, y2);
    var w1 = xMax1 - xMin1;
    var h1 = yMax1 - yMin1;

    var xMin2 = min(x3, x4);
    var xMax2 = max(x3, x4);
    var yMin2 = min(y3, y4);
    var yMax2 = max(y3, y4);
    var w2 = xMax2 - xMin2;
    var h2 = yMax2 - yMin2;

    return overlapRectRect(xMin1, yMin1, w1, h1, xMin2, yMin2, w2, h2);
};

// Line-rectangle intersection
var intersectLineRect = function(x1, y1, x2, y2, x, y, w, h) {
    if(intersectLineLine(x1, y1, x2, y2, x, y, x, y + h)) {
        return true;
    }
    if(intersectLineLine(x1, y1, x2, y2, x, y, x + w, y)) {
        return true;
    }
    if(intersectLineLine(x1, y1, x2, y2, x, y + h, x + w, y + h)) {
        return true;
    }
    return intersectLineLine(x1, y1, x2, y2, x + w, y, x + w, y + h);
};

// Rectangle-triangle intersection
var intersectRectTri = function(x, y, w, h, x1, y1, x2, y2, x3, y3) {
    if(intersectLineRect(x1, y1, x2, y2, x, y, w, h)) {
        return true;
    }
    if(intersectLineRect(x1, y1, x3, y3, x, y, w, h)) {
        return true;
    }
    return intersectLineRect(x2, y2, x3, y3, x, y, w, h);
};