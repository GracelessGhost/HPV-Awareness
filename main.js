// testing no prior experience in javascript lol

// Globals
var keys = {};
var keysReleased = {};
var scene = "";

// Preload
var preload = function() {
    images.init();
    sounds.init();
};

// Setup
var setup = function() {
    createCanvas(400, 400);
    angleMode(DEGREES);
    imageMode(CENTER);
};

// Mouse
var mouse = {
    get x() { return mouseX; },
    get y() { return mouseY; },
    get xPrev() { return pmouseX; },
    get yPrev() { return pmouseY; },
    get pressed() { return mouseIsPressed; },
    get moved() { return this.x !== this.xPrev || this.y !== this.yPrev; },
    get debug() { return (this.x + editor.x) + ", " + (this.y + editor.y); },
    clicked: false,
    released: false,
    overlapRect: function(x, y, w, h) { // Corner-aligned
        return this.x >= x && this.x <= x + w && this.y >= y && this.y <= y + h;
    },
    overlapEllipse: function(x, y, w, h) {
        var a = w / 2;
        var b = h / 2;
        return (mouse.x - x) * (mouse.x - x) / (a * a) + (mouse.y - y) * (mouse.y - y) / (b * b) <= 1;
    },
    reset: function() {
        this.clicked = false;
        this.released = false;
    },
};

// Images
var images = {
    init: function() {
        for(var key in this) {
            if(typeof this[key] === "string") {
                this[key] = loadImage(this[key]);
            }
            else if(key !== "init") {
                clear();
                this[key] = this[key]();
            }
        }
    },
};

// Sound
var sounds = {
    init: function() {
        for(var key in this) {
            if(key !== "init") {
                this[key] = loadSound(this[key]);
            }
        }
    }
};

// Style Text
var styleText = function(size, col, font, xAlign, yAlign) {
    fill(col);
    textSize(size);
    textFont(font);
    textAlign(xAlign, yAlign);
    noStroke();
};

// Color Class
var Color = function(r, g, b, o) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.o = o || 255;
    this.set = function(r, g, b, o) {
        if(arguments.length === 1) {
            this.r = r;
            this.g = r;
            this.b = r;
        }
        else {
            this.r = r;
            this.g = g;
            this.b = b;
            this.o = o || this.o;
        }
    };
    this.get = function() {
        return color(this.r, this.g, this.b, this.o);
    };
};

// Fade Class
var Fade = function(r, g, b, opacity) {
    this.speed = -5; // Negative means fading to scene, positive means fading to black
    this.toScene = scene;
    this.color = new Color(r, g, b, opacity);
    this.to = function(toScene, speed) {
        this.speed = speed;
        this.toScene = toScene;
    };
    this.update = function() {
        if(this.color.o === 255) {
            scene = this.toScene;
            this.speed *= -1;
        }
        this.color.o += this.speed;
        this.color.o = constrain(this.color.o, 0, 255);
    };
    this.display = function() {
        this.update();
        rectMode(CORNER);
        noStroke();
        fill(this.color.get());
        rect(0, 0, width, height);
    };
};
var fade = new Fade(0, 0, 0, 255);

// Key Pressed
var keyPressed = function() {
    keys[key.toString().toLowerCase()] = true;
    keys[keyCode] = true;
    if((keysReleased[key.toString().toLowerCase()] || keysReleased[keyCode]) === undefined) {
        keysReleased[key.toString().toLowerCase()] = true;
        keysReleased[keyCode] = true;
    }
};

// Key Released
var keyReleased = function() {
    keys[key.toString().toLowerCase()] = false;
    keys[keyCode] = false;
    keysReleased[key.toString().toLowerCase()] = true;
    keysReleased[keyCode] = true;
};

// Mouse released
var mouseReleased = function() {
    mouse.released = true;
};

// Mouse pressed
var mousePressed = function() {
    mouse.clicked = true;
};

// Draw
var draw = function() {
    cursor(ARROW);
    // Code
    fade.display();
    mouse.reset();
};