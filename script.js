const canvas = document.getElementById("tree");
const ctx = canvas.getContext("2d");

const state = {
  width: 0,
  height: 0,
  startTime: new Date("2024-01-01T00:00:00"),
  trunkGrow: 0,
  leavesGrow: 0,
  leaves: [],
  falling: [],
  lastTick: 0,
};

function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * window.devicePixelRatio);
  canvas.height = Math.floor(rect.height * window.devicePixelRatio);
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  state.width = rect.width;
  state.height = rect.height;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y: -y };
}

function initLeaves() {
  state.leaves = [];
  const count = 320;
  for (let i = 0; i < count; i += 1) {
    const t = rand(0, Math.PI * 2);
    const p = heartPoint(t);
    const scale = rand(0.9, 1.25);
    const radius = rand(6, 16);
    const palette = [350, 355, 358, 5, 10, 340];
    const hue = palette[Math.floor(rand(0, palette.length))];
    state.leaves.push({
      x: p.x * 6.5 * scale,
      y: p.y * 6.5 * scale,
      size: radius,
      hue,
      alpha: rand(0.75, 1),
    });
  }
}

function spawnFalling() {
  if (state.falling.length > 60) return;
  if (Math.random() < 0.35) {
    const leaf = state.leaves[Math.floor(rand(0, state.leaves.length))];
    state.falling.push({
      x: leaf.x + state.width * 0.55,
      y: leaf.y + state.height * 0.32,
      size: rand(6, 12),
      vx: rand(-0.25, 0.25),
      vy: rand(0.5, 1.3),
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.02, 0.02),
      alpha: rand(0.6, 0.95),
    });
  }
}

function drawHeart(x, y, size, color, alpha, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size, size);
  ctx.beginPath();
  ctx.moveTo(0, -2.5);
  ctx.bezierCurveTo(2.4, -5.2, 6, -2.2, 0, 4.4);
  ctx.bezierCurveTo(-6, -2.2, -2.4, -5.2, 0, -2.5);
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawTrunk(baseX, baseY, height, progress) {
  const trunkHeight = height * progress;
  ctx.save();
  ctx.strokeStyle = "#8b5a2b";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(baseX, baseY - trunkHeight);
  ctx.stroke();

  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY - trunkHeight * 0.35);
  ctx.lineTo(baseX + 32, baseY - trunkHeight * 0.5);
  ctx.moveTo(baseX, baseY - trunkHeight * 0.6);
  ctx.lineTo(baseX - 28, baseY - trunkHeight * 0.72);
  ctx.stroke();
  ctx.restore();
}

function drawLeaves(centerX, centerY, progress) {
  const visible = Math.floor(state.leaves.length * progress);
  for (let i = 0; i < visible; i += 1) {
    const leaf = state.leaves[i];
    const color = `hsla(${leaf.hue}, 80%, 60%, ${leaf.alpha})`;
    drawHeart(centerX + leaf.x, centerY + leaf.y, leaf.size * 0.08, color, leaf.alpha);
  }
}

function drawFalling() {
  state.falling.forEach((leaf) => {
    leaf.x += leaf.vx;
    leaf.y += leaf.vy;
    leaf.rot += leaf.spin;
    leaf.alpha -= 0.003;
    drawHeart(leaf.x, leaf.y, leaf.size * 0.08, "#e84d6a", Math.max(leaf.alpha, 0), leaf.rot);
  });
  state.falling = state.falling.filter((leaf) => leaf.y < state.height + 30 && leaf.alpha > 0);
}

function render(timestamp) {
  if (!state.lastTick) state.lastTick = timestamp;
  const delta = (timestamp - state.lastTick) / 1000;
  state.lastTick = timestamp;

  state.trunkGrow = Math.min(1, state.trunkGrow + delta * 0.15);
  state.leavesGrow = Math.min(1, state.leavesGrow + delta * 0.12);

  ctx.clearRect(0, 0, state.width, state.height);

  const baseX = state.width * 0.55;
  const baseY = state.height * 0.86;

  drawTrunk(baseX, baseY, state.height * 0.45, state.trunkGrow);
  drawLeaves(baseX, baseY - state.height * 0.36, state.leavesGrow);
  spawnFalling();
  drawFalling();

  requestAnimationFrame(render);
}

function updateCounter() {
  const now = new Date();
  const diff = Math.max(0, now - state.startTime);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const counter = document.getElementById("counter");
  counter.textContent = `${days} días ${String(hours).padStart(2, "0")} horas ${String(minutes).padStart(2, "0")} minutos ${String(seconds).padStart(2, "0")} segundos`;
}

function init() {
  resize();
  initLeaves();
  updateCounter();
  setInterval(updateCounter, 1000);
  requestAnimationFrame(render);
}

window.addEventListener("resize", () => {
  resize();
  initLeaves();
});

init();
