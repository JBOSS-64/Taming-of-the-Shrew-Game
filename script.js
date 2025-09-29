const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gravity = 2000;

let lastTime;
let keys = {};
let center = {x: window.innerWidth/2, y: window.innerHeight/2}
let camera = {x: 0, y: 0, zoom: 3};
let level = 0;
const rect = canvas.getBoundingClientRect();
let mouseX;
let mouseY;
let t = 0; //sine wave timer


resizeCanvas();

let shrewLogo;
let startButton;
let startBtn;


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
    loadImage("images/startButton.png")
]).then(images => {
    console.log("All images loaded.");
    shrewLogo = images[0];
    startButton = images[1];
    startBtn = new Button(0, 0, startButton, 3);
    startGame();
}).catch(err => {
    console.error(err);
});

class Ground {
    constructor(x, y, width, height, color){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
let ground = new Ground(0, 900, 930, 100, "green");


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
        this.debugMode = false;
        this.gracePeriod = .075;
        this.ct = 0; //coyote time
    }

    update(delta) {
        if (this.debugMode){
            let dx = 0;
            let dy = 0;

            let speedMult = keys["ShiftLeft"] ? 2 : 1;

            if (keys["ArrowLeft"] || keys["KeyA"]) dx -= this.moveSpeed * speedMult * delta;
            if (keys["ArrowRight"] || keys["KeyD"]) dx += this.moveSpeed * speedMult * delta;
            if (keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) dy -= this.moveSpeed * speedMult * delta;
            if (keys["ArrowDown"] || keys["KeyS"]) dy += this.moveSpeed * speedMult * delta;

            this.x += dx;
            this.y += dy;

        } else {
            this.yVelocity += gravity * delta;
            let speedMult = level == 2 ? .67 : 1;
            let jumpMult = level == 2 ? .9 : 1;

            let dx = 0;
            if (keys["ArrowLeft"] || keys["KeyA"]) dx -= this.moveSpeed * speedMult * delta;
            if (keys["ArrowRight"] || keys["KeyD"]) dx += this.moveSpeed * speedMult * delta;

            this.x += dx;

            for (let p of levels[level].platformsList) {
                if (this.isColliding(p)) {
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
                if (this.isColliding(p)) {
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
            if (this.x >= levels[level].winPos.x && this.y <= levels[level].winPos.y) nextLevel();

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

    draw(){
        ctx.fillStyle = "blue";
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    reset (x, y){
        this.x = x;
        this.y = y;
        this.yVelocity = 0;
        this.debugMode = false;
    }

}

class NPC {
    constructor(x, y, width, height){
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height
    }

    goTo(x, y){
        this.x = x;
        this.y = y;
    }

    draw(){
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}


class Platform {
    constructor(x, y, width, height, color){
        this.x = x;
        this.y = ground.y - y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
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
    new Platform(600, 50, 200, 20, "red"), new Platform (880, 120, 150, 20, "red"), new Platform (1175, 120, 50, 20, "red"),
    new Platform (1375, 150, 50, 20, "red"), new Platform (1520, 235, 125, 20, "red"), new Platform (1775, 275, 75, 20, "red"),
    new Platform (1950, 350, 500, 20, "gold")
];
let level2 = [
    ground,
    new Platform(600, 50, 200, 20, "red"), new Platform (880, 120, 150, 20, "red"), new Platform (1175, 120, 50, 20, "red"),
    new Platform (1375, 150, 50, 20, "red"), new Platform (1520, 200, 125, 20, "red"), new Platform (1775, 245, 75, 20, "red"),
    new Platform (1950, 275, 500, 20, "gold")
];
let level3 = [ground, Platform2];
let level4 = [ground, Platform2];
let level5 = [ground, Platform2];
let level6 = [ground, Platform2];


let levels = [
    {id: 0 ,platformsList: platforms, startPos: {x: 150, y: 840}, npcPos: {x: 0, y: 0}, winPos: {x: 99999, y: 99999}},
    {id: 1, platformsList: level1, startPos: {x: 150, y: 840}, npcPos: {x: 2250, y: 500}, winPos: {x: 2100, y: 520}},
    {id: 2, platformsList: level2, startPos: {x: 150, y: 840}, npcPos: {x: 2250, y: 575}, winPos: {x: 2100, y: 595}},
    {id: 3, platformsList: level3, startPos: {x: 150, y: 840}, npcPos: {x: 0, y: 0}, winPos: {x: 99999, y: 99999}},
    {id: 4, platformsList: level4, startPos: {x: 150, y: 840}, npcPos: {x: 0, y: 0}, winPos: {x: 99999, y: 99999}},
    {id: 5, platformsList: level5, startPos: {x: 150, y: 840}, npcPos: {x: 0, y: 0}, winPos: {x: 99999, y: 99999}}
];

let player = new Player(levels[level].startPos.x, levels[level].startPos.y, 20, 40);


function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  center = {x: window.innerWidth/2, y: window.innerHeight/2}
}

function updateCamera() {
    const targetX = player.x - (canvas.width / (2 * camera.zoom)) + player.width / 2;
    const targetY = player.y - (canvas.height / (2 * camera.zoom)) + player.height / 2;

    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    // clamp
    camera.x = Math.max(0, camera.x);
    camera.y = Math.min(
        (ground.y + ground.height / 2) - canvas.height / camera.zoom,
        camera.y
    );
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

function drawText (txt, x, y, color = "black", px = "30px Arial"){
    ctx.fillStyle = color;
    ctx.font = px;
    ctx.fillText(txt, x, y);
}

const update = (delta) => {
    player.update(delta);
    if (player.y > ground.y + ground.height) resetPlayer();
}

const drawFrame = (delta) => {
    if (level == 0) {
        drawTitleScreen(delta);
    } else{
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawText("Player X: " + Math.floor(player.x), 50, 50);
        drawText("Player Y: " + Math.floor(player.y), 50, 90);
        ctx.save();
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);
        player.draw();
        Pertrucio.draw();
        for (let p of levels[level].platformsList) p.draw();
        ctx.restore();
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
    let btnScale;
    if(isTouchingButton(startBtn)) {
        btnScale = 5.5;
    }
    else {
        btnScale = 5;
    }
    startBtn.scaleBtn(btnScale);
    const amplitude = 10;
    const offsetY = (center.y-shrewLogo.height/(2/scale))-(window.innerHeight/6);
    const y = offsetY + Math.sin(t) * amplitude;
    ctx.drawImage(shrewLogo, center.x-shrewLogo.width/(2/scale), y, shrewLogo.width*scale, shrewLogo.height*scale)
    startBtn.x = center.x - startButton.width/(2/btnScale)
    startBtn.y = center.y - startButton.height/(2/btnScale) + shrewLogo.height*scale/2;
    startBtn.draw();
}

function resetPlayer(){
    player.reset(levels[level].startPos.x, levels[level].startPos.y);
}

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () =>{
    if(isTouchingButton(startBtn)){
        loadLevel(1);
    }
});

window.addEventListener("keydown", e => {
    if(e.code == "KeyR" && !keys[e.code]) player.reset(levels[level].startPos.x, levels[level].startPos.y)
    if(e.code == "KeyN" && !keys[e.code]) nextLevel();
    if(e.code == "KeyB" && !keys[e.code]) prevLevel();
    if(e.code == "KeyL" && !keys[e.code]) player.debugMode = !player.debugMode;
    keys[e.code] = true;
});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});


function nextLevel (){
    let l = level + 1;
    if (l>=levels.length) l = levels.length-1
    else loadLevel(l);
}

function prevLevel (){
    let l = level - 1;
    if (l<0) l = 0
    else loadLevel(l);
}

function startGame(){
    lastTime = 0;
    requestAnimationFrame(gameLoop);
}
loadLevel(level);
window.addEventListener("resize", resizeCanvas);