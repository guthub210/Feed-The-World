let currentScreen = "home-screen";
let score = 0;
let basket;
let gameInterval;
let items = [];
let gameRunning = false;

// Screen navigation
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  currentScreen = id;

  if (id !== "game-screen") stopGame();
}

function startGame() {
  score = 0;
  updateScore();
  showScreen("game-screen");
  basket = document.getElementById("basket");
  gameRunning = true;
  items = [];
  gameInterval = setInterval(gameLoop, 50);
}

function stopGame() {
  gameRunning = false;
  clearInterval(gameInterval);
}

function pauseGame() {
  stopGame();
  showScreen("pause-screen");
}

function resumeGame() {
  showScreen("game-screen");
  gameRunning = true;
  gameInterval = setInterval(gameLoop, 50);
}

// Basket movement
document.addEventListener("mousemove", e => {
  if (!gameRunning) return;
  const rect = document.getElementById("game-screen").getBoundingClientRect();
  let x = e.clientX - rect.left - basket.offsetWidth / 2;
  basket.style.left = Math.max(0, Math.min(x, rect.width - basket.offsetWidth)) + "px";
});

document.addEventListener("keydown", e => {
  if (!gameRunning) return;
  const left = parseInt(basket.style.left || "0");
  if (e.key === "ArrowLeft") basket.style.left = Math.max(0, left - 20) + "px";
  if (e.key === "ArrowRight") basket.style.left = Math.min(window.innerWidth - 100, left + 20) + "px";
});

// Game loop
function gameLoop() {
  const gameArea = document.getElementById("game-screen");
  if (Math.random() < 0.05) spawnItem(gameArea);

  items.forEach((item, i) => {
    item.y += 5;
    item.el.style.top = item.y + "px";

    const basketRect = basket.getBoundingClientRect();
    const itemRect = item.el.getBoundingClientRect();

    if (itemRect.bottom >= basketRect.top && itemRect.left < basketRect.right && itemRect.right > basketRect.left) {
      if (item.type === "fruit") score += 10;
      else score -= 5;
      updateScore();
      item.el.remove();
      items.splice(i, 1);
    } else if (item.y > window.innerHeight) {
      item.el.remove();
      items.splice(i, 1);
    }
  });
}

function spawnItem(container) {
  const item = document.createElement("div");
  const type = Math.random() < 0.7 ? "fruit" : "junk";
  item.classList.add("item", type);
  item.style.left = Math.random() * (window.innerWidth - 30) + "px";
  item.style.top = "0px";
  container.appendChild(item);
  items.push({ el: item, y: 0, type });
}

function updateScore() {
  document.getElementById("score").innerText = score;
  if (score >= 100) document.getElementById("a2").style.color = "green";
  if (score >= 500) document.getElementById("a3").style.color = "green";
  if (score >= 1000) document.getElementById("a4").style.color = "green";
}
