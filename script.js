const canvas = document.getElementById("tree");
const ctx = canvas.getContext("2d");
const intro = document.getElementById("intro");
const introHeart = document.getElementById("intro-heart");
const baseline = document.querySelector(".baseline");
const lines = Array.from(document.querySelectorAll(".line"));

const state = {
  width: 0,
  height: 0,
  startTime: new Date("2024-01-01T00:00:00"),
  leaves: [],
  falling: [],
  lastTick: 0,
  started: false,
  startAt: 0,
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
  if (Math.random() < 0.28) {
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

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawBranch(x1, y1, x2, y2, progress, width) {
  const px = lerp(x1, x2, progress);
  const py = lerp(y1, y2, progress);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(px, py);
  ctx.stroke();
}

function drawTree(baseX, baseY, trunkProgress, branchProgress) {
  ctx.save();
  ctx.strokeStyle = "#8b5a2b";
  ctx.lineCap = "round";

  const trunkHeight = state.height * 0.46;
  const topY = baseY - trunkHeight * trunkProgress;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(baseX, topY);
  ctx.stroke();

  drawBranch(baseX, baseY - trunkHeight * 0.25, baseX + 34, baseY - trunkHeight * 0.45, branchProgress, 9);
  drawBranch(baseX, baseY - trunkHeight * 0.42, baseX - 30, baseY - trunkHeight * 0.58, branchProgress, 8);
  drawBranch(baseX, baseY - trunkHeight * 0.6, baseX + 24, baseY - trunkHeight * 0.78, branchProgress, 7);
  drawBranch(baseX, baseY - trunkHeight * 0.7, baseX - 22, baseY - trunkHeight * 0.88, branchProgress, 6);

  ctx.restore();
}

function render(timestamp) {
  if (!state.lastTick) state.lastTick = timestamp;
  state.lastTick = timestamp;

  ctx.clearRect(0, 0, state.width, state.height);

  const baseX = state.width * 0.55;
  const baseY = state.height * 0.86;

  if (state.started) {
    const t = (timestamp - state.startAt) / 1000;
    const dotDuration = 0.6;
    const baselineDelay = 0.45;
    const trunkDelay = 0.8;
    const branchDelay = 1.2;
    const leavesDelay = 1.7;

    const dotT = Math.min(1, Math.max(0, t / dotDuration));
    const trunkT = Math.min(1, Math.max(0, (t - trunkDelay) / 1.1));
    const branchT = Math.min(1, Math.max(0, (t - branchDelay) / 1.0));
    const leavesT = Math.min(1, Math.max(0, (t - leavesDelay) / 1.6));

    const dotY = lerp(state.height * 0.35, baseY, easeOutCubic(dotT));
    const dotX = baseX - state.width * 0.12;
    ctx.fillStyle = "#d03c3c";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    if (t > baselineDelay) {
      baseline.classList.add("show");
    }

    drawTree(baseX, baseY, easeOutCubic(trunkT), easeOutCubic(branchT));
    drawLeaves(baseX, baseY - state.height * 0.36, easeOutCubic(leavesT));

    if (leavesT > 0.4) {
      spawnFalling();
      drawFalling();
    }

    if (t > 2.0) lines[0]?.classList.add("show");
    if (t > 2.4) lines[1]?.classList.add("show");
    if (t > 2.8) lines[2]?.classList.add("show");
    if (t > 3.2) lines[3]?.classList.add("show");
  }

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

function startSequence() {
  if (state.started) return;
  state.started = true;
  state.startAt = performance.now();
  intro.classList.add("hidden");
}

intro.addEventListener("click", startSequence);
introHeart.addEventListener("click", startSequence);

setTimeout(() => {
  if (!state.started) startSequence();
}, 2500);

init();
