const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// --- ASSET LOADING ---
const assets = {
    car: new Image(),
    road: new Image(),
    signal: new Image()
};

assets.car.src = 'assets/car.png';
assets.road.src = 'assets/road.png';
assets.signal.src = 'assets/signals.png';

// --- GAME STATE ---
let score = 0;
let mistakes = 0;
let gameActive = false;
let roadOffset = 0;
let speed = 5;
let frameCount = 0;
let events = [];

const player = { x: 175, y: 480, w: 50, h: 90 };
let keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

const questions = [
    { q: "What does a flashing yellow light mean?", a: ["Stop immediately", "Proceed with caution", "Speed up"], correct: 1 },
    { q: "Solid white lines on the road mean...", a: ["No lane changing", "Free parking", "Overtake now"], correct: 0 },
    { q: "When should you use your high beams?", a: ["In heavy traffic", "On dark, open roads", "To annoy others"], correct: 1 }
];

// --- CORE FUNCTIONS ---
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameActive = true;
    score = 0;
    mistakes = 0;
    events = [];
    updateUI();
    gameLoop();
}

function spawnEvent() {
    const types = ['SIGNAL', 'SPEED_LIMIT', 'PEDESTRIAN'];
    const type = types[Math.floor(Math.random() * types.length)];
    events.push({
        type: type,
        y: -150,
        h: 60,
        passed: false,
        active: true
    });
}

function update() {
    if (!gameActive) return;

    // Movement logic
    if (keys['ArrowLeft'] && player.x > 20) player.x -= 5;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w - 20) player.x += 5;

    roadOffset += speed;
    frameCount++;

    // Spawn hazards every 150 frames
    if (frameCount % 150 === 0) spawnEvent();

    events.forEach((ev, index) => {
        ev.y += speed;

        // Collision/Rule Detection
        if (ev.active && ev.y > player.y - 30 && ev.y < player.y + 30) {
            if (ev.type === 'SIGNAL' && speed > 2) { // Logic: Player didn't slow down
                handleMistake("Failed to stop at Red Light!");
                ev.active = false;
            }
        }

        // Scoring for passing successfully
        if (!ev.passed && ev.y > canvas.height) {
            score += 10;
            ev.passed = true;
            updateUI();
        }
    });

    // Clean up old events
    events = events.filter(ev => ev.y < canvas.height + 100);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Scrolling Road
    ctx.drawImage(assets.road, 0, (roadOffset % canvas.height) - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(assets.road, 0, (roadOffset % canvas.height), canvas.width, canvas.height);

    // 2. Draw Events
    events.forEach(ev => {
        if (ev.type === 'SIGNAL') {
            ctx.drawImage(assets.signal, 50, ev.y, 300, 80);
        } else {
            // Placeholder for other assets
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fillRect(0, ev.y, canvas.width, 20);
            ctx.fillStyle = "white";
            ctx.fillText(ev.type, 20, ev.y + 15);
        }
    });

    // 3. Draw Player Car
    ctx.drawImage(assets.car, player.x, player.y, player.w, player.h);
}

function handleMistake(reason) {
    mistakes++;
    score = Math.max(0, score - 10);
    updateUI();
    if (mistakes >= 3) {
        gameActive = false;
        showQuiz();
    }
}

function showQuiz() {
    const modal = document.getElementById('question-modal');
    const q = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('question-text').innerText = q.q;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    q.a.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'option-btn';
        btn.onclick = () => {
            if (i === q.correct) {
                mistakes = 0;
                gameActive = true;
                modal.classList.add('hidden');
                updateUI();
                gameLoop();
            } else {
                endGame();
            }
        };
        container.appendChild(btn);
    });
    modal.classList.remove('hidden');
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('mistakes').innerText = mistakes;
    document.getElementById('speed-display').innerText = Math.floor(speed * 10);
}

function endGame() {
    gameActive = false;
    document.getElementById('question-modal').classList.add('hidden');
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
