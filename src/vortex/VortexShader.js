export const VortexShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: [0.1, 0.4, 0.8] }, // Default: Healing Blue
    uVibeIntensity: { value: 1.0 },
  },
  vertexShader: `
    varying float vDistance;
    uniform float uTime;
    
    void main() {
      // Create a vortex spiraling effect. Avoid atan(0,0) for strict WebGL drivers
      float safeX = position.x == 0.0 ? 0.0001 : position.x;
      float angle = atan(position.y, safeX);
      float dist = length(position.xy);
      vDistance = dist;
      
      float spiral = angle + dist * 5.0 - uTime * 0.5;
      vec3 newPosition = position;
      newPosition.x = cos(spiral) * dist;
      newPosition.y = sin(spiral) * dist;
      newPosition.z += sin(dist * 10.0 - uTime * 2.0) * 0.1;
      
      vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
      
      // Ensure points are always visible, but keep them small to prevent fill-rate crashing
      float pSize = 10.0 / max(length(mvPosition.xyz), 0.1);
      gl_PointSize = clamp(pSize, 1.0, 4.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    varying float vDistance;
    
    void main() {
      // Very safe, simple distance fade
      float strength = max(0.0, 1.0 - (vDistance / 6.0));
      strength = strength * strength; // Instead of pow() which had issues
      
      vec3 color = mix(vec3(0.0), uColor, strength);
      // Subtle sparkle effect
      float sparkle = sin(vDistance * 50.0 - uTime * 10.0) * 0.5 + 0.5;
      color += sparkle * 0.2 * strength;
      
      gl_FragColor = vec4(color, strength * 0.8 + 0.2); // +0.2 ensures it never fully vanishes if rendered
    }
  `
};
