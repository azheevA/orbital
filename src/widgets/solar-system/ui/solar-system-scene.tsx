"use client";

import { Suspense, useMemo, useRef } from 'react';
import type { ComponentRef, RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Line, OrbitControls, Stars, Text } from '@react-three/drei';
import { BackSide, DoubleSide, Group, Mesh, Vector3 } from 'three';
import { CELESTIAL_BODIES, CELESTIAL_BODY_BY_ID, EARTH_CLOUDS_TEXTURE, SATURN_RING_TEXTURE, SUN_TEXTURE } from '@/entities/celestial-body';
import type { CelestialBody } from '@/entities/celestial-body';
import { getOrbitPath, getScenePosition } from '@/entities/celestial-body';
import { useSelectedBodyStore } from '@/features/select-celestial-body';
import { useSimulationStore } from '@/features/control-time';
import { useCameraFocusStore } from '@/features/focus-camera';
import { useOptionalTexture } from './texture-loader';

const DEFAULT_CAMERA_POSITION = new Vector3(0, 21, 52);
type OrbitControlsHandle = ComponentRef<typeof OrbitControls>;

function EarthCloudLayer({ radius }: { radius: number }) {
  const texture = useOptionalTexture(EARTH_CLOUDS_TEXTURE);
  if (!texture) return null;
  return (
    <mesh scale={1.012}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshBasicMaterial map={texture} alphaMap={texture} transparent opacity={0.48} depthWrite={false} />
    </mesh>
  );
}

function SaturnRingLayer({ radius }: { radius: number }) {
  const texture = useOptionalTexture(SATURN_RING_TEXTURE);
  return (
    <mesh rotation={[Math.PI / 2.25, 0, -0.12]}>
      <ringGeometry args={[radius * 1.35, radius * 2.35, 160]} />
      <meshBasicMaterial map={texture ?? undefined} color={texture ? '#ffffff' : '#c4a577'} side={DoubleSide} transparent opacity={0.88} depthWrite={false} />
    </mesh>
  );
}

function TexturedPlanet({ body, selected }: { body: CelestialBody; selected: boolean }) {
  const group = useRef<Group>(null);
  const texture = useOptionalTexture(body.texture);
  const selectBody = useSelectedBodyStore((state) => state.selectBody);
  const focusBody = useCameraFocusStore((state) => state.focusBody);
  const radius = body.sceneRadius;
  const hitRadius = body.id === 'saturn' ? radius * 2.4 : Math.max(radius * 1.32, 0.3);
  const atmosphereColor = body.id === 'earth' ? '#4b9cff' : body.id === 'venus' ? '#f1bb78' : body.id === 'uranus' ? '#7ce8e9' : body.id === 'neptune' ? '#5b81ff' : body.kind === 'gas-giant' ? '#e1bd8c' : body.color;

  useFrame((_, delta) => {
    const currentDays = useSimulationStore.getState().elapsedDays;
    if (group.current) {
      const [x, y, z] = getScenePosition(body.orbital, currentDays);
      group.current.position.set(x, y, z);
      group.current.rotation.y += delta * (body.id === 'earth' ? 0.22 : body.kind === 'gas-giant' ? 0.11 : 0.055);
    }
  });

  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    selectBody(body.id);
  };
  const setPointer = (active: boolean, event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = active ? 'pointer' : '';
  };

  return (
    <group ref={group}>
      <mesh onClick={handleSelect} onDoubleClick={(event) => { handleSelect(event); focusBody(body.id); }} onPointerOver={(event) => setPointer(true, event)} onPointerOut={(event) => setPointer(false, event)}>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshStandardMaterial map={texture ?? undefined} color={texture ? '#ffffff' : body.color} roughness={body.kind === 'gas-giant' ? 0.76 : 0.94} metalness={0.015} />
      </mesh>
      {body.id === 'earth' && <EarthCloudLayer radius={radius} />}
      {body.id === 'saturn' && <SaturnRingLayer radius={radius} />}
      {['earth', 'venus', 'uranus', 'neptune'].includes(body.id) && (
        <mesh scale={1.055}>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshBasicMaterial color={atmosphereColor} transparent opacity={body.id === 'venus' ? 0.15 : 0.075} side={BackSide} depthWrite={false} />
        </mesh>
      )}
      {body.kind === 'gas-giant' && body.id !== 'saturn' && (
        <mesh scale={1.035}>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshBasicMaterial color={atmosphereColor} transparent opacity={0.045} side={BackSide} depthWrite={false} />
        </mesh>
      )}
      {selected && (
        <group>
          <mesh>
            <sphereGeometry args={[radius * 1.11, 48, 48]} />
            <meshBasicMaterial color="#74e7f3" wireframe transparent opacity={0.13} depthWrite={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius * 1.25, Math.max(radius * 0.012, 0.009), 8, 96]} />
            <meshBasicMaterial color="#85f2fb" transparent opacity={0.86} />
          </mesh>
          <Text
            position={[0, radius + 0.42, 0]}
            fontSize={Math.max(radius * 0.14, 0.16)}
            color="#85f2fb"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.018}
            outlineColor="#06101f"
            depthOffset={-1}
          >
            {body.englishName.toUpperCase()}
          </Text>
        </group>
      )}
      <mesh onClick={handleSelect} onDoubleClick={(event) => { handleSelect(event); focusBody(body.id); }} onPointerOver={(event) => setPointer(true, event)} onPointerOut={(event) => setPointer(false, event)}>
        <sphereGeometry args={[hitRadius, 36, 36]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Sun({ selected }: { selected: boolean }) {
  const mesh = useRef<Mesh>(null);
  const texture = useOptionalTexture(SUN_TEXTURE);
  const selectSun = useSelectedBodyStore((state) => state.selectSun);
  const focusBody = useCameraFocusStore((state) => state.focusBody);
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.025;
  });

  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    selectSun();
  };
  const setPointer = (active: boolean, event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = active ? 'pointer' : '';
  };

  return (
    <group>
      <mesh ref={mesh} onClick={handleSelect} onDoubleClick={(event) => { handleSelect(event); focusBody('sun'); }} onPointerOver={(event) => setPointer(true, event)} onPointerOut={(event) => setPointer(false, event)}>
        <sphereGeometry args={[1.18, 96, 96]} />
        <meshBasicMaterial map={texture ?? undefined} color={texture ? '#ffffff' : '#ffd28a'} />
      </mesh>
      <mesh scale={1.13}>
        <sphereGeometry args={[1.18, 64, 64]} />
        <meshBasicMaterial color="#ffb45e" transparent opacity={0.12} side={BackSide} depthWrite={false} />
      </mesh>
      <mesh scale={1.28}>
        <sphereGeometry args={[1.18, 48, 48]} />
        <meshBasicMaterial color="#ff8b43" transparent opacity={0.055} side={BackSide} depthWrite={false} />
      </mesh>
      {selected && <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.58, 0.025, 10, 128]} /><meshBasicMaterial color="#ffd98c" transparent opacity={0.92} /></mesh>}
      <mesh onClick={handleSelect} onDoubleClick={(event) => { handleSelect(event); focusBody('sun'); }} onPointerOver={(event) => setPointer(true, event)} onPointerOut={(event) => setPointer(false, event)}>
        <sphereGeometry args={[1.48, 40, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Text
        position={[0, 1.75, 0]}
        fontSize={0.2}
        color={selected ? '#ffe6a8' : '#c1b9a2'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.025}
        outlineColor="#1a1010"
        depthOffset={-1}
      >
        SUN / G2V
      </Text>
      <pointLight color="#ffd9a0" intensity={950} distance={110} decay={1.7} />
    </group>
  );
}

function OrbitPaths() {
  const selectedObjectId = useSelectedBodyStore((state) => state.selectedObjectId);
  const paths = useMemo(() => CELESTIAL_BODIES.map((body) => ({ body, points: getOrbitPath(body.orbital, 180) })), []);
  return (
    <group>
      {paths.map(({ body, points }) => (
        <Line key={body.id} points={points} color={selectedObjectId !== 'sun' && body.id === selectedObjectId ? '#74e7f3' : '#8292c7'} lineWidth={selectedObjectId !== 'sun' && body.id === selectedObjectId ? 1.25 : 0.55} transparent opacity={selectedObjectId !== 'sun' && body.id === selectedObjectId ? 0.72 : 0.28} />
      ))}
    </group>
  );
}

function CameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsHandle | null> }) {
  const camera = useThree((state) => state.camera);
  const target = useRef(new Vector3(0, 0, 0));
  const cameraGoal = useRef(DEFAULT_CAMERA_POSITION.clone());
  const previousBodyPosition = useRef(new Vector3());
  const lastFocusRevision = useRef(-1);
  const transitioning = useRef(false);

  useFrame((_, delta) => {
    const focusState = useCameraFocusStore.getState();
    const focusedId = focusState.focusedBodyId;
    const controls = controlsRef.current;
    const currentDays = useSimulationStore.getState().elapsedDays;

    if (focusState.focusRevision !== lastFocusRevision.current) {
      lastFocusRevision.current = focusState.focusRevision;
      transitioning.current = true;

      if (focusedId === 'sun') {
        target.current.set(0, 0, 0);
        previousBodyPosition.current.set(0, 0, 0);
        const orbitTarget = controls?.target ?? new Vector3();
        const direction = new Vector3().subVectors(camera.position, orbitTarget).normalize();
        if (direction.lengthSq() < 0.001) direction.set(0, 0.35, 1).normalize();
        cameraGoal.current.copy(direction).multiplyScalar(5.7);
      } else if (focusedId) {
        const body = CELESTIAL_BODY_BY_ID[focusedId];
        const [x, y, z] = getScenePosition(body.orbital, currentDays);
        target.current.set(x, y, z);
        previousBodyPosition.current.copy(target.current);
        const orbitTarget = controls?.target ?? new Vector3();
        const direction = new Vector3().subVectors(camera.position, orbitTarget).normalize();
        if (direction.lengthSq() < 0.001) direction.set(0, 0.35, 1).normalize();
        cameraGoal.current.copy(target.current).addScaledVector(direction, Math.max(body.sceneRadius * 7, 2.8));
      } else {
        target.current.set(0, 0, 0);
        previousBodyPosition.current.set(0, 0, 0);
        cameraGoal.current.copy(DEFAULT_CAMERA_POSITION);
      }
    }

    let bodyDelta: Vector3 | null = null;
    if (focusedId && focusedId !== 'sun') {
      const body = CELESTIAL_BODY_BY_ID[focusedId];
      const [x, y, z] = getScenePosition(body.orbital, currentDays);
      const nextPosition = new Vector3(x, y, z);
      bodyDelta = nextPosition.clone().sub(previousBodyPosition.current);
      target.current.copy(nextPosition);
      previousBodyPosition.current.copy(nextPosition);
      if (transitioning.current) cameraGoal.current.add(bodyDelta);
    }

    if (transitioning.current) {
      const smoothing = Math.min(1, delta * 2.6);
      camera.position.lerp(cameraGoal.current, smoothing);
      if (controls) {
        controls.target.lerp(target.current, smoothing);
        controls.update();
      }
      const cameraSettled = camera.position.distanceToSquared(cameraGoal.current) < 0.0004;
      const targetSettled = !controls || controls.target.distanceToSquared(target.current) < 0.0004;
      if (cameraSettled && targetSettled) transitioning.current = false;
    } else if (focusedId && bodyDelta && bodyDelta.lengthSq() > 0) {
      camera.position.add(bodyDelta);
      if (controls) {
        controls.target.add(bodyDelta);
        controls.update();
      }
    }
  });

  return null;
}

function SimulationTicker() {
  const previous = useRef(0);
  useFrame((_, delta) => {
    if (!useSimulationStore.getState().isPlaying) return;
    previous.current += delta;
    if (previous.current >= 0.08) {
      const elapsed = previous.current;
      previous.current = 0;
      const state = useSimulationStore.getState();
      state.advanceDays(elapsed * state.speed * 0.55);
    }
  });
  return null;
}

function SceneContents() {
  const selectedObjectId = useSelectedBodyStore((state) => state.selectedObjectId);
  const controlsRef = useRef<OrbitControlsHandle>(null);

  return (
    <>
      <color attach="background" args={['#050814']} />
      <fog attach="fog" args={['#050814', 38, 110]} />
      <ambientLight intensity={0.12} color="#9eb9ff" />
      <Sun selected={selectedObjectId === 'sun'} />
      <Stars radius={105} depth={70} count={3200} factor={3.5} saturation={0.12} fade speed={0.28} />
      <OrbitPaths />
      {CELESTIAL_BODIES.map((body) => <TexturedPlanet key={body.id} body={body} selected={body.id === selectedObjectId} />)}
      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.065} minDistance={2.2} maxDistance={95} maxPolarAngle={Math.PI * 0.88} />
      <CameraRig controlsRef={controlsRef} />
      <SimulationTicker />
    </>
  );
}

export function SolarSystemScene() {
  return (
    <Canvas camera={{ position: [0, 21, 52], fov: 43, near: 0.1, far: 180 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} className="solar-canvas-r3f">
      <Suspense fallback={null}><SceneContents /></Suspense>
    </Canvas>
  );
}
