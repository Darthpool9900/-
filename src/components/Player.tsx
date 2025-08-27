// src/components/Player.tsx
import { useEffect, useRef } from 'react';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import { useThree, useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

const SPEED = 8;
const RUN_MUL = 1.8;
const JUMP = 10;

export default function Player() {
  const body = useRef<RapierRigidBody>(null!);
  const { camera } = useThree();
  const [, get] = useKeyboardControls();
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const pointerLocked = useRef(false);

  // Pointer lock
  useEffect(() => {
    const handleClick = () => {
      if (!pointerLocked.current) document.body.requestPointerLock();
    };
    const handleLockChange = () => {
      pointerLocked.current = document.pointerLockElement === document.body;
    };
    window.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => {
      window.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handleLockChange);
    };
  }, []);

  // Mouse look
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!pointerLocked.current) return;
      const eulerObj = euler.current;
      eulerObj.setFromQuaternion(camera.quaternion);
      eulerObj.y -= e.movementX * 0.002;
      eulerObj.x -= e.movementY * 0.002;
      eulerObj.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, eulerObj.x));
      camera.quaternion.setFromEuler(eulerObj);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera]);

  // Player movement
  useFrame(() => {
    const rb = body.current;
    if (!rb) return;

    const t = rb.translation();
    camera.position.set(t.x, t.y + 0.9, t.z); // câmera na cabeça

    const { forward, back, left, right, jump, run } = get();

    const dir = new THREE.Vector3();
    const front = new THREE.Vector3();
    const side = new THREE.Vector3();

    camera.getWorldDirection(front);
    front.y = 0;
    front.normalize();

    side.crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();

    if (forward) dir.add(front);
    if (back) dir.sub(front);
    if (left) dir.sub(side);
    if (right) dir.add(side);

    if (dir.lengthSq() > 0) dir.normalize();

    const vel = rb.linvel();
    const speed = SPEED * (run ? RUN_MUL : 1);

    // Movimento horizontal
    rb.setLinvel({ x: dir.x * speed, y: vel.y, z: dir.z * speed }, true);

    // Grounded check simplificado
    const grounded = t.y <= 1.0; // ajuste conforme a altura do chão
    if (jump && grounded) {
      rb.applyImpulse({ x: 0, y: JUMP, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={body}
      type="dynamic"
      mass={1}
      colliders={false} // usamos CapsuleCollider manual
      position={[0, 20, 0]}
    >
      <CapsuleCollider args={[0.35, 1.4]} />
      <mesh visible={false}>
        <capsuleGeometry args={[0.35, 1.4, 8, 16]} />
        <meshNormalMaterial />
      </mesh>
    </RigidBody>
  );
}
