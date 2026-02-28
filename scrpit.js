
       window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Responsive Canvas Size
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

    let score = 0, mistakes = 0, gameActive = false, roadOffset = 0, currentSpeed = 0;
    const MAX_SPEED = 7, BRAKE_FORCE = 0.4, ACCEL_FORCE = 0.2;
    let frameCount = 0, events = [];
    const player = { x: 175, y: 450, w: 50, h: 90 };
    let keys = {};

    // --- ACCESSIBILITY: INPUT HANDLERS ---
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);

    const setupBtn = (id, code) => {
        const btn = document.getElementById(id);
        btn.ontouchstart = (e) => { e.preventDefault(); keys[code] = true; };
        btn.ontouchend = (e) => { e.preventDefault(); keys[code] = false; };
        btn.onmousedown = () => keys[code] = true;
        btn.onmouseup = () => keys[code] = false;
    };
    setupBtn('btn-left', 'ArrowLeft');
    setupBtn('btn-right', 'ArrowRight');
    setupBtn('btn-gas', 'ArrowUp');
    setupBtn('btn-brake', 'ArrowDown');

    const questions = [
        { q: "Stop at a red light?", a: ["Yes", "No"], correct: 0 },
        { q: "Use phone while driving?", a: ["Yes", "No"], correct: 1 }
    ];

    // Auto-Start Timer
    let count = 3;
    const timer = setInterval(() => {
        document.getElementById('countdown-text').innerText = `Starting in ${count}...`;
        if (count <= 0) { clearInterval(timer); start(); }
        count--;
    }, 1000);

    function start() {
        document.getElementById('start-screen').classList.add('hidden');
        gameActive = true;
        currentSpeed = 2;
        loop();
    }

    function loop() {
        if (!gameActive) return;
        update();
        draw();
        requestAnimationFrame(loop);
    }

    function update() {
        if (keys['ArrowUp']) currentSpeed = Math.min(currentSpeed + ACCEL_FORCE, MAX_SPEED);
        else if (keys['ArrowDown']) currentSpeed = Math.max(currentSpeed - BRAKE_FORCE, 0);
        else if (currentSpeed > 0.5) currentSpeed -= 0.05;

        if (keys['ArrowLeft'] && player.x > 20) player.x -= 5;
        if (keys['ArrowRight'] && player.x < canvas.width - player.w - 20) player.x += 5;

        roadOffset += currentSpeed;
        frameCount++;
        if (frameCount % 180 === 0) events.push({ type: 'SIGNAL', y: -200, active: true });

        events.forEach(ev => {
            ev.y += currentSpeed;
            if (ev.active && ev.y > player.y - 30 && ev.y < player.y + 10 && currentSpeed > 1) {
                mistakes++;
                ev.active = false;
                if (mistakes >= 3) { gameActive = false; showQuiz(); }
            }
        });
        document.getElementById('score').innerText = Math.floor(roadOffset/10);
        document.getElementById('mistakes').innerText = mistakes;
        document.getElementById('speed-display').innerText = Math.floor(currentSpeed * 10);
    }

    function draw() {
        ctx.clearRect(0,0,400,600);
        ctx.drawImage(assets.road, 0, (roadOffset % 600) - 600, 400, 600);
        ctx.drawImage(assets.road, 0, (roadOffset % 600), 400, 600);
        events.forEach(ev => ctx.drawImage(assets.signal, 0, ev.y, 400, 100));
        ctx.drawImage(assets.car, player.x, player.y, player.w, player.h);
    }

    function showQuiz() {
        const m = document.getElementById('question-modal');
        const q = questions[0];
        document.getElementById('question-text').innerText = q.q;
        const cont = document.getElementById('options-container');
        cont.innerHTML = '';
        q.a.forEach((opt, i) => {
            const b = document.createElement('button');
            b.innerText = opt; b.className = 'option-btn';
            b.onclick = () => {
                if(i === q.correct) { mistakes=0; gameActive=true; m.classList.add('hidden'); loop(); }
                else { location.reload(); }
            };
            cont.appendChild(b);
        });
        m.classList.remove('hidden');
    }
};
