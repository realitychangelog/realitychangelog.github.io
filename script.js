const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');
const seedInput = document.getElementById('seed');
const colorInput = document.getElementById('color');
const paintBtn = document.getElementById('paintBtn');
const eraseBtn = document.getElementById('eraseBtn');
const saveBtn = document.getElementById('saveBtn');

let tool = 'paint';
let overrides = {};
let seed = seedInput.value;
let scale = 20; // pixels per chunk

// Resize canvas to full screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 50;
  draw();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Seeded random
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h >>> 0;
}

// Generate land/water based on seed
function isLand(s, cx, cy) {
  const rng = mulberry32(hashString(`${s}:${Math.floor(cx/5)},${Math.floor(cy/5)}`));
  return rng() > 0.4; // 60% land, 40% water
}

function pickBiomeColor(s, cx, cy) {
  if (!isLand(s, cx, cy)) {
    return "#3a80e0"; // water
  }
  // land biomes
  const rng = mulberry32(hashString(`${s}:${cx},${cy}`));
  const landColors = ["#91bd59", "#e3d27b", "#4b6b4b", "#b56a3b"];
  return landColors[Math.floor(rng() * landColors.length)];
}

// Drawing
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cols = Math.ceil(canvas.width / scale);
  const rows = Math.ceil(canvas.height / scale);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = `${x},${y}`;
      ctx.fillStyle = overrides[key] || pickBiomeColor(seed, x, y);
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

// Painting events
canvas.addEventListener('click', e => {
  const cx = Math.floor(e.offsetX / scale);
  const cy = Math.floor(e.offsetY / scale);
  const key = `${cx},${cy}`;
  if (tool === 'paint') overrides[key] = colorInput.value;
  if (tool === 'erase') delete overrides[key];
  draw();
});

paintBtn.onclick = () => tool = 'paint';
eraseBtn.onclick = () => tool = 'erase';

// Update seed on Enter
seedInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    seed = seedInput.value.trim();
    overrides = {}; // clear edits
    draw();
  }
});

// Save PNG
saveBtn.onclick = () => {
  const url = canvas.toDataURL();
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chunk-paint.png';
  a.click();
};

draw();
