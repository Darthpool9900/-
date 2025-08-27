
import { useEffect, useRef } from 'react';
import { RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier';
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
  const { rapier, world } = useRapier();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const pointerLocked = useRef(false);

  useEffect(() => {
    const handleClick = () => {
      if (!pointerLocked.current) {
        document.body.requestPointerLock();
      }
    };
    const onLockChange = () => {
      pointerLocked.current = document.pointerLockElement === document.body;
    };
    window.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      window.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!pointerLocked.current) return;
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= movementX * 0.002;
      euler.x -= movementY * 0.002;
      euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
      camera.quaternion.setFromEuler(euler);
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [camera]);

  useFrame((state, delta) => {
    const rb = body.current;
    if (!rb) return;

    // attach camera to head
    const t = rb.translation();
    camera.position.set(t.x, t.y + 0.7, t.z);

    const { forward, back, left, right, jump, run } = get();
    const dir = new THREE.Vector3();
    const front = new THREE.Vector3();
    const side = new THREE.Vector3();

    camera.getWorldDirection(front);
    front.y = 0; front.normalize();

    side.crossVectors(front, new THREE.Vector3(0,1,0)).normalize();

    if (forward) dir.add(front);
    if (back) dir.sub(front);
    if (left) dir.sub(side);
    if (right) dir.add(side);
    if (dir.lengthSq() > 0) dir.normalize();

    const speed = SPEED * (run ? RUN_MUL : 1);
    const vel = rb.linvel();
    // apply desired horizontal velocity, keep vertical
    const desired = { x: dir.x * speed, y: vel.y, z: dir.z * speed };
    rb.setLinvel(desired, true);

    // simple grounded check via ray
    const ray = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 0.8, true);
    const grounded = !!hit && hit.toi < 0.8;

    if (jump && grounded) {
      rb.applyImpulse({ x: 0, y: JUMP, z: 0 }, true);
    }
  });

  return (
    <RigidBody ref={body} colliders="capsule" mass={1} position={[0, 20, 0]}>
      <mesh visible={false}>
        <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
        <meshNormalMaterial />
      </mesh>
    </RigidBody>
  );
}
