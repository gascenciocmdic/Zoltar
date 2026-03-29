import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VortexShader } from './VortexShader';

// Define colors statically outside components to prevent GC thrashing
const VIBE_COLORS = {
  healing_blue: new THREE.Color(0x00d2ff),
  revelation_gold: new THREE.Color(0xffd700),
  karmic_red: new THREE.Color(0xff007f), // High contrast Violet-Red
};

const VortexField = ({ vibe = 'healing_blue' }) => {
  const meshRef = useRef();
  
  const targetColor = VIBE_COLORS[vibe] || VIBE_COLORS.healing_blue;
  
  // Create particle positions (Optimized count for strict GPUs/Retina fill rates)
  const count = 5000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 8.0; // wider spread
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
    }
    return pos;
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: targetColor.clone() }, // Must clone to prevent mutating global config
    uVibeIntensity: { value: 1.0 },
  }), []); // Keep empty array, we lerp manually

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smoothly transition colors towards targetColor
      meshRef.current.material.uniforms.uColor.value.lerp(targetColor, 0.05);
    }
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
        depthWrite={false}
        transparent={true}
        vertexShader={VortexShader.vertexShader}
        fragmentShader={VortexShader.fragmentShader}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const VortexCanvas = ({ vibe }) => {
  return (
    <div className="vortex-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, background: '#050505', pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 75 }} dpr={[1, 1.5]}>
        <VortexField vibe={vibe} />
      </Canvas>
    </div>
  );
};

export default VortexCanvas;
