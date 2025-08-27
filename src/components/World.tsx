// src/components/World.tsx
import * as THREE from 'three';
import { useEffect, useState, useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { heightAt } from '../utils/noise';

const CHUNK_SIZE = 16;
const VIEW_RADIUS = 2;
const BLOCKS_BELOW_TOP = 2; // número de camadas abaixo da grama

// Carrega texturas em /public/
const textures = {
  top: new THREE.TextureLoader().load('/grass.png'),
  side: new THREE.TextureLoader().load('/dirt.png'),
  bottom: new THREE.TextureLoader().load('/stone.png'),
};
Object.values(textures).forEach(tex => {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
});

interface Chunk {
  key: string;
  topMesh: THREE.InstancedMesh;
  sideMesh: THREE.InstancedMesh;
  bottomMesh: THREE.InstancedMesh;
}

export default function World() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [playerChunk, setPlayerChunk] = useState<[number, number]>([0, 0]);

  useFrame(({ camera }) => {
    const cx = Math.floor(camera.position.x / CHUNK_SIZE);
    const cz = Math.floor(camera.position.z / CHUNK_SIZE);
    if (cx !== playerChunk[0] || cz !== playerChunk[1]) setPlayerChunk([cx, cz]);
  });

  useEffect(() => {
    const [pcx, pcz] = playerChunk;
    const newChunks: Chunk[] = [];

    for (let cx = pcx - VIEW_RADIUS; cx <= pcx + VIEW_RADIUS; cx++) {
      for (let cz = pcz - VIEW_RADIUS; cz <= pcz + VIEW_RADIUS; cz++) {
        const key = `${cx},${cz}`;

        // Conta blocos
        let blockCount = 0;
        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wz = cz * CHUNK_SIZE + z;
            const h = heightAt(wx, wz);
            blockCount += BLOCKS_BELOW_TOP + 1;
          }
        }

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const topMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ map: textures.top }), blockCount);
        const sideMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ map: textures.side }), blockCount);
        const bottomMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ map: textures.bottom }), blockCount);

        topMesh.castShadow = topMesh.receiveShadow = true;
        sideMesh.castShadow = sideMesh.receiveShadow = true;
        bottomMesh.castShadow = bottomMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();
        let indexTop = 0;
        let indexSide = 0;
        let indexBottom = 0;

        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wz = cz * CHUNK_SIZE + z;
            const h = heightAt(wx, wz);

            for (let y = h; y >= h - BLOCKS_BELOW_TOP; y--) {
              dummy.position.set(wx, y, wz);
              dummy.updateMatrix();

              if (y === h) {
                topMesh.setMatrixAt(indexTop++, dummy.matrix);
              } else if (y === h - 1) {
                sideMesh.setMatrixAt(indexSide++, dummy.matrix);
              } else {
                bottomMesh.setMatrixAt(indexBottom++, dummy.matrix);
              }
            }
          }
        }

        topMesh.instanceMatrix.needsUpdate = true;
        sideMesh.instanceMatrix.needsUpdate = true;
        bottomMesh.instanceMatrix.needsUpdate = true;

        newChunks.push({ key, topMesh, sideMesh, bottomMesh });
      }
    }

    setChunks(newChunks);
  }, [playerChunk]);

  return (
    <group>
      {chunks.map(({ key, topMesh, sideMesh, bottomMesh }) => (
        <RigidBody key={key} type="fixed" colliders="trimesh">
          <primitive object={topMesh} />
          <primitive object={sideMesh} />
          <primitive object={bottomMesh} />
        </RigidBody>
      ))}
    </group>
  );
}
