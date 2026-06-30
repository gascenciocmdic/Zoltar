import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VortexShader } from './VortexShader';
import PetalCanvas from './PetalCanvas';

// Dark mode: electric, vivid (additive blending on dark bg)
const VIBE_COLORS_DARK = {
  healing_blue:    new THREE.Color(0x00d2ff),
  revelation_gold: new THREE.Color(0xffd700),
  karmic_red:      new THREE.Color(0xff007f),
};

// Light mode: spiritual, healing, soft (normal blending on light bg)
const VIBE_COLORS_LIGHT = {
  healing_blue:    new THREE.Color(0x4a90c4),
  revelation_gold: new THREE.Color(0xb8860b),
  karmic_red:      new THREE.Color(0x9b6fa0),
};

const VortexField = ({ vibe = 'healing_blue', theme = 'dark' }) => {
  const meshRef = useRef();
  const matRef  = useRef();
  const isLight = theme === 'light';
  const VIBE_COLORS = isLight ? VIBE_COLORS_LIGHT : VIBE_COLORS_DARK;
  const targetColor = VIBE_COLORS[vibe] || VIBE_COLORS.healing_blue;

  // Refs para valores usados en useFrame — evitan stale closures sin recrear uniforms
  const isLightRef     = useRef(isLight);
  const targetColorRef = useRef(targetColor);
  useEffect(() => { isLightRef.current = isLight; }, [isLight]);
  useEffect(() => { targetColorRef.current = targetColor; }, [targetColor]);

  // Actualiza blending imperativamente al cambiar de tema — sin recrear el material
  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.blending    = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    matRef.current.needsUpdate = true;
  }, [isLight]);

  // Libera memoria GPU al desmontar el componente
  useEffect(() => () => { if (matRef.current) matRef.current.dispose(); }, []);

  const count = 5000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 8.0;
      const angle  = Math.random() * Math.PI * 2;
      pos[i * 3]     = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
    }
    return pos;
  }, [count]);

  // Uniforms se crean una sola vez; isLight y targetColor se leen via refs en useFrame
  const uniforms = useMemo(() => ({
    uTime:          { value: 0 },
    uColor:         { value: targetColor.clone() },
    uVibeIntensity: { value: 1.0 },
    uLightMode:     { value: isLight ? 1.0 : 0.0 },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    if (document.hidden) return; // pausa GPU en pestañas en segundo plano
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    mat.uniforms.uTime.value = state.clock.getElapsedTime();
    mat.uniforms.uColor.value.lerp(targetColorRef.current, 0.05);
    mat.uniforms.uLightMode.value +=
      ((isLightRef.current ? 1.0 : 0.0) - mat.uniforms.uLightMode.value) * 0.08;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        depthWrite={false}
        transparent={true}
        vertexShader={VortexShader.vertexShader}
        fragmentShader={VortexShader.fragmentShader}
        uniforms={uniforms}
        blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
};

const VortexCanvas = ({ vibe, theme = 'dark' }) => {
  /* Modo claro: pétalos 2D orgánicos en lugar del vórtex WebGL */
  if (theme === 'light') {
    return <PetalCanvas />;
  }

  return (
    <div
      className="vortex-container"
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0, background: '#050505', pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 75 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          powerPreference: 'low-power',
          precision: 'mediump',
        }}
      >
        <VortexField vibe={vibe} theme={theme} />
      </Canvas>
    </div>
  );
};

export default VortexCanvas;
