// src/components/World.tsx
import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { heightAt } from '../utils/noise';

const CHUNK_SIZE = 16;
const VIEW_RADIUS = 2;
const BLOCKS_BELOW_TOP = 2;

// Nomes das texturas
const blockNames = [
  'grass',
  'dirt',
  'stone',
  'sand',
  'snow',
  'oak_log',
  'oak_leaves',
  'water',
];

// Carrega texturas
const textures: Record<string, THREE.Texture> = {};
blockNames.forEach(name => {
  const tex = new THREE.TextureLoader().load(`/textures/blocks/${name}.png`);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  textures[name] = tex;
});

interface Chunk {
  key: string;
  meshes: {
    top: THREE.InstancedMesh;
    side: THREE.InstancedMesh;
    bottom: THREE.InstancedMesh;
    treeTrunks: THREE.InstancedMesh;
    treeLeaves: THREE.InstancedMesh;
  };
  colliders: { position: [number, number, number] }[];
}

// Define bioma
function getBiomeTexture(y: number) {
  if (y < 20) return { top: textures.water, side: textures.water, bottom: textures.stone };
  if (y < 30) return { top: textures.sand, side: textures.sand, bottom: textures.stone };
  if (y < 60) return { top: textures.grass_block, side: textures.dirt, bottom: textures.stone };
  if (y < 80) return { top: textures.stone, side: textures.stone, bottom: textures.stone };
  return { top: textures.snow, side: textures.stone, bottom: textures.stone };
}

// Gera árvore
function addTree(wx: number, wz: number, h: number, dummy: THREE.Object3D, trunkMatrices: THREE.Matrix4[], leavesMatrices: THREE.Matrix4[]) {
  const trunkHeight = 4 + Math.floor(Math.random() * 2);
  // Tronco
  for (let y = h + 1; y <= h + trunkHeight; y++) {
    dummy.position.set(wx, y, wz);
    dummy.updateMatrix();
    trunkMatrices.push(dummy.matrix.clone());
  }
  // Copa 3x3x3
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = 0; dy <= 2; dy++) {
        dummy.position.set(wx + dx, h + trunkHeight + dy, wz + dz);
        dummy.updateMatrix();
        leavesMatrices.push(dummy.matrix.clone());
      }
    }
  }
}

export default function World() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [playerChunk, setPlayerChunk] = useState<[number, number]>([0, 0]);
  const { camera } = useThree();

  useFrame(() => {
    const cx = Math.floor(camera.position.x / CHUNK_SIZE);
    const cz = Math.floor(camera.position.z / CHUNK_SIZE);
    if (cx !== playerChunk[0] || cz !== playerChunk[1]) setPlayerChunk([cx, cz]);
  });

  useEffect(() => {
    const [pcx, pcz] = playerChunk;
    const newChunks: Chunk[] = [];
    const dummy = new THREE.Object3D();

    for (let cx = pcx - VIEW_RADIUS; cx <= pcx + VIEW_RADIUS; cx++) {
      for (let cz = pcz - VIEW_RADIUS; cz <= pcz + VIEW_RADIUS; cz++) {
        const key = `${cx},${cz}`;
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        const topMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ map: textures.grass_block }), CHUNK_SIZE * CHUNK_SIZE);
        const sideMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ map: textures.dirt }), CHUNK_SIZE * CHUNK_SIZE);
        const bottomMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ map: textures.stone }), CHUNK_SIZE * CHUNK_SIZE);
        const trunkMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ map: textures.oak_log }), 50);
        const leavesMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ map: textures.oak_leaves }), 100);

        [topMesh, sideMesh, bottomMesh, trunkMesh, leavesMesh].forEach(m => m.castShadow = m.receiveShadow = true);

        let indexTop = 0, indexSide = 0, indexBottom = 0;
        let trunkMatrices: THREE.Matrix4[] = [], leavesMatrices: THREE.Matrix4[] = [];
        const colliders: { position: [number, number, number] }[] = [];

        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wz = cz * CHUNK_SIZE + z;
            const h = heightAt(wx, wz);

            for (let y = h; y >= h - BLOCKS_BELOW_TOP; y--) {
              dummy.position.set(wx, y, wz);
              dummy.updateMatrix();
              const { top, side, bottom } = getBiomeTexture(y);
              if (y === h) topMesh.setMatrixAt(indexTop++, dummy.matrix);
              else if (y === h - 1) sideMesh.setMatrixAt(indexSide++, dummy.matrix);
              else bottomMesh.setMatrixAt(indexBottom++, dummy.matrix);

              // Somente blocos sólidos recebem collider
              if (y >= h - 1 && y !== h && bottom !== textures.water) {
                colliders.push({ position: [wx, y, wz] });
              }
            }

            if (h >= 30 && h <= 60 && Math.random() < 0.05) {
              addTree(wx, wz, h, dummy, trunkMatrices, leavesMatrices);
            }
          }
        }

        trunkMatrices.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
        leavesMatrices.forEach((m, i) => leavesMesh.setMatrixAt(i, m));
        topMesh.instanceMatrix.needsUpdate = true;
        sideMesh.instanceMatrix.needsUpdate = true;
        bottomMesh.instanceMatrix.needsUpdate = true;
        trunkMesh.instanceMatrix.needsUpdate = true;
        leavesMesh.instanceMatrix.needsUpdate = true;

        newChunks.push({
          key,
          meshes: { top: topMesh, side: sideMesh, bottom: bottomMesh, treeTrunks: trunkMesh, treeLeaves: leavesMesh },
          colliders
        });
      }
    }

    setChunks(newChunks);
  }, [playerChunk]);

  return (
    <group>
      {chunks.map(chunk => (
        <group key={chunk.key}>
          <primitive object={chunk.meshes.top} />
          <primitive object={chunk.meshes.side} />
          <primitive object={chunk.meshes.bottom} />
          <primitive object={chunk.meshes.treeTrunks} />
          <primitive object={chunk.meshes.treeLeaves} />

          {/* Cria Colliders por bloco sólido */}
          {chunk.colliders.map((c, i) => (
            <RigidBody key={i} type="fixed" colliders={false} position={c.position}>
              <CuboidCollider args={[0.5, 0.5, 0.5]} />
            </RigidBody>
          ))}
        </group>
      ))}
    </group>
  );
}
