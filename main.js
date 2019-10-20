// Globals
var keys = {};
var keysReleased = {};
var scene = "loading";
var tapColor;

// Preload
var preload = function() {
    sounds.init();
    images.init();
};

// Setup
var setup = function() {
    createCanvas(430, 700);
    angleMode(DEGREES);
    imageMode(CENTER);
    sprites.init();
    sounds.funk.setVolume(0.5);
    sounds.funk.loop();

    tapColor = new Color(0, 0, 0, 0);
    redDots.init();
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

// Sound
var sounds = {
    init: function() {
        for(var key in this) {
            if(key !== "init") {
                this[key] = loadSound(this[key]);
            }
        }
    },
    'funk': "assets/funk.mp3",
    'pop': "assets/pop.mp3",
};

// Images
var images = {
    init: function() {
        for(var key in this) {
            if(key !== "init") {
                this[key] = loadImage(this[key]);
            }
        }
    },
    'person-healthy': "assets/person-healthy.png",
    'person-vaccinated': "assets/person-vaccinated.png",
    'person-pox': "assets/person-pox.png",
};

// Sprites
var sprites = {
    init: function() {
        for(var key in this) {
            if(key !== "init") {
                images[key] = this[key](); // Store in images
            }
        }
    },
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

// Array display
Array.prototype.display = function() {
    for(var i = this.length - 1; i >= 0; i --) {
        this[i].display();
        if(this[i].remove) {
            this.splice(i, 1);
        }
    }
};

// Capitalize
var capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
};

// Red dot class
var RedDot = function(x, y, xVel, yVel) {
    this.x = x;
    this.y = y;
    this.xVel = xVel;
    this.yVel = yVel;
    this.size = random(5, 10);
    this.color = new Color(255, 0, 0, 0);
    this.offset = random(255);
    this.update = function() {
        this.x += this.xVel;
        this.y += this.yVel;
        if(this.x > width || this.x < 0) {
            this.xVel *= -1;
        }
        if(this.y > height || this.y < 0) {
            this.yVel *= -1;
        }
        this.color.o = map(sin(frameCount + this.offset), -1, 1 , 0, 200);
    };
    this.display = function() {
        this.update();
        fill(this.color.get());
        ellipse(this.x, this.y, this.size, this.size);
    };
};

// Red dots
var redDots = {
    array: [],
    init: function() {
        for(var i = 0; i < 100; i ++) {
            var d = new RedDot(random(width), random(height), random(-1, 1), random(-1, 1));
            this.array.push(d);
        }
    },
    display: function() {
        this.array.display();
    },
};

// Person class
var Person = function(x, y, state) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.dest = this.pos.copy();
    this.state = state;
    this.cooldown = floor(random(2, 10));
    this.moving = false;
    this.sprite = "";
    this.sex = "";
    this.name = "";
    this.init = function() {
        var r = random(1);
        if(r < 0.5) {
            this.sex = "male";
            this.name = boyNames[floor(random(boyNames.length))]
        }
        else {
            this.sex = "female";
            this.name = girlNames[floor(random(girlNames.length))]
        }
    };
    this.mouseOverlap = function() {
        if(mouse.overlapEllipse(this.pos.x, this.pos.y, 10, 22)) {
            cursor(HAND);
            if(mouse.clicked) {
                mouse.released = false;
                mouse.clicked = false;
                cache.character = this;
                sounds.pop.play();
                scene = "character";
            }
        }
    };
    this.updateSprite = function() {
        if(this.state === "healthy") {
            this.sprite = images['person-healthy'];
        }
        else if(this.state === "vaccinated") {
            this.sprite = images['person-vaccinated'];
        }
        else if(this.state === "chicken pox") {
            this.sprite = images['person-pox'];
        }
    };
    this.update = function() {
        this.updateSprite();
        this.mouseOverlap();
        if(frameCount % 30 === 0 && !this.moving) {
            this.cooldown --;
        }
        if(this.cooldown === 0) {
            this.moving = true;
            this.cooldown = floor(random(2, 10));
            this.dest.set(random(width), random(height));
        }
        var dir = p5.Vector.sub(this.dest, this.pos);
        if(dir.mag() < 1) {
            this.moving = false;
        }
        if(this.moving) {
            dir.normalize().mult(1);
            this.vel.set(dir);
            this.pos.add(this.vel);
        }
    };
    this.display = function() {
        this.update();
        imageMode(CENTER);
        image(this.sprite, this.pos.x, this.pos.y, 10, 22);
    };
};

// Persons
var persons = {
    array: [],
    add: function(n) {
        for(var i = 0; i < n; i ++) {
            var p = new Person(width / 2, height / 2, "healthy");
            p.init();
            this.array.push(p);
        }
    },
    display: function() {
        this.array.display();
    },
};

// Tutorial text
var tutorialText = [
    "Welcome to Vaccine Game!",
    "This is your country. Your\njob is to keep it safe.",
    "Here are some citizens!",
    "Uh oh! It looks like someone\ngot sick!",
    "Tap the person to learn more about the illness.",
    "If left untreated, this person will\ninfect others!",
    "Let's add some protection through vaccination!",
    "Tap a healthy person to give them a\nchicken pox vaccine.",
    "Now, this person is immune to chicken pox!",
];

// Button class
var Button = function(x, y, w, h, label, funct){
    this.textSize = h * 0.3;
    this.update = function() {
        fill(0);
        this.textSize = h * 0.4;
        if(mouse.overlapRect(x - w / 2, y - h / 2, w, h)) {
            fill(50);
            cursor(HAND);
            if(mouse.released) {
                mouse.released = false;
                sounds.pop.play();
                funct();
            }
            else if(mouse.pressed) {
            }
        }
    };
    this.display = function() {
        this.update();
        rectMode(CENTER);
        noStroke();
        rect(x, y, w, h, 5);
        rectMode(CORNER);
        styleText(this.textSize, color(255), "Roboto", CENTER, CENTER);
        text(label, x, y);
    };
};

// Buttons
var buttons = {
    menu: [
        new Button(215, 350, 200, 60, "Play", function() {
            if(fade.color.o === 0) {
                fade.to("game", 3);
            }
        }),
        new Button(215, 450, 200, 60, "", function() {
            if(fade.color.o === 0) {
                fade.to("game", 3);
            }
        }),
    ],
    character: [
        new Button(60, 50, 75, 45, "Back", function() {
            if(fade.color.o === 0) {
                scene = "tutorial";
                if(cache.tutorialHold) {
                    cache.tutorialHold = false;
                    cache.tutorialText ++;
                }
            }
        }),
        new Button(215, 650, 200, 45, "Vaccinate!", function() {
            if(cache.character.state === "healthy") {
                cache.character.state = "vaccinated";
            }
        }),
    ],
    display: function(which) {
        buttons[which].display();
    },
};

// Cache
var cache = {
    tutorialText: 0,
    tutorialHold: false,
    character: null,
};

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
    if(scene === "loading") {
        background(0);
        styleText(15, color(255), "sans serif", CENTER, CENTER);
        text("Health++", width / 2, height / 2);
        if(frameCount / 30 === 5 && fade.color.o === 0) {
            fade.to("menu", 3);
        }
    }
    else if(scene === "menu") {
        background(255);
        redDots.display();
        styleText(50, color(0, 0, 0), "Roboto", CENTER, CENTER);
        text("Vaccine Game", width / 2, height / 3);
        styleText(15, color(0, 0, 0), "Roboto", CENTER, CENTER);
        tapColor.o = map(sin(frameCount * 3), -1, 1, 0, 255)
        fill(tapColor.get());
        text("tap to begin", width / 2, height * 0.95);
        if(mouse.released && fade.color.o === 0) {
            fade.to("tutorial", 3);
        }
    }
    else if(scene === "tutorial") {
        background(255);
        persons.display();
        fill(0, 0, 0, 200);
        rectMode(CENTER, CENTER);
        rect(width / 2, height * 0.92, width * 0.9, height * 0.1, 5);
        styleText(15, color(255), "Roboto", CENTER, CENTER);
        text(tutorialText[cache.tutorialText], width / 2, height * 0.92);
        if(mouse.released) {
            if(!cache.tutorialHold) {
                cache.tutorialText ++;
            }
            if(cache.tutorialText > tutorialText.length - 1) {
                tutorialText[cache.tutorialText] = "";
            }
            if(cache.tutorialText === 2) {
                persons.add(25);
            }
            if(cache.tutorialText === 3) {
                var i = floor(random(persons.array.length));
                persons.array[i].state = "chicken pox";
            }
            if(cache.tutorialText === 4) {
                cache.tutorialHold = true;
            }
            if(cache.tutorialText === 7) {
                cache.tutorialHold = true;
            }
        }

    }
    else if(scene === "character") {
        background(255);
        cache.character.updateSprite();
        image(cache.character.sprite, width / 2, height / 3 + sin(frameCount * 2) * 3, 91, 200);
        buttons.display("character");
        styleText(40, color(0), "Roboto", CENTER, CENTER);
        text(cache.character.name, width / 2, 400);
        styleText(15, color(0), "Roboto", CENTER, CENTER);
        text(capitalize(cache.character.sex), width / 2, 450);
        text(capitalize(cache.character.state), width / 2, 470);
    }
    // Code
    fade.display();
    mouse.reset();
};