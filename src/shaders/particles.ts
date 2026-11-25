export const particlesVertex = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uSize;
uniform float uPixelRatio;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
attribute vec3 aTarget;
attribute vec4 aRand;
varying vec3 vColor;
varying float vAlpha;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  // spiral galaxy, inner stars orbit faster
  vec3 g = position;
  float r = length(g.xz);
  g.xz = rot(uTime * 0.06 * (1.0 + 1.5 / (r + 0.6))) * g.xz;

  // staggered morph toward the product surface
  float d = aRand.w * 0.45;
  float m = smoothstep(d, d + 0.55, uMorph);
  float mid = sin(m * 3.14159);
  vec3 swirl = vec3(
    sin(uTime * 1.3 + aRand.x * 30.0),
    cos(uTime * 1.1 + aRand.y * 30.0),
    sin(uTime * 0.9 + aRand.z * 30.0)
  ) * mid * 1.1;
  // spiral in: rotate around Y while travelling
  vec3 p = mix(g, aTarget, m);
  p.xz = rot((1.0 - m) * 2.5 * aRand.x) * p.xz;
  p += swirl;
  p += (aRand.xyz - 0.5) * 0.04 * sin(uTime * 2.0 + aRand.w * 10.0) * m;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = uSize * (0.35 + aRand.x * 0.9) * mix(1.0, 0.55, m);
  gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);

  vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 8.0, r));
  col = mix(col, uColorC, m * 0.6 + aRand.z * 0.2);
  vColor = col;
  vAlpha = uOpacity * (0.55 + aRand.y * 0.45);
}
`;

export const particlesFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.0, 0.5, d));
  a = pow(a, 1.6);
  gl_FragColor = vec4(vColor * 1.15, a * vAlpha);
}
`;
