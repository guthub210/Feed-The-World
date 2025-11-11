// Fruit Catcher - full game script with "missing fruit costs a life"

// --- DOM references ---
const screens = {
  home: document.getElementById('home-screen'),
  game: document.getElementById('game-screen'),
  pause: document.getElementById('pause-screen'),
  restart: document.getElementById('restart-screen'),
  settings: document.getElementById('settings-screen'),
  howto: document.getElementById('howto-screen'),
  achievements: document.getElementById('achievements-screen')
};

const playBtn = document.getElementById('play-btn');
const settingsBtn = document.getElementById('settings-btn');
const howtoBtn = document.getElementById('howto-btn');
const achievementsBtn = document.getElementById('achievements-btn');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hudLives = document.getElementById('lives');
const hudScore = document.getElementById('score');
const hudHigh = document.getElementById('high-score');
const finalScore = document.getElementById('final-score');

const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const homeBtnPause = document.getElementById('home-btn-pause');

const restartBtn = document.getElementById('restart-btn');
const homeBtnRestart = document.getElementById('home-btn-restart');

const settingsBack = document.getElementById('back-from-settings');
const howBack = document.getElementById('back-from-howto');
const achBack = document.getElementById('back-from-achievements');

const diffBtns = document.querySelectorAll('.diff-btn');

// --- Game state ---
let gameRunning = false;
let animationId = null;
let spawnTimer = 0;

let score = 0;
let highScore = Number(localStorage.getItem('highScore') || 0);
let lives = 3;

let difficulty = 'medium'; // easy / medium / hard
let spawnRate = 80;        // frames between spawns
let fallSpeed = 2.5;
let basket = { x: 200, y: canvas.height - 60, width: 80, height: 30, velocity: 0, maxSpeed: 6 };

let objects = []; // falling items: {x,y,r,type,isFruit,speed}

let leftPressed = false;
let rightPressed = false;

// --- Utility: show screen ---
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');

  // When leaving game screen, stop the loop
  if (name !== 'game') stopGameLoop();
  if (name === 'game' && !gameRunning) {
    // If user just navigated back to game screen, resume the loop only if gameRunning true
    if (gameRunning) startGameLoop();
  }
}

// --- Input handlers (smooth movement) ---
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = true;
  if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = false;
  if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = false;
});

// --- Start / Reset game ---
function startGame() {
  score = 0;
  lives = 3;
  objects = [];
  basket.width = getBasketWidthForDifficulty();
  basket.x = (canvas.width - basket.width) / 2;
  hudScore.textContent = 'Score: ' + score;
  hudLives.textContent = '❤️'.repeat(lives);
  hudHigh.textContent = 'High: ' + highScore;
  spawnTimer = 0;
  gameRunning = true;
  showScreen('game');
  startGameLoop();
}

function getBasketWidthForDifficulty() {
  if (difficulty === 'easy') return 90;
  if (difficulty === 'hard') return 70;
  return 80; // medium
}

// --- Difficulty buttons ---
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    difficulty = btn.dataset.level;
    if (difficulty === 'easy') { fallSpeed = 2; spawnRate = 100; basket.maxSpeed = 6; }
    else if (difficulty === 'medium') { fallSpeed = 2.5; spawnRate = 80; basket.maxSpeed = 6; }
    else { fallSpeed = 3.5; spawnRate = 60; basket.maxSpeed = 7; }
    showScreen('home');
  });
});

// --- Spawn logic (fruits & junk) ---
function spawnObject() {
  // 70% fruit, 30% junk
  const isFruit = Math.random() < 0.7;
  const x = Math.random() * (canvas.width - 30) + 15;
  const speed = fallSpeed + Math.random() * 1.2;
  objects.push({ x, y: -20, r: 14, type: isFruit ? 'fruit' : 'junk', isFruit, speed });
}

// --- Physics & rendering loop ---
function startGameLoop() {
  if (animationId) return; // already running
  function loop() {
    if (!gameRunning) { animationId = null; return; }

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // spawn
    spawnTimer++;
    if (spawnTimer >= spawnRate) {
      spawnTimer = 0;
      spawnObject();
    }

    // update objects
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      obj.y += obj.speed;

      // draw
      ctx.beginPath();
      ctx.fillStyle = (obj.type === 'fruit') ? '#d9534f' : '#4a4a4a';
      ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
      ctx.fill();

      // collision with basket
      if (obj.y + obj.r >= basket.y &&
          obj.x > basket.x &&
          obj.x < basket.x + basket.width) {
        if (obj.type === 'fruit') {
          score += 10;
          // optionally update achievements here
        } else {
          lives--;
          hudLives.textContent = '❤️'.repeat(Math.max(0, lives));
        }
        objects.splice(i, 1);
        updateHUD();
        continue;
      }

      // off-screen -> missed
      if (obj.y - obj.r > canvas.height) {
        // NEW: missing a fruit now costs a life
        if (obj.isFruit) {
          lives--;
          hudLives.textContent = '❤️'.repeat(Math.max(0, lives));
          updateHUD();
          if (lives <= 0) { gameRunning = false; endGame(); animationId = null; return; }
        }
        objects.splice(i, 1);
      }
    }

    // move basket smoothly: acceleration + friction
    const accel = 0.9;
    const friction = 0.85;
    if (rightPressed) basket.velocity += accel;
    else if (leftPressed) basket.velocity -= accel;
    else basket.velocity *= friction;

    // clamp
    const max = basket.maxSpeed || 6;
    if (basket.velocity > max) basket.velocity = max;
    if (basket.velocity < -max) basket.velocity = -max;
    basket.x += basket.velocity;

    // bounds
    if (basket.x < 0) { basket.x = 0; basket.velocity = 0; }
    if (basket.x + basket.width > canvas.width) { basket.x = canvas.width - basket.width; basket.velocity = 0; }

    // draw basket
    ctx.fillStyle = '#654321';
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

    // HUD update
    hudScore.textContent = 'Score: ' + score;
    if (score > highScore) { highScore = score; hudHigh.textContent = 'High: ' + highScore; }

    // continue loop
    animationId = requestAnimationFrame(loop);
  }

  animationId = requestAnimationFrame(loop);
}

function stopGameLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// --- HUD update ---
function updateHUD() {
  hudScore.textContent = 'Score: ' + score;
  hudLives.textContent = '❤️'.repeat(Math.max(0, lives));
  hudHigh.textContent = 'High: ' + highScore;
}

// --- End game ---
function endGame() {
  // save high score
  localStorage.setItem('highScore', highScore);
  finalScore.textContent = score;
  showScreen('restart');
}

// --- Button wiring ---
playBtn.addEventListener('click', startGame);
settingsBtn.addEventListener('click', () => showScreen('settings'));
howtoBtn.addEventListener('click', () => showScreen('howto'));
achievementsBtn.addEventListener('click', () => showScreen('achievements'));

pauseBtn.addEventListener('click', () => {
  gameRunning = false;
  stopGameLoop();
  showScreen('pause');
});
resumeBtn.addEventListener('click', () => {
  gameRunning = true;
  showScreen('game');
  startGameLoop();
});
homeBtnPause.addEventListener('click', () => showScreen('home'));

restartBtn.addEventListener('click', startGame);
homeBtnRestart.addEventListener('click', () => showScreen('home'));

settingsBack.addEventListener('click', () => showScreen('home'));
howBack.addEventListener('click', () => showScreen('home'));
achBack.addEventListener('click', () => showScreen('home'));

// --- Initialize defaults ---
function init() {
  highScore = Number(localStorage.getItem('highScore') || 0);
  difficulty = 'medium';
  fallSpeed = 2.5;
  spawnRate = 80;
  basket.maxSpeed = 6;
  basket.width = getBasketWidthForDifficulty();
  basket.x = (canvas.width - basket.width) / 2;
  showScreen('home');
  updateHUD();
}

init();
