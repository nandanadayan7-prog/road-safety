// Ensure the script waits for the HTML to be fully window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 600;

    const assets = {
        car: new Image(),
        road: new Image(),
        signal: new Image()
    };

    assets.road.src = 'https://image2url.com/r2/default/images/1772265054646-1d2ff272-b371-42fc-8e2d-c26f42e999df.png';
    assets.signal.src = 'https://image2url.com/r2/default/images/1772262414993-4289c9f0-b8f8-478f-b33e-a41eaae47ef6.png';
    assets.car.src = 'https://image2url.com/r2/default/images/1772264923342-7356f6dd-e816-4078-a5ed-206ae55f46f3.png';

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

    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);

    const questions = [
        { q: "What should you do at a red light?", a: ["Speed up", "Stop", "Honk"], correct: 1 },
        { q: "Is texting while driving safe?", a: ["Yes", "No", "Sometimes"], correct: 1 },
        { q: "Green light means?", a: ["Go if clear", "Stop", "Reverse"], correct: 0 }
    ];

    // --- AUTOMATIC START WITH COUNTDOWN ---
    let timeLeft = 3;
    const countdownInterval = setInterval(() => {
        timeLeft--;
        const countdownText = document.getElementById('countdown-text');
        if (countdownText) {
            countdownText.innerText = timeLeft > 0 ? `Starting in ${timeLeft}...` : "GO!";
        }
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            setTimeout(autoStartGame, 500);
        }
    }, 1000);

    function autoStartGame() {
        document.getElementById('start-screen').classList.add('hidden');
        gameActive = true;
        score = 0;
        mistakes = 0;
        currentSpeed = 2;
        events = [];
        updateUI();
        gameLoop();
    }

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
        // Draw Road
        ctx.drawImage(assets.road, 0, (roadOffset % canvas.height) - canvas.height, canvas.width, canvas.height);
        ctx.drawImage(assets.road, 0, (roadOffset % canvas.height), canvas.width, canvas.height);
        // Draw Events
        events.forEach(ev => {
            if (ev.type === 'SIGNAL') ctx.drawImage(assets.signal, 0, ev.y, canvas.width, 120);
            else {
                ctx.fillStyle = "white";
                ctx.fillRect(0, ev.y, canvas.width, 40);
                ctx.fillStyle = "black";
                ctx.font = "bold 16px Arial";
                ctx.fillText("SPEED LIMIT: 40km/h", 120, ev.y + 25);
            }
        });
        // Draw Car
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
        container.innerHTML = '';
        q.a.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = 'option-btn';
            btn.onclick = () => {
                if (i === q.correct) {
                    mistakes = 0; gameActive = true;
                    modal.classList.add('hidden');
                    updateUI(); gameLoop();
                } else { endGame(); }
            };
            container.appendChild(btn);
        });
        modal.classList.remove('hidden');
    }

    function updateUI() {
        document.getElementById('score').innerText = score;
        document.getElementById('mistakes').innerText = mistakes;
        document.getElementById('speed-display').innerText = Math.floor(currentSpeed * 10);
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
};
