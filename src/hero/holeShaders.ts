export const VS = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";

export const FS_SCENE = `
precision highp float;
uniform vec2 uGrid;
uniform vec2 uCell;
uniform vec2 uCenter;
uniform float uTime, uElev, uDist, uRoll, uFocal, uSpin, uDopMix;
const float RIN = 2.6;
const float ROUT = 11.0;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float pnoise(vec2 p, float period){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, period); float x1 = mod(i.x + 1.0, period);
  return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), f.x),
             mix(hash(vec2(x0, i.y + 1.0)), hash(vec2(x1, i.y + 1.0)), f.x), f.y);
}
vec3 disk(vec3 hit, vec3 dir){
  float r = length(hit.xz);
  float a = atan(hit.z, hit.x) / 6.2831853 + 0.5;
  float w = pow(RIN / r, 1.5);
  float u = fract(a + uSpin * uTime * w * 0.085);
  float n = pnoise(vec2(u * 22.0, r * 1.6), 22.0) * 0.62 + pnoise(vec2(u * 58.0, r * 4.1 + 7.0), 58.0) * 0.38;
  float rings = 0.72 + 0.28 * sin(r * 5.2 + n * 4.5);
  float fall = pow(RIN / r, 1.15);
  float edge = smoothstep(RIN, RIN + 0.45, r) * (1.0 - smoothstep(ROUT - 2.6, ROUT, r));
  vec3 t = uSpin * normalize(vec3(hit.z, 0.0, -hit.x));
  float beta = sqrt(0.5 / r);
  float dop = sqrt(1.0 - beta * beta) / (1.0 - beta * dot(t, -dir));
  float L = fall * (0.3 + 1.0 * n) * rings * pow(dop, 1.7) * edge;
  float radial = clamp((pow(RIN / r, 0.75) * dop - 0.3) / 1.1, 0.0, 1.0);
  float shift = clamp((dop - 0.62) / 0.9, 0.0, 1.0);
  return vec3(L * 2.7, edge * 0.92, mix(radial, shift, uDopMix));
}
vec3 trace(vec2 p){
  p -= uCenter;
  float cr = cos(uRoll); float sr = sin(uRoll);
  p = vec2(cr * p.x - sr * p.y, sr * p.x + cr * p.y);
  vec3 cam = uDist * vec3(0.0, sin(uElev), -cos(uElev));
  vec3 fw = normalize(-cam);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 vel = normalize(fw * uFocal + rt * p.x + up * p.y);
  vec3 pos = cam;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  float L = 0.0; float T = 1.0; float LT = 0.0; float LD = 0.0;
  float far = max(uDist * 1.3, 34.0);
  bool escaped = false;
  int hits = 0;
  for (int i = 0; i < 240; i++) {
    float r2 = dot(pos, pos);
    if (r2 < 1.0) { break; }
    if (r2 > far * far && dot(pos, vel) > 0.0) { escaped = true; break; }
    float r = sqrt(r2);
    float dt = 0.04 + 0.07 * r;
    vel += (-1.5 * h2 * pos / (r2 * r2 * r)) * dt;
    vec3 np = pos + vel * dt;
    if (pos.y * np.y < 0.0 && hits < 3) {
      vec3 hit = mix(pos, np, pos.y / (pos.y - np.y));
      float rr = length(hit.xz);
      if (rr > RIN && rr < ROUT) {
        vec3 d = disk(hit, normalize(vel));
        L += T * d.x; LD += T * d.x; LT += T * d.x * d.z;
        T *= (1.0 - d.y);
        hits++;
      }
    }
    pos = np;
  }
  if (escaped) {
    vec3 d = normalize(vel);
    vec2 sph = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));
    vec2 g = floor(sph * vec2(104.0, 58.0));
    float s = hash(g);
    if (s > 0.978) {
      float k = hash(g + 9.0);
      L += T * (0.15 + 0.1 * k) * (0.72 + 0.28 * sin(uTime * (0.5 + 2.0 * k) + k * 40.0));
    }
  }
  return vec3(L, LT, LD);
}
void main(){
  vec2 cellId = floor(gl_FragCoord.xy);
  vec2 size = uGrid * uCell;
  vec3 acc = vec3(0.0);
  for (int s = 0; s < 4; s++) {
    vec2 o = vec2(mod(float(s), 2.0), floor(float(s) * 0.5)) * 0.5 + 0.25;
    acc += trace(((cellId + o) * uCell - 0.5 * size) / (0.5 * size.y));
  }
  float lum = 1.0 - exp(-acc.x * 0.25 * 1.1);
  gl_FragColor = vec4(lum, acc.y / max(acc.z, 0.0001), acc.z / max(acc.x, 0.0001), 1.0);
}`;

export const FS_ASCII = `
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uAtlas;
uniform vec2 uGrid;
uniform vec2 uCell;
uniform float uN;
uniform vec3 uInk, uVoid;
uniform vec3 uRamp[4];
void main(){
  vec2 fc = vec2(gl_FragCoord.x, uGrid.y * uCell.y - gl_FragCoord.y);
  vec2 cell = floor(fc / uCell);
  vec2 f = fract(fc / uCell);
  vec4 s = texture2D(uScene, (vec2(cell.x, uGrid.y - 1.0 - cell.y) + 0.5) / uGrid);
  float idx = min(floor(s.r * uN), uN - 1.0);
  float a = texture2D(uAtlas, vec2((idx + f.x) / uN, f.y)).r;
  float t = s.g * 3.0;
  vec3 heat = t < 1.0 ? mix(uRamp[0], uRamp[1], t) : (t < 2.0 ? mix(uRamp[1], uRamp[2], t - 1.0) : mix(uRamp[2], uRamp[3], t - 2.0));
  vec3 col = mix(uInk, heat, s.b) * mix(0.62, 1.0, s.r);
  gl_FragColor = vec4(mix(uVoid, col, a), 1.0);
}`;
