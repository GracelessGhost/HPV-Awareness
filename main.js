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
    'person-HPV': "assets/person-HPV.png",
    'vaccine': "assets/vaccine.png",
    'bulb': "assets/bulb.png",
    'coin': "assets/coin.png",
    'logo-word': "assets/logo-word.png",
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
        this.color.o = map(sin(frameCount + this.offset), -1, 1 , 0, 50);
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
    this.width = 15;
    this.height = 33;
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
        if(mouse.overlapEllipse(this.pos.x, this.pos.y, this.width, this.height)) {
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
        else if(this.state === "HPV") {
            this.sprite = images['person-HPV'];
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
        image(this.sprite, this.pos.x, this.pos.y, this.width, this.height);
    };
};

// Persons
var persons = {
    array: [],
    add: function(n, state) {
        for(var i = 0; i < n; i ++) {
            var p = new Person(width / 2, height / 2, state);
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
    "Welcome to Dr. GO (beta)!",
    "This is your country. Your\njob is to keep it safe.",
    "Here are some citizens!",
    "Uh oh! It looks like someone\ngot sick!",
    "Tap the person to learn more about the illness.",
    "If left untreated, this person will\ninfect others!",
    "Let's add some protection through vaccination!",
    "Tap a healthy person to give them an\nHPV vaccine.",
    "Now, this person is immune to HPV!",
    "Each day, you can check on your country\nto see how many people have become infected.",
    "As you vaccinate your population, you'll\ngain awareness points and level up.",
    "At higher levels, you'll unlock new vaccines\nand amenities for your country!",
    "You're starting out with 100 coins.\nClick the coin icon to visit the shop.",
    "At the shop, you can buy vaccines and amenities\nto improve your country.",
    "You can earn more coins by logging in every day\nand answering bonus questions!",
    "If you invite your friends to Dr. GO,\nyou'll both win bonuses!",
    "That's all for now. Good luck!",
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

// Vaccinate button class
var VaccinateButton = function(x, y, w, h, label, funct){
    this.textSize = h * 0.3;
    this.update = function() {
        fill(0);
        this.textSize = h * 0.4;
        if(cache.character.state === "healthy" && cache.vaccines > 0) {
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
        }
        else {
            fill(150);
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

// Invisible button class
var InvisibleButton = function(x, y, w, h, label, funct){
    this.update = function() {
        fill(0);
        if(mouse.overlapRect(x - w / 2, y - h / 2, w, h)) {
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
    };
};

// Shop button class
var ShopButton = function(x, y, w, h, label, price, funct){
    this.textSize = h * 0.3;
    this.price = price;
    this.update = function() {
        fill(0);
        this.textSize = h * 0.4;
        if(cache.coins >= this.price) {
            if(mouse.overlapRect(x - w / 2, y - h / 2, w, h)) {
                fill(50);
                cursor(HAND);
                if(mouse.released) {
                    mouse.released = false;
                    sounds.pop.play();
                    funct();
                    cache.coins -= this.price;
                }
                else if(mouse.pressed) {
                }
            }
        }
        else {
            fill(150);
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
        new VaccinateButton(215, 650, 200, 45, "Vaccinate!", function() {
            cache.character.state = "vaccinated";
            cache.vaccines --;
            cache.awareness += 5;
        }),
        new InvisibleButton(215, 470, 40, 30, "", function() {
            scene = "info";
        }),
    ],
    info: [
        new Button(60, 50, 75, 45, "Back", function() {
            if(fade.color.o === 0) {
                scene = "character";
            }
        }),
    ],
    display: function(which) {
        buttons[which].display();
    },
    tutorial: [
        new InvisibleButton(400, 70, 25, 25, "", function() {
            scene = "shop";
        }),
    ],
    shop: [
        new ShopButton(215, 100 + 100, 350, 50, "HPV Vaccine (10 coins)", 10, function() {
            cache.vaccines ++;
        }),
        new ShopButton(215, 175 + 100, 350, 50, "TB Vaccine (110 coins)", 110, function() {
            cache.vaccines ++;
        }),
        new ShopButton(215, 250 + 100, 350, 50, "Hep B Vaccine (110 coins)", 110, function() {
            cache.vaccines ++;
        }),
    ],
    login: [
        new Button(215, 100 + 300, 350, 50, "1 dose", function() {
        }),
        new Button(215, 175 + 300, 350, 50, "2 doses", function() {
        }),
        new Button(215, 250 + 300, 350, 50, "3 doses", function() {
        }),
    ],
};

// Cache
var cache = {
    tutorialText: 0,
    tutorialHold: false,
    character: null,
    vaccines: 5,
    awareness: 0,
    maxAwareness: 50,
    coins: 100,
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
        image(images['logo-word'], width / 2, height * 0.3, 250, 250)
        styleText(50, color(0, 0, 0), "Roboto", CENTER, CENTER);
        // text("Dr. GO", width / 2, height / 3);
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
        if(cache.tutorialText <= tutorialText.length - 1) {
            fill(0, 0, 0, 200);
            rectMode(CENTER);
            rect(width / 2, height * 0.92, width * 0.9, height * 0.1, 5);
            rectMode(CORNER);
            styleText(15, color(255), "Roboto", CENTER, CENTER);
            text(tutorialText[cache.tutorialText], width / 2, height * 0.92);
            styleText(15, color(0), "Roboto", CENTER, CENTER);
            // text(cache.tutorialText, 50, 50);
            // console.log(tutorialText.length);
        }
        if(mouse.released) {
            if(!cache.tutorialHold) {
                cache.tutorialText ++;
            }
            if(cache.tutorialText === 2) {
                persons.add(25, "healthy");
            }
            if(cache.tutorialText === 3) {
                var i = floor(random(persons.array.length));
                persons.array[i].state = "HPV";
            }
            if(cache.tutorialText === 4) {
                cache.tutorialHold = true;
            }
            if(cache.tutorialText === 7) {
                cache.tutorialHold = true;
            }
            if(cache.tutorialText === 12) {
                cache.tutorialHold = true;
            }
        }
        if(cache.tutorialText >= 0) {
            image(images['vaccine'], 400, 30, 28, 35);
            styleText(15, color(0), "Roboto", RIGHT, CENTER);
            text(cache.vaccines, 380, 30);
        }
        if(cache.tutorialText >= 10) {
            image(images['bulb'], 20, 30, 22, 25);
            fill(255);
            stroke(0);
            strokeWeight(1);
            rect(40, 25, 300, 10);
            noStroke();
            fill(70, 150, 50);
            rect(40, 25, map(cache.awareness, 0, cache.maxAwareness, 0, 300, 10), 10);
            noFill();
            stroke(0);
            strokeWeight(1);
            rect(40, 25, 300, 10);
        }
        if(cache.tutorialText >= 12) {
            image(images['coin'], 400, 70, 25, 25);
            styleText(15, color(0), "Roboto", RIGHT, CENTER);
            text(cache.coins, 380, 70);
            buttons["tutorial"][0].display();
        }
    }
    else if(scene === "character") {
        background(255);
        redDots.display();
        cache.character.updateSprite();
        image(cache.character.sprite, width / 2, height / 3 + sin(frameCount * 2) * 3, 91, 200);
        buttons["character"][0].display();
        if(cache.tutorialText >= 7) {
            buttons["character"][1].display();
        }
        styleText(40, color(0), "Roboto", CENTER, CENTER);
        text(cache.character.name, width / 2, 400);
        styleText(15, color(0), "Roboto", CENTER, CENTER);
        text(capitalize(cache.character.sex), width / 2, 450);
        text(capitalize(cache.character.state), width / 2, 470);
        if(cache.character.state === "HPV") {
            buttons["character"][2].display();
        }
        image(images['vaccine'], 400, 30, 28, 35);
        styleText(15, color(0), "Roboto", RIGHT, CENTER);
        text(cache.vaccines, 380, 30);
        if(cache.tutorialText >= 12) {
            image(images['coin'], 400, 70, 25, 25);
            styleText(15, color(0), "Roboto", RIGHT, CENTER);
            text(cache.coins, 380, 70);
        }
    }
    else if(scene === "info") {
        background(255);
        redDots.display();
        buttons.display("info");
        styleText(15, color(0), "Roboto", CENTER, CENTER);
        text(hpvInfo, width * 0.05, 0, width * 0.9, height);
    }
    else if(scene === "login") {
        background(255);
        redDots.display();
        styleText(30, color(0), "Roboto", CENTER, CENTER);
        text("DAILY BONUS", width / 2, height * 0.2);
        styleText(15, color(0), "Roboto", CENTER, CENTER);
        text("What is the recommended number of HPV\ndoses for children ages 9-12?", width / 2, height * 0.3);
        buttons.display("login");
    }
    else if(scene === "shop") {
        background(255);
        redDots.display();
        buttons["character"][0].display();
        image(images['vaccine'], 400, 30, 28, 35);
        styleText(15, color(0), "Roboto", RIGHT, CENTER);
        text(cache.vaccines, 380, 30);
        image(images['coin'], 400, 70, 25, 25);
        styleText(15, color(0), "Roboto", RIGHT, CENTER);
        text(cache.coins, 380, 70);
        buttons.display("shop");
    }
    if(keysReleased.n) {
        persons.add(1, "HPV");
        keysReleased.n = false;
    }
    if(keysReleased.l) {
        keysReleased.l = false;
        fade.to("login", 3);
    }
    if(keysReleased.t) {
        keysReleased.t = false;
        fade.to("tutorial", 3);
    }
    // Code
    fade.display();
    mouse.reset();
};