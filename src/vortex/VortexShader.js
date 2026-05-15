export const VortexShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: [0.1, 0.4, 0.8] },
    uVibeIntensity: { value: 1.0 },
    uLightMode: { value: 0.0 }, // 0 = dark (fade to black), 1 = light (fade to bg)
  },
  vertexShader: `
    varying float vDistance;
    uniform float uTime;

    void main() {
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
      float pSize = 10.0 / max(length(mvPosition.xyz), 0.1);
      gl_PointSize = clamp(pSize, 1.0, 4.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uLightMode;
    varying float vDistance;

    void main() {
      float strength = max(0.0, 1.0 - (vDistance / 6.0));
      strength = strength * strength;

      // Dark mode: fade center→color, edges→black
      // Light mode: fade center→color, edges→white (disappear on light bg)
      vec3 fadeTarget = mix(vec3(0.0), vec3(1.0), uLightMode);
      vec3 color = mix(fadeTarget, uColor, strength);

      float sparkle = sin(vDistance * 50.0 - uTime * 10.0) * 0.5 + 0.5;
      color += sparkle * 0.15 * strength;

      float alpha = mix(strength * 0.8 + 0.2, strength * 0.9, uLightMode);
      gl_FragColor = vec4(color, alpha);
    }
  `
};
