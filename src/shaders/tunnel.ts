export const tunnelVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const tunnelFragment = /* glsl */ `
uniform float uTime;
uniform float uTravel;
uniform float uSpeed;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
varying vec3 vPos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 uv = vUv;
  // lengthwise coordinate scrolls with time + scroll travel
  float z = uv.y * 40.0 + uTime * (0.6 + uSpeed * 6.0) + uTravel * 30.0;
  float a = uv.x * 6.28318;

  // segmented light strips
  float strips = 24.0;
  float cell = floor(uv.x * strips);
  float rnd = hash(vec2(cell, floor(z * 0.25)));
  float strip = smoothstep(0.48, 0.5, abs(fract(uv.x * strips) - 0.5));
  float dash = step(0.55, fract(z * 0.25 + rnd)) * step(0.35, rnd);

  // rings
  float ring = smoothstep(0.92, 1.0, fract(z * 0.5));
  // hex-ish grid
  float grid = max(
    smoothstep(0.96, 1.0, fract(uv.x * 48.0)),
    smoothstep(0.96, 1.0, fract(z * 1.0))
  ) * 0.25;

  vec3 col = mix(uColorA, uColorB, 0.5 + 0.5 * sin(a * 2.0 + z * 0.15));
  float glow = strip * dash * 2.2 + ring * 1.4 + grid;
  // fade the tube ends
  float ends = smoothstep(0.0, 0.08, uv.y) * (1.0 - smoothstep(0.92, 1.0, uv.y));
  vec3 base = col * 0.04;
  gl_FragColor = vec4(base + col * glow * ends, uOpacity);
}
`;
