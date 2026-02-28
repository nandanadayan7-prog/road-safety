// Ensure the script waits for the HTML to be fully loaded
window.onload = function() {
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

    assets.road.src = 'https://image2url.com/r2/default/images/1772265054646-1d2ff272-b371-42fc-8e2d-c26f42e999df.png';
    assets.signal.src = 'https://image2url.com/r2/default/images/1772262414993-4289c9f0-b8f8-478f-b33e-a41eaae47ef6.png';
    assets.car.src = 'https://image2url.com/r2/default/images/1772264923342-7356f6dd-e816-4078-a5ed-206ae55f46f3.png';

    // --- GAME STATE ---
    let score = 0;
    let mistakes = 0;
    let gameActive = false;
    let roadOffset = 0;
    let currentSpeed = 0; 
    const MAX_SPEED = 7;
    const BRAKE_FORCE = 0.3;
    const ACCEL_FORCE = 0.15;
    let frameCount = 0;
    let events = [];
    const player = { x: 175, y: 480, w: 50, h: 90 };
    let keys = {};

    // Input Listeners
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);

    const questions = [
        { q: "What should you do at a red light?", a: ["Speed up", "Come to a full stop", "Honk"], correct: 1 },
        { q: "Is it safe to text while driving?", a: ["Yes", "No", "Only at stop signs"], correct: 1 },
        { q: "What does a green light mean?", a: ["Stop", "Go if clear", "Reverse"], correct: 1 }
    ];

    // ATTACH START FUNCTION TO WINDOW SO HTML CAN SEE IT
    window.startGame = function() {
        console.log("Game Starting...");
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        gameActive = true;
        score = 0;
        mistakes = 0;
        currentSpeed = 2;
        events = [];
        updateUI();
        gameLoop();
    };

    function spawnEvent() {
        if(!gameActive) return;
        const types = ['SIGNAL', 'SPEED_LIMIT'];
        const type = types[Math.floor(Math.random() * types.length)];
        events.push({ type: type, y: -200, active: true, passed: false });
    }

    function update() {
        if (!gameActive) return;

        if (keys['ArrowUp']) currentSpeed = Math.min(currentSpeed + ACCEL_FORCE, MAX_SPEED);
        else if (keys['ArrowDown']) currentSpeed = Math.max(currentSpeed - BRAKE_FORCE, 0);
        else if (currentSpeed > 0.5) currentSpeed -= 0.05;

        if (keys['ArrowLeft'] && player.x > 30) player.x -= 5;
        if (keys['ArrowRight'] && player.x < canvas.width - player.w - 30) player.x += 5;

        roadOffset += currentSpeed;
        frameCount++;
        if (frameCount % 200 === 0) spawnEvent();

        events.forEach((ev) => {
            ev.y += currentSpeed;
            if (ev.active && ev.y > player.y - 40 && ev.y < player.y + 10) {
                if (ev.type === 'SIGNAL' && currentSpeed > 0.8) {
                    handleMistake();
                    ev.active = false;
                }
            }
            if (!ev.passed && ev.y > player.y + 100) {
                score += 10;
                ev.passed = true;
                updateUI();
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Road
        ctx.drawImage(assets.road, 0, (roadOffset % canvas.height) - canvas.height, canvas.width, canvas.height);
        ctx.drawImage(assets.road, 0, (roadOffset % canvas.height), canvas.width, canvas.height);
        // Events
        events.forEach(ev => {
            if (ev.type === 'SIGNAL') ctx.drawImage(assets.signal, 0, ev.y, canvas.width, 120);
            else {
                ctx.fillStyle = "white";
                ctx.fillRect(0, ev.y, canvas.width, 40);
                ctx.fillStyle = "black";
                ctx.fillText("SLOW DOWN", 150, ev.y + 25);
            }
        });
        // Car
        ctx.drawImage(assets.car, player.x, player.y, player.w, player.h);
    }

    function handleMistake() {
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
        container
