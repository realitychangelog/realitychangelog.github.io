// Deterministic utilities for seeded generation

// 32-bit FNV-1a hash → uint32
export function hash32(str){
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0; // 16777619
  }
  return h >>> 0;
}

// Mulberry32 PRNG from a uint32 seed → [0,1)
export function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Make a quick RNG from any key string
export function rngFrom(key){
  return mulberry32(hash32(String(key)));
}

// Fast 2D hashed random in [0,1) for integer lattice
export function rand2D(seedKey, ix, iy){
  // Use a reversible mix of coords; ensure integer grid discreteness
  const key = `${seedKey}:${ix}|${iy}`;
  return rngFrom(key)();
}

// Java's String.hashCode (for people entering text seeds like in Minecraft)
export function javaStringHash(s){
  let h = 0;
  for (let i=0;i<s.length;i++) h = (h * 31 + s.charCodeAt(i))|0;
  return h|0; // signed 32-bit
}
