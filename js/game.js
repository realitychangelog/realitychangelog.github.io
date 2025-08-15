import { rngFrom, hash32, javaStringHash } from './seededRandom.js';
import { fbm2D } from './noise.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const seedInput = document.getElementById('seedInput');
const newWorldBtn = document.getElementById('newWorldBtn');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const helpBtn = document.getElementById('helpBtn');
const hud = document.getElementById('hud');
const toast = document.getElementById('toast');

// ----- Settings -----
const TILE_BASE = 24; // base pixels per tile (will auto-scale)
let TILE = TILE_BASE;
let SHOW_GRID = false;

// World thresholds
const WATER_T = 0.48;      // below → water
const SHALLOW_T = 0.50;    // shoreline
const MOUNTAIN_T = 0.82;   // above → mountain/rock

// Colors
const C = {
  deep: '#1d4ed8',
  shallow: '#3b82f6',
  sand: '#d9c690',
  grass: '#6cab64',
  forest: '#2f7d3d',
  rock: '#8e9aa6',
  snow: '#e5eef7',
  grid: '#1e293b',
  player: '#fbbf24',
  item: '#f472b6'
};

// ----- Game State -----
let state = {
  seedText: 'adventure',
  seedKey: 'adventure',
  player: { x: 0, y: 0 },
  shards: 0,
  collected: new Set(), // keys like "x,y"
};

function saveKey(){ return `advgame:${state.seedKey}`; }

function save(){
  const data = {
    seedText: state.seedText,
    seedKey: state.seedKey,
    player: state.player,
    shards: state.shards,
    collected: Array.from(state.collected),
  };
  localStorage.setItem(saveKey(), JSON.stringify(data));
  ping('Saved.');
}

function loadFromStorage(seedKey){
  const raw = localStorage.getItem(`advgame:${seedKey}`);
  if (!raw) return false;
  try{
    const data = JSON.parse(raw);
    state.seedText = data.seedText || seedKey;
    state.seedKey = data.seedKey || seedKey;
    state.player = data.player || {x:0,y:0};
    state.shards = data.shards || 0;
    state.collected = new Set(data.collected || []);
    return true;
  }catch{ return false; }
}

function clearProgress(){
  localStorage.removeItem(saveKey());
  state.shards = 0;
  state.collected.clear();
  ping('Progress reset.');
}

// Convert user input to a good seed key (compatible with Minecraft-style text seeds)
function normalizeSeed(input){
  if (!input) return 'adventure';
  // If purely numeric, keep it; otherwise mimic Java's String.hashCode mixing but keep text key for display
  if (/^[+-]?\d+$/.test(input.trim())) return String(input.trim());
  const h = javaStringHash(input);
  return `${input}:${h}`; // keep text + stable number part
}

// ----- World Sampling -----
function sampleHeight(x, y){
  return fbm2D(state.seedKey+':h', x, y, { octaves: 5, scale: 0.015, warpAmp: 10, warpScale: 0.008 });
}

function sampleMoisture(x, y){
  return fbm2D(state.seedKey+':m', x+1000, y-1000, { octaves: 4, scale: 0.03 });
}

function tileAt(tx, ty){
  const h = sampleHeight(tx, ty); // 0..1
  const m = sampleMoisture(tx, ty);
  if (h < WATER_T) return { kind: 'water', color: h < WATER_T*0.85 ? C.deep : C.shallow, passable:false };
  if (h < SHALLOW_T) return { kind: 'sand', color: C.sand, passable:true };
  if (h > MOUNTAIN_T){
    // snowy peaks at very top
    return { kind: h > 0.92 ? 'snow' : 'rock', color: h > 0.92 ? C.snow : C.rock, passable:false };
  }
  // land: grass vs forest by moisture
  return m > 0.55
    ? { kind:'forest', color:C.forest, passable:true }
    : { kind:'grass', color:C.grass, passable:true };
}

// Deterministic item placement (shards)
function hasShardAt(tx, ty){
  // very low probability on passable land tiles
  const t = tileAt(tx, ty);
  if (!t.passable) return false;
  const r = Math.abs(javaStringHash(`${state.seedKey}|item|${tx},${ty}`)) >>> 0;
  return (r % 9973) < 3; // ~0.03% density
}

// ----- Camera & Render -----
let cam = { x:0, y:0 };

function resize(){
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth = window.innerWidth;
  const cssH = canvas.clientHeight = window.innerHeight - 48;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  // adjust tile size a bit for small screens
  TILE = Math.max(14, Math.min(36, Math.floor(cssW/48)));
}
window.addEventListener('resize', resize);
resize();

function draw(){
  ctx.clearRect(0,0,canvas.clientWidth, canvas.clientHeight);

  const cols = Math.ceil(canvas.clientWidth / TILE) + 2;
  const rows = Math.ceil(canvas.clientHeight / TILE) + 2;
  const startX = Math.floor(cam.x - cols/2);
  const startY = Math.floor(cam.y - rows/2);

  // tiles
  for (let y=0;y<rows;y++){
    for (let x=0;x<cols;x++){
      const tx = startX + x;
      const ty = startY + y;
      const t = tileAt(tx, ty);
      const px = Math.floor((x - (cam.x - startX)) * TILE);
      const py = Math.floor((y - (cam.y - startY)) * TILE);
      ctx.fillStyle = t.color;
      ctx.fillRect(px, py, TILE, TILE);

      if (SHOW_GRID){
        ctx.strokeStyle = C.grid;
        ctx.strokeRect(px+0.5, py+0.5, TILE-1, TILE-1);
      }

      // draw shard if present and not collected
      if (hasShardAt(tx,ty) && !state.collected.has(`${tx},${ty}`)){
        ctx.fillStyle = C.item;
        const cx = px + TILE/2, cy = py + TILE/2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5);
        ctx.lineTo(cx + 4, cy);
        ctx.lineTo(cx, cy + 5);
        ctx.lineTo(cx - 4, cy);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // player
  const ppx = Math.floor(canvas.clientWidth/2);
  const ppy = Math.floor(canvas.clientHeight/2);
  ctx.fillStyle = C.player;
  ctx.beginPath();
  ctx.arc(ppx, ppy, Math.floor(TILE*0.35), 0, Math.PI*2);
  ctx.fill();

  // HUD
  hud.innerHTML = `Seed: <b>${state.seedText}</b><br/>`+
    `Pos: <b>${state.player.x.toFixed(1)}, ${state.player.y.toFixed(1)}</b><br/>`+
    `Shards: <b>${state.shards}</b>`;
}

// ----- Input & Movement -----
const keys = new Set();
window.addEventListener('keydown', (e)=>{
  if (e.key === 'g' || e.key === 'G'){ SHOW_GRID = !SHOW_GRID; }
  if (e.key === 'Escape'){ document.getElementById('helpDialog').close(); }
  keys.add(e.key.toLowerCase());
});
window.addEventListener('keyup', (e)=> keys.delete(e.key.toLowerCase()));

function isPassable(nx, ny){
  return tileAt(Math.floor(nx), Math.floor(ny)).passable;
}

function tryInteract(){
  const tx = Math.floor(state.player.x);
  const ty = Math.floor(state.player.y);
  const key = `${tx},${ty}`;
  if (hasShardAt(tx, ty) && !state.collected.has(key)){
    state.collected.add(key);
    state.shards += 1;
    ping('You found a shard! ✨');
  }
}

window.addEventListener('keypress', (e)=>{
  if (e.key === 'e' || e.key === 'E') tryInteract();
});

function update(dt){
  // movement
  const speed = 4.2; // tiles per second
  let vx=0, vy=0;
  if (keys.has('w') || keys.has('arrowup')) vy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) vy += 1;
  if (keys.has('a') || keys.has('arrowleft')) vx -= 1;
  if (keys.has('d') || keys.has('arrowright')) vx += 1;
  if (vx || vy){
    const inv = 1/Math.hypot(vx,vy);
    vx*=inv; vy*=inv;
    const nx = state.player.x + vx * speed * dt;
    const ny = state.player.y + vy * speed * dt;
    if (isPassable(nx, state.player.y)) state.player.x = nx;
    if (isPassable(state.player.x, ny)) state.player.y = ny;
  }
  cam.x = state.player.x;
  cam.y = state.player.y;
}

// ----- World bootstrap -----
function spiralFindPassable(cx, cy, max=200){
  let x=0,y=0,dx=0,dy=-1;
  for (let i=0;i<max*max;i++){
    const tx = cx+x, ty = cy+y;
    if (tileAt(tx,ty).passable) return {x:tx+0.5, y:ty+0.5};
    if (x===y || (x<0&&x===-y) || (x>0&&x===1-y)) { const t=dx; dx=-dy; dy=t; }
    x+=dx; y+=dy;
  }
  return {x:cx+0.5,y:cy+0.5};
}

function ping(msg){
  toast.textContent = msg; toast.hidden = false;
  clearTimeout(ping._t); ping._t = setTimeout(()=> toast.hidden = true, 1400);
}

function newWorld(fromInput=false){
  const text = fromInput ? seedInput.value.trim() : state.seedText;
  const key = normalizeSeed(text);
  state.seedText = text || 'adventure';
  state.seedKey = key;
  state.shards = 0;
  state.collected.clear();
  // spawn
  const spawn = spiralFindPassable(0,0,300);
  state.player = { x: spawn.x, y: spawn.y };
  cam.x = state.player.x; cam.y = state.player.y;
}

// UI hooks
seedInput.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') newWorld(true);
});
newWorldBtn.addEventListener('click', ()=> newWorld(true));
saveBtn.addEventListener('click', save);
resetBtn.addEventListener('click', clearProgress);
helpBtn.addEventListener('click', ()=> document.getElementById('helpDialog').showModal());

// Load last session if any
(function init(){
  const last = localStorage.getItem('advgame:lastSeed');
  if (last && loadFromStorage(last)){
    seedInput.value = state.seedText;
    ping('Loaded last save.');
  } else {
    state.seedText = 'adventure';
    state.seedKey = normalizeSeed(state.seedText);
    const spawn = spiralFindPassable(0,0,300);
    state.player = { x: spawn.x, y: spawn.y };
    seedInput.value = state.seedText;
  }
})();

// remember which save to auto-load next time
window.addEventListener('beforeunload', ()=>{
  localStorage.setItem('advgame:lastSeed', state.seedKey);
  // auto-save lightweight state
  save();
});

// ----- Game Loop -----
let last = performance.now();
function frame(now){
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
