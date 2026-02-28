const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

// Game State
let score = 0;
let mistakes = 0;
let gameActive = false;
let speed = 5;
let roadOffset = 0;
let distanceToFinish = 5000; // Total distance to destination

// Player Car
const player = {
    x: 175,
    y: 500,
    w: 50,
    h: 80,
    speed: 5
};

// Controls
let keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Hazards & Rules
let events = [];
const eventTypes = ['SIGNAL', 'SPEED_LIMIT', 'PEDESTRIAN'];

const questions = [
    { q: "What should you do at a yellow light?", a: ["Speed up", "Slow down & stop", "Honk"], correct: 1 },
    { q: "Who has the right of way at a crossing?", a: ["Cars", "Buses", "Pedestrians"], correct: 2 },
    { q: "What is the primary cause of road accidents?", a: ["Speeding", "Safe driving", "New tires"], correct: 0 }
];

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameActive = true;
    requestAnimationFrame(gameLoop);
    spawnEvent();
}

function spawnEvent() {
    if (!gameActive) return;
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    events.push({
        type: type,
        y: -100,
        x: 0,
        w: 400,
        h: 100,
        active: true,
        passed: false,
        color: type === 'SIGNAL' ? 'red' : (type === 'SPEED_LIMIT' ? 'blue' : 'white')
    });
    setTimeout(spawnEvent, 3000 + Math.random() * 2000);
}

function update() {
    if (!gameActive) return;

    // Movement
    if (keys['ArrowLeft'] && player.x > 10) player.x -= 5;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w - 10) player.x += 5;
    
    // Road movement
    roadOffset += speed;
    distanceToFinish -= speed;

    // Logic for events
    events.forEach(ev => {
        ev.y += speed;

        // Check Rule Compliance
        if (ev.active && ev.y > player.y - 50 && ev.y < player.y + 50) {
            if (ev.type === 'SIGNAL' && speed > 0) {
                triggerMistake("Ran a Red Light!");
                ev.active = false;
            }
            if (ev.type === 'SPEED_LIMIT' && speed > 5) { // Simplified limit check
                triggerMistake("Exceeded Speed Limit!");
                ev.active = false;
            }
        }

        // Successfully passed
        if (!ev.passed && ev.y > canvas.height) {
            score += 10;
            ev.passed = true;
            updateUI();
        }
    });

    if (distanceToFinish <= 0) endGame(true);
}

function triggerMistake(reason) {
    mistakes++;
    score -= 10;
    updateUI();
    if (mistakes >= 3) {
        gameActive = false;
        showQuestion();
    }
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('mistakes').innerText = mistakes;
    document.getElementById('speed-display').innerText = Math.floor(speed * 10);
}

function showQuestion() {
    const qModal = document.getElementById('question-modal');
    const qObj = questions[Math.floor(Math.random() * questions.length)];
    
    document.getElementById('question-text').innerText = qObj.q;
    const optionsDiv = document.getElementById('options-container');
    optionsDiv.innerHTML = '';
    
    qObj.a.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'option-btn';
        btn.onclick = () => {
            if (index === qObj.correct) {
                mistakes = 0;
                gameActive = true;
                qModal.classList.add('hidden');
                updateUI();
                requestAnimationFrame(gameLoop);
            } else {
                endGame(false);
            }
        };
        optionsDiv.appendChild(btn);
    });
    qModal.classList.remove('hidden');
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Road
    ctx.fillStyle = "#444";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.setLineDash([20, 20]);
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();

    // Draw Events
    events.forEach(ev => {
        ctx.fillStyle = ev.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, ev.y, canvas.width, 20);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "white";
        ctx.fillText(ev.type, 10, ev.y + 15);
    });

    // Draw Player (Placeholder for car.png)
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.w, player.h);
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function endGame(win) {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('result-title').innerText = win ? "Destination Reached!" : "Game Over!";
    document.getElementById('final-score').innerText = score;
}
