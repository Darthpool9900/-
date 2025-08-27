// src/utils/noise.ts
import Perlin from 'perlin-noise-3d';

const perlin = new Perlin();
perlin.noiseSeed(Math.floor(Math.random() * 65536)); // seed aleatória

function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function octaveNoise(
  x: number,
  z: number,
  octaves: number,
  baseFreq: number,
  baseAmp: number
): number {
  let total = 0;
  let freq = baseFreq;
  let amp = baseAmp;
  let maxAmp = 0;

  for (let i = 0; i < octaves; i++) {
    total += perlin.get(x * freq, z * freq) * amp;
    maxAmp += amp;
    freq *= 2;
    amp /= 2;
  }

  return total / maxAmp;
}

/**
 * Função de altura realista estilo Minecraft
 */
export function heightAt(x: number, z: number): number {
  const plains = octaveNoise(x, z, 4, 0.002, 10);

  const slopeFactor = 0.02;
  const slope = (x + z) * slopeFactor;

  const hills = octaveNoise(x + 100, z + 100, 5, 0.02, 6);
  const mountains = octaveNoise(x - 1000, z - 1000, 4, 0.005, 35);
  const detail = octaveNoise(x + 50, z - 50, 6, 0.05, 2);

  let h = plains + slope + hills + mountains + detail;

  if (h < 2) h = lerp(h, 2, 0.5);
  if (h > 80) h = lerp(h, 80, 0.5);

  h += 12;

  return Math.floor(h);
}

/**
 * Funções auxiliares para chunks
 */
export function generateChunkHeightMap(cx: number, cz: number, size = 16): number[][] {
  const map: number[][] = [];
  for (let x = 0; x < size; x++) {
    map[x] = [];
    for (let z = 0; z < size; z++) {
      const wx = cx * size + x;
      const wz = cz * size + z;
      map[x][z] = heightAt(wx, wz);
    }
  }
  return map;
}

export function smoothHeightMap(map: number[][]): number[][] {
  const size = map.length;
  const smoothed: number[][] = [];
  for (let x = 0; x < size; x++) {
    smoothed[x] = [];
    for (let z = 0; z < size; z++) {
      const neighbors: number[] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nx = x + dx;
          const nz = z + dz;
          if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
            neighbors.push(map[nx][nz]);
          }
        }
      }
      const sum = neighbors.reduce((a, b) => a + b, 0);
      smoothed[x][z] = sum / neighbors.length;
    }
  }
  return smoothed;
}

export function generateSmoothChunk(cx: number, cz: number, size = 16): number[][] {
  const raw = generateChunkHeightMap(cx, cz, size);
  const smooth = smoothHeightMap(raw);
  return smooth.map(row => row.map(h => Math.floor(h)));
}
