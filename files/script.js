const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gravity = 2000;

let lastTime;
let keys = {};
let center = {x: window.innerWidth/2, y: window.innerHeight/2}
let camera = {x: 0, y: 0, zoom: 2.5};
let level = 0;
const rect = canvas.getBoundingClientRect();
let mouseX;
let mouseY;
let t = 0; //sine wave timer
let deathTimer = 0;
let deaths = 0;
let debugMode = false;
let screen = "start";
let bg = "skyblue"
let levelEnded = false;
let currentDialogue = null;
let dialogueIndex = 0;
let dialogueActive = false;
let gameWon = false;
let endscreen = 1;
let timerStarted = false;
let gameTime = 0;
let time1 = 0;
let time2 = 0;

let dialouge = {
    "level0": [],
    "level1": [
        "Hello Kate",
        "It is quite unfortunate that you fell off of your horse on the way here",
        "But now it is time for us to eat",
        "",
        "This meat is burnt and dry! We shall eat none of it!",
        "We will fast tonight since these rouges cannot prepare a proper meal!"
    ],
    "level2": [
        "Your bed is all messed up you cannot sleep here!",
        "You need to fix the pillows and the sheets",
        "You musn't sleep here tonight!"
    ],
    "level3": [
        "Alright it is time for us to go to your fathers house for your sister's wedding",
        "I see that it is now 7 o'clock, so we should arrive by dinner",
        "I dare assure you, sir, 'tis almost two, and 'twill be supper time ere you come there",
        "Alright then, we are not leaving until it is what time I say it is"
    ],
    "level4": [
        "Good Lord, how bright and goodly shines the moon!",
        "The moon? The sun! It is not moonlight now",
        "I say it is the moon that shines so bright",
        "I know it is the sun that shines so bright",
        "Okay then, I guess we can just go back home if you will not agree"
    ],
    "level5": [
        "Kate look here, hast thou beheld a fresher gentelwoman?",
        "Such war of white and red within her cheeks!",
        "What stars do spangle heaven with such beauty as those two eyes become that heavenly face?",
        "Fair lovely maid, once more good day to thee. Sweet Kate, embrace her for her beauty’s sake",
        "Young budding virgin, fair and fresh and sweet, whither away, or where is thy abode?",
        "Happy the parents of so fair a child!",
        "Happier the man whom favorable stars allots thee for his lovely bedfellow",
        "Why, how now, Kate? I hope thou art not mad! This is a man —old, wrinkled, faded, withered— and not a maiden, as thou sayst he is",
        "Pardon, old father, my mistaking eyes that have been so bedazzled with the sun that everything I look on seemeth green",
        "Now I perceive thou art a reverend father. Pardon, I pray thee, for my mad mistaking"
    ]
}

resizeCanvas();

let shrewLogo;
let startButton;
let levelButton;
let startBtn;
let levelBtn;
let katherine;
let petruchioImg;
let petruchioFImg;
let vincentio;


//Image Loading
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(`Failed to load: ${src}`);
    });
}

Promise.all([
    loadImage("images/shrewLogo.png"),
    loadImage("images/startButton.png"),
    loadImage("images/levelButton.png"),
    loadImage("images/katherine/katherineL0.png"),
    loadImage("images/katherine/katherineL1.png"),
    loadImage("images/katherine/katherineLJ.png"),
    loadImage("images/katherine/katherineR0.png"),
    loadImage("images/katherine/katherineR1.png"),
    loadImage("images/katherine/katherineRJ.png"),
    loadImage("images/petruchio.png"),
    loadImage("images/vincentio.png"),
    loadImage("images/petruchioF.png"),
]).then(images => {
    console.log("All images loaded.");
    shrewLogo = images[0];
    startButton = images[1];
    levelButton = images[2];
    let katherineL0 = images[3];
    let katherineL1 = images[4];
    let katherineLJ = images[5];
    let katherineR0 = images[6];
    let katherineR1 = images[7];
    let katherineRJ = images[8];
    petruchioImg = images[9];
    vincentio = images[10];
    petruchioFImg = images[11];
    katherine = {left: {0: katherineL0, 1: katherineL1, jump: katherineLJ}, right: {0: katherineR0, 1: katherineR1, jump: katherineRJ}};
    startBtn = new Button(0, 0, startButton, 3);
    levelBtn = new Button(0, 0, levelButton, 3);
    startGame();
}).catch(err => {
    console.error(err);
});

class Ground {
    constructor(x, y, width, height, color, solid = true, flicker = false){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.solid = solid
        this.flicker = flicker;
    }

    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
let ground = new Ground(0, 900, 750, 100, "green");


class Player {
    constructor (x, y, width, height){
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height
        this.grounded = false;
        this.yVelocity = 0;
        this.moveSpeed = 400;
        this.canMoveLeft = true;
        this.canMoveRight = true;
        this.jumpHeight = 600;
        this.fly = false;
        this.gracePeriod = .075;
        this.ct = 0; //coyote time
    }

    update(delta) {
        if (level >= 1 && level < 6) timerStarted = true;
        else timerStarted = false
        if (timerStarted) gameTime += delta;
        if (this.fly){
            let dx = 0;
            let dy = 0;

            let speedMult = keys["ShiftLeft"] ? 2 : 1;

            if (keys["ArrowLeft"] || keys["KeyA"]) dx -= this.moveSpeed * speedMult * delta;
            if (keys["ArrowRight"] || keys["KeyD"]) dx += this.moveSpeed * speedMult * delta;
            if (keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) dy -= this.moveSpeed * speedMult * delta;
            if (keys["ArrowDown"] || keys["KeyS"]) dy += this.moveSpeed * speedMult * delta;

            this.x += dx;
            this.y += dy;

        } else if (!levelEnded) {
            this.yVelocity += gravity * delta;
            let speedMult;
            let jumpMult;
            switch (level) {
                case 2:
                    speedMult = .67;
                    jumpMult = .9;
                    break;
                case 3:
                    speedMult = 0.6;
                    jumpMult = .85;
                    break;
                case 4:
                    speedMult = .57;
                    jumpMult = .85;
                    break;
                case 5:
                    speedMult = .35;
                    jumpMult = .65;
                    break;
                default:
                    speedMult = 1;
                    jumpMult = 1;
            }
            

            let dx = 0;
            if (keys["ArrowLeft"] || keys["KeyA"]) dx -= this.moveSpeed * speedMult * delta;
            if (keys["ArrowRight"] || keys["KeyD"]) dx += this.moveSpeed * speedMult * delta;

            this.x += dx;

            for (let p of levels[level].platformsList) {
                if (this.isColliding(p) && p.solid) {
                    if (dx > 0) this.x = p.x - this.width;
                    if (dx < 0) this.x = p.x + p.width;
                }
            }

            this.y += this.yVelocity * delta;
            this.ct -= delta;
            if (this.ct <= 0){
                this.ct = 0;
                this.grounded = false;
            }

            for (let p of levels[level].platformsList) {
                if (this.isColliding(p) && p.solid) {
                    if (this.yVelocity > 0) {
                        this.y = p.y - this.height;
                        this.yVelocity = 0;
                        this.grounded = true;
                        this.ct = this.gracePeriod;
                    } else if (this.yVelocity < 0) {
                        this.y = p.y + p.height;
                        this.yVelocity = 0;
                    }
                }
            }

            if (this.x < 0) this.x=0;
            if (level == 4 && this.x <= levels[level].winPos.x && this.y <= levels[level].winPos.y) levelEnd();
            if (level != 4 && this.x >= levels[level].winPos.x && this.y <= levels[level].winPos.y) levelEnd();

            if ((keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) && this.grounded) {
                this.yVelocity = -this.jumpHeight*jumpMult;
                this.ct = 0;
            }
        }
    }

    isColliding(p) {
        return (
            this.x < p.x + p.width &&
            this.x + this.width > p.x &&
            this.y < p.y + p.height &&
            this.y + this.height > p.y
        );
    }

    draw() {
        ctx.imageSmoothingEnabled = false;
        if (keys["ArrowLeft"] || keys["KeyA"]) {
            this.facing = "left";
        } else if (keys["ArrowRight"] || keys["KeyD"]) {
            this.facing = "right";
        }
        let direction = this.facing || "right";


        let sprite;
        let yOffset = 0;

        if (!this.grounded) {
            sprite = katherine[direction].jump;
            yOffset = 4;
        } else if (keys["ArrowLeft"] || keys["ArrowRight"] || keys["KeyA"] || keys["KeyD"]) {
            let frame = Math.floor(Date.now() / 200) % 2;
            sprite = katherine[direction][frame];
        } else {

            sprite = katherine[direction][0];
        }


        ctx.drawImage(
            sprite,
            this.x - 8,
            this.y + yOffset,
            this.width + 16,
            this.height + 4
        );
    }

    reset (x, y){
        this.x = x;
        this.y = y;
        this.yVelocity = 0;
    }

}

class NPC {
    constructor(x, y, width, height, dialougeArray){
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
        this.dialouge = dialougeArray;
    }

    goTo(x, y){
        this.x = x;
        this.y = y;
    }

    draw(){
        let draw = level == 4 ? petruchioFImg : petruchioImg;
        ctx.drawImage(draw, this.x-8, this.y, this.width+16, this.height)
    }
}


class Platform {
    constructor(x, y, width, height, color, solid = true, flicker = false){
        this.x = x;
        this.y = ground.y - y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.solid = solid;
        this.flicker = flicker;
        this.visible = true;
        this.timer = 0;
        this.t2 = 0;
    }

    draw(delta){
        if (this.flicker){
            if (!this.visible){
                this.t2 -= delta;
                if (this.t2 <= 0){
                    this.t2 =0;
                    this.visible = true;
                }
            }
            if(this.timer == 0 && this.visible) this.timer = randomNum(0.1, 3);
            if (this.visible){
            this.timer -= delta;
            if (this.timer <= 0){
                this.timer = 0;
                this.visible = false;
                this.t2 = randomNum(0.1, 0.4);
            }
        }
            if(this.visible){
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Button {
    constructor(x, y, img, scale){
        this.x = x;
        this.y = y;
        this.img = img;
        this.scale = scale || 1;
        this.width = this.img.width*this.scale;
        this.height = this.img.height*this.scale;
    }

    draw(){
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    scaleBtn(scale) {
        this.scale = scale;
        this.width = this.img.width*this.scale;
        this.height = this.img.height*this.scale;
    }
}

let Pertrucio = new NPC(0, 0, 25, 50);
let Platform1 = new Platform(100, 200, 500, 50, "red");
let Platform2 = new Platform(600, 50, 500, 20, "red");

let platforms = [ground];
let level1 = [
    ground,
    new Platform(600, 50, 200, 20, "red"),
    new Platform (880, 120, 150, 20, "red"),
    new Platform (1175, 120, 50, 20, "red"),
    new Platform (1375, 150, 50, 20, "red"),
    new Platform (1520, 220, 125, 20, "red"),
    new Platform (1775, 275, 75, 20, "red"),
    new Platform (1950, 350, 500, 20, "gold")
];
let level2 = [
    ground,
    new Platform(600, 50, 200, 20, "red"),
    new Platform (880, 100, 150, 20, "red"),
    new Platform (1175, 120, 50, 20, "red"),
    new Platform (1365, 150, 50, 20, "red"),
    new Platform (1520, 200, 125, 20, "red"),
    new Platform (1775, 245, 75, 20, "red"),
    new Platform (1950, 275, 500, 20, "gold")
];
let level3 = [
    ground,
    new Platform(600, 50, 200, 20, "red"),
    new Platform(900, 70, 200, 20, "red"),
    new Platform(1205, 100, 200, 20, "red", true, true),
    new Platform(1425, 150, 100, 20, "red"),
    new Platform(1500, 200, 50, 20, "red"),
    new Platform(1350, 250, 100, 10, "red"),
    new Platform(1200, 300, 125, 10, "red"),
    new Platform(975, 360, 150, 10, "red"),
    new Platform(730, 410, 150, 10, "red", false, true),
    new Platform(600, 475, 150, 10, "red"),
    new Platform(1200, 420, 150, 10, "red", true, true),
    new Platform(1420, 475, 50, 10, "red"),
    new Platform(1570, 525, 25, 10, "red"),
    new Platform(1630, 575, 25, 10, "red"),
    new Platform(1750, 620, 300, 10, "gold")
];
let level4 = [
    ground,
    new Platform(600, 50, 200, 20, "red"),
    new Platform(900, 70, 200, 20, "red"),
    new Platform(1205, 100, 200, 20, "red", true, true),
    new Platform(1425, 150, 100, 20, "red"),
    new Platform(1500, 200, 50, 20, "red"),
    new Platform(1350, 250, 100, 10, "red"),
    new Platform(1200, 300, 125, 10, "red"),
    new Platform(975, 360, 150, 10, "red"),
    new Platform(750, 410, 150, 10, "red", true, true),
    new Platform(540, 435, 150, 10, "red"),
    new Platform(350, 450, 150, 10, "red"),
    new Platform(50, 500, 300, 10, "gold"),
    new Platform(1200, 420, 150, 10, "red", false, true),
    new Platform(1420, 475, 50, 10, "red"),
    new Platform(1570, 525, 25, 10, "red"),
    new Platform(1630, 575, 25, 10, "red"),
    new Platform(1750, 620, 300, 10, "gold")
];
/*let level4 = [
    ground, 
    new Platform(600, 50, 150, 20, "red"),
    new Platform(800, 75, 100, 20, "red"),
    new Platform(1000, 90, 100, 20, "red", true, true),
    new Platform(1150, 110, 100, 20, "red"),
    new Platform(1270, 150, 75, 20, "red"),
    new Platform(1320, 180, 75, 20, "red"),
    new Platform(1500, 200, 75, 20, "red", true, true),
    new Platform(1675, 240, 125, 10, "red"),
    new Platform(1820, 280, 125, 10, "red"),
    new Platform(2000, 300, 125, 10, "red", true, true),
    new Platform(2220, 330, 125, 10, "red"),
    new Platform(2420, 360, 125, 10, "red"),
    new Platform(2600, 360, 125, 10, "red", false, true),
    new Platform(2675, 0, 600, 10, "gold")
];*/
let offset = 120;
let level5 = [
    ground,
    new Platform(820, 0, 50, 10, "red"),
    new Platform(820+offset, 0, 50, 10, "red"),
    new Platform(820+offset*2, 0, 50, 10, "red"),
    new Platform(820+offset*3, 0, 50, 10, "red"),
    new Platform(820+offset*4, 0, 50, 10, "red"),
    new Platform(820+offset*5, 0, 50, 10, "red"),
    new Platform(820+offset*6, 0, 50, 10, "red"),
    new Platform(820+offset*7, 0, 50, 10, "red"),
    new Platform(820+offset*8, 0, 50, 10, "red"),
    new Platform(820+offset*9, 0, 50, 10, "red"),
    new Platform(820+offset*10, 0, 300, 10, "gold")
];


let levels = [
    {id: 0 ,platformsList: platforms, startPos: {x: 150, y: 840}, npcPos: {x: 0, y: 0}, winPos: {x: 99999, y: 99999}},
    {id: 1, platformsList: level1, startPos: {x: 150, y: 840}, npcPos: {x: 2250, y: 500}, winPos: {x: 2100, y: 520}},
    {id: 2, platformsList: level2, startPos: {x: 150, y: 840}, npcPos: {x: 2250, y: 575}, winPos: {x: 2100, y: 595}},
    {id: 3, platformsList: level3, startPos: {x: 150, y: 840}, npcPos: {x: 2000, y: 230}, winPos: {x: 1800, y: 245}},
    {id: 4, platformsList: level4, startPos: {x: 150, y: 840}, npcPos: {x: 105, y: 350}, winPos: {x: 270, y: 360}},
    {id: 5, platformsList: level5, startPos: {x: 600, y: 840}, npcPos: {x: 2200, y: 850}, winPos: {x: 2100, y: 99999}},
    {id: 6 ,platformsList: platforms, startPos: {x: 150, y: 840}, npcPos: {x: 0, y: 0}, winPos: {x: 99999, y: 99999}}
];

let player = new Player(levels[level].startPos.x, levels[level].startPos.y, 20, 40);


function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  center = {x: window.innerWidth/2, y: window.innerHeight/2}
}

function updateCamera() {
    if (levelEnded) {
        switch (level){
            case 1:
                targetX = 2200 - (canvas.width / (2 * camera.zoom));
                targetY = 500 - (canvas.height / (2 * camera.zoom));
                break;
            case 2:
                targetX = 2200 - (canvas.width / (2 * camera.zoom));
                targetY = 585 - (canvas.height / (2 * camera.zoom));
                break;
            case 3:
                targetX = 1900 - (canvas.width / (2 * camera.zoom));
                targetY = 240 - (canvas.height / (2 * camera.zoom));
                break;
            case 4:
                targetX = 180 - (canvas.width / (2 * camera.zoom));
                targetY = 360 - (canvas.height / (2 * camera.zoom));
                break;
            case 5:
                targetX = 2150 - (canvas.width / (2 * camera.zoom));
                targetY = 860 - (canvas.height / (2 * camera.zoom));
                break;
            default:
                targetX = 0 - (canvas.width / (2 * camera.zoom));
                targetY = 0 - (canvas.height / (2 * camera.zoom));
                break;

        }
    } else {
        targetX = player.x - (canvas.width / (2 * camera.zoom)) + player.width / 2;
        targetY = player.y - (canvas.height / (2 * camera.zoom)) + player.height / 2;
    }
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    // clamp
    camera.x = Math.max(0, camera.x);
    camera.y = Math.min((ground.y + ground.height / 2) - canvas.height / camera.zoom, camera.y);
}


function loadLevel(levelId){
    level = levelId;
    player.reset(levels[level].startPos.x, levels[level].startPos.y);
    Pertrucio.goTo(levels[level].npcPos.x, levels[level].npcPos.y)
    console.log("Level: "+level);
}

function isTouchingButton(button){
    if (mouseX >= button.x && mouseX <= button.x + button.width && mouseY >= button.y && mouseY <= button.y + button.height) {
        return true;
    }
}

function drawText (txt, x, y, color = "black", px = "30px Arial", align = "left"){
    ctx.fillStyle = color;
    ctx.font = px;
    ctx.fillText(txt, x, y);
    ctx.textAlign = align
}

const update = (delta) => {
    if (deathTimer == 0) player.update(delta);
    if (player.y > ground.y + ground.height) {
        deathTimer += delta;
        if (deathTimer >= 0.5) {
                resetPlayer();
                deaths ++;
                console.log("Deaths: "+ deaths);
            }
    } else deathTimer = 0;
}

let lastPlatformIndex = -1;
let alertTimer = 0;
let alertText = "Moon!";
let doDrawText = false;
const drawFrame = (delta) => {
    alertTimer -= delta;
    if (alertTimer <= 0) {
        doDrawText = false;
        alertTimer = 0;
    }
    else doDrawText = true;
    if (level == 0) {
        drawTitleScreen(delta);
    } else if (level != 6){
        if (level == 4) {
            if (bg === "darkblue") {
                time2 -= delta;
                if (time2 <= 0) {
                    time2 = 0;
                    bg = "skyblue";
                }
            } else if (bg === "skyblue") {
                if (time1 === 0) time1 = randomNum(0.1, 5);
                time1 -= delta;
                if (time1 <= 0) {
                    time1 = 0;
                    bg = "darkblue";
                    time2 = randomNum(0.5, 1.5);
                }
            }
        }
        
        if (level == 5){
            let currentPlatformIndex = -1;
            for (let i = 0; i < 11; i++){
                if(player.x >= 820 + offset * i && player.x < 820 + offset * (i+1)){
                    currentPlatformIndex = i;
                    break;
                }
            }

            if (currentPlatformIndex !== -1 && currentPlatformIndex !== lastPlatformIndex) {
                bg = bg == "skyblue" ? "darkblue" : "skyblue";
                alertText = bg == "skyblue" ? "Sun!" : "Moon!";
                alertTimer = 1;
                lastPlatformIndex = currentPlatformIndex;
            }
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bg;
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);
        player.draw();
        Pertrucio.draw();
        if (level == 5){
            ctx.drawImage(vincentio, 2230, 850, 40, 50);
        }
        for (let p of levels[level].platformsList) p.draw(delta);
        ctx.restore();
        drawDialogue();
        if (doDrawText) drawText(alertText, center.x, center.y, "black", "50px Arial", "center");
        if(debugMode){
            drawText("Debug Mode", 50, 50);
            drawText("Player X: " + Math.floor(player.x), 50, 90);
            drawText("Player Y: " + Math.floor(player.y), 50, 130);
            drawText("Y Velocity: " + Math.floor(player.yVelocity), 50, 170);
            drawText("Flying: " + player.fly, 50, 210);
            drawText("Level: " + level + "/" + (levels.length-2), 50, 250);
            drawText("Deaths: " + deaths, 50, 290)
            drawText("Time: " + Math.floor(gameTime), 50, 330)
            drawText("Controls:", window.innerWidth - 250, 50);
            drawText("L: Toggle Debug", window.innerWidth - 250, 90);
            drawText("F: Toggle Flight", window.innerWidth - 250, 130);
            drawText("Shift: Speed up", window.innerWidth - 250, 170);
            drawText("B: Previous Level", window.innerWidth - 250, 210);
            drawText("N: Next Level", window.innerWidth - 250, 250);
        }
    } else {
        drawEndScreen();
    }
}

const gameLoop = (timestamp) => {
    let delta = (timestamp - lastTime) / 1000;
    if (delta > 0.05) delta = 0.05;
    lastTime = timestamp;
    update(delta);
    updateCamera();
    drawFrame(delta);
    requestAnimationFrame(gameLoop);
}

function drawTitleScreen(delta){
    const speed = 0.5;
    t += delta * speed * Math.PI * 2;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "grey";
    ctx.fillRect(0,0, window.innerWidth, window.innerHeight);
    let scale = 0.6;
    let startBtnScale;
    let levelBtnScale;
    if(isTouchingButton(startBtn)) {
        startBtnScale = 5.5;
    }
    else {
        startBtnScale = 5;
    }
    if(isTouchingButton(levelBtn)) {
        levelBtnScale = 5.5;
    }
    else {
        levelBtnScale = 5;
    }
    startBtn.scaleBtn(startBtnScale);
    levelBtn.scaleBtn(levelBtnScale);
    const amplitude = 10;
    const offsetY = (center.y-shrewLogo.height/(2/scale))-(window.innerHeight/6);
    const y = offsetY + Math.sin(t) * amplitude;
    ctx.drawImage(shrewLogo, center.x-shrewLogo.width/(2/scale), y, shrewLogo.width*scale, shrewLogo.height*scale)

    startBtn.x = (center.x - startButton.width/(2/startBtnScale)) - window.innerWidth/4
    startBtn.y = center.y - startButton.height/(2/startBtnScale) + shrewLogo.height*scale/2;

    levelBtn.x = (levelBtn.x = center.x - startButton.width/(2/levelBtnScale)) + window.innerWidth/4
    levelBtn.y = center.y - startButton.height/(2/levelBtnScale) + shrewLogo.height*scale/2;
    startBtn.draw();
    levelBtn.draw();
}

function drawEndScreen (){
    if (endscreen = 1){
        ctx.fillStyle = "grey";
        ctx.fillRect(0,0, window.innerWidth, window.innerHeight);
        drawText("You.... win?", center.x, center.y- 50, "black", "bold 60px sans-serif", "center");
        drawText("You gave in to Petruchio and stopped your suffering", center.x, center.y+50, "black", "bold 50px sans-serif", "center");
        drawText("Time: " + Math.floor(gameTime) + " seconds", center.x, center.y+100, "black", "bold 30px sans-serif", "center");
        drawText("Deaths: " + deaths, center.x, center.y+150, "black", "bold 30px sans-serif", "center");
        drawText("Press space to continue", center.x, window.innerHeight-100, "darkgrey", "bold 30px sans-serif", "center");
    } else {
        ctx.fillStyle = "grey";
        ctx.fillRect(0,0, window.innerWidth, window.innerHeight);
        drawText("Press space to continue", center.x, window.innerHeight-100, "darkgrey", "bold 30px sans-serif", "center");
    }
}

function resetPlayer(){
    player.reset(levels[level].startPos.x, levels[level].startPos.y);
    bg = "skyblue";
}

function levelEnd(){
    levelEnded = true;
    startDialogue("level" + level);
    //nextLevel();
}

function startDialogue(levelKey) {
    currentDialogue = dialouge[levelKey];
    dialogueIndex = 0;
    dialogueActive = true;
}

function drawDialogue() {
    if (!dialogueActive) return;

    let speaker;
    switch (level){
        case 3:
            if (dialogueIndex == 2) speaker = "Katherine"
            else speaker = "Petruchio"
            break;
        case 4:
            if (dialogueIndex == 1 || dialogueIndex == 3) speaker = "Katherine"
            else speaker = "Petruchio"
            break;
        case 5:
            if (dialogueIndex == 4 || dialogueIndex == 5 || dialogueIndex == 6 || dialogueIndex == 8 || dialogueIndex == 9) speaker = "Katherine"
            else speaker = "Petruchio"
            break;
        default:
            speaker = "Petruchio"
            break;
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(50, canvas.height - 150, canvas.width - 100, 110);

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText(speaker + ":", 70, canvas.height - 110);
    wrapText(ctx, currentDialogue[dialogueIndex], 70, canvas.height - 80, canvas.width - 140, 28);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && i > 0) {
            ctx.fillText(line, x, y);
            line = words[i] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}


canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () =>{
    if(isTouchingButton(startBtn)){
        loadLevel(1);
    }
    if(isTouchingButton(levelBtn)){
        screen = "level"
    }
});

window.addEventListener("keydown", e => {
    if(e.code == "KeyR" && !keys[e.code]) player.reset(levels[level].startPos.x, levels[level].startPos.y)
    if(e.code == "KeyN" && !keys[e.code] && debugMode) nextLevel();
    if(e.code == "KeyB" && !keys[e.code] && debugMode) prevLevel();
     if (dialogueActive && e.code === "Space") {
        dialogueIndex++;
        if (dialogueIndex >= currentDialogue.length) {
            dialogueActive = false;
            levelEnded = false;
            nextLevel();
        }
    }
    if(e.code == "KeyL" && !keys[e.code]){
        debugMode = !debugMode;
        player.fly = false;
    }
    if(e.code == "KeyF" && !keys[e.code] && debugMode) {
        player.fly = !player.fly
        player.yVelocity = 0;
    }
    if(e.code == "Space" && !keys[e.code] && level == 6) {
        if (endscreen == 1) endscreen = 2;
        else nextLevel();
    }
    keys[e.code] = true;
});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});


function nextLevel (){
    bg = "skyblue"
    levelEnded = false;
    let l = level + 1;
    if (l>=levels.length){
        loadLevel(0)
    }
    else loadLevel(l);
}

function prevLevel (){
    let l = level - 1;
    if (l<0) l = 0
    else loadLevel(l);
}

function startGame(){
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function randomNum(min, max){
    return Math.random() * (max - min) + min;
}
loadLevel(level);
window.addEventListener("resize", resizeCanvas);