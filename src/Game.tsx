
'use client';

import { Canvas } from '@react-three/fiber';
import { KeyboardControls, Sky, StatsGl } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import World from './components/World';
import Player from './components/Player';
import UI from './components/UI';

export default function Game() {
  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
        { name: 'back', keys: ['ArrowDown', 'KeyS'] },
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'jump', keys: ['Space'] },
        { name: 'run', keys: ['ShiftLeft'] },
      ]}
    >
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas shadows camera={{ fov: 75 }}>
          <Sky sunPosition={[100, 50, 100]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 15]} castShadow intensity={1.2} />
          <Physics gravity={[0, -30, 0]}>
            <World />
            <Player />
          </Physics>
          <StatsGl />
        </Canvas>
        <UI />
      </div>
    </KeyboardControls>
  );
}
