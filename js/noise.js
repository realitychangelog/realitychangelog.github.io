// Smooth value noise + fBm and light domain warp
import { rand2D } from './seededRandom.js';

function smoothstep(t){ return t*t*(3-2*t); }
function quintic(t){ return t*t*t*(t*(t*6-15)+10); }

// Single octave value noise at (x,y) with grid scale
export function valueNoise2D(seed, x, y, scale=1){
  const sx = x * scale;
  const sy = y * scale;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;
  const wX = quintic(fx);
  const wY = quintic(fy);

  const v00 = rand2D(seed, ix,   iy  );
  const v10 = rand2D(seed, ix+1, iy  );
  const v01 = rand2D(seed, ix,   iy+1);
  const v11 = rand2D(seed, ix+1, iy+1);

  const i1 = v00 + (v10 - v00) * wX;
  const i2 = v01 + (v11 - v01) * wX;
  return i1 + (i2 - i1) * wY; // [0,1]
}

export function fbm2D(seed, x, y, {
  octaves = 5, lacunarity = 2.0, gain = 0.5, scale = 0.02,
  warpAmp = 6.0, warpScale = 0.01
} = {}){
  // light domain warp for continents
  const wx = valueNoise2D(seed+'wx', x, y, warpScale) * 2 - 1;
  const wy = valueNoise2D(seed+'wy', x, y, warpScale) * 2 - 1;
  x = x + wx * warpAmp;
  y = y + wy * warpAmp;

  let amp = 1, freq = scale, sum = 0, norm = 0;
  for (let o=0;o<octaves;o++){
    sum += valueNoise2D(seed, x, y, freq) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm; // [0,1]
}
