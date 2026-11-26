import { FALLBACK_FONT, FOCAL, RAMP, atlasFont, gridFor, isActive, sceneTime, sceneView, settle, stepMs } from "./holeRules";
import type { Grid, Preset } from "./holeRules";
import { FS_ASCII, FS_SCENE, VS } from "./holeShaders";

const VISIBLE_MARGIN = "120px";
const GLYPH_DROP = 0.04;
const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

export type Palette = { dop: number; ramp: Float32Array };
export type HoleOptions = {
  preset: Preset;
  palette: Palette;
  ink: number[];
  voidColor: number[];
  reduce: boolean;
  pointer: boolean;
  pointerTarget?: Window;
};
export type Hole = {
  paused: boolean;
  dirty: boolean;
  setFont(family: string): void;
  resize(): void;
  draw(now: number): void;
  active(): boolean;
};
type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
  return shader;
}

function link(gl: WebGLRenderingContext, fragment: string): Program {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(program, 0, "a");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "program");
  const uniforms: Program["uniforms"] = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)!;
    uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

function texture(gl: WebGLRenderingContext): WebGLTexture {
  const made = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, made);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return made;
}

function glyphAtlas(grid: Grid, font: string): HTMLCanvasElement {
  const sheet = document.createElement("canvas");
  sheet.width = grid.cw * RAMP.length;
  sheet.height = grid.ch;
  const pen = sheet.getContext("2d")!;
  pen.fillStyle = "#000";
  pen.fillRect(0, 0, sheet.width, sheet.height);
  pen.fillStyle = "#fff";
  pen.textBaseline = "middle";
  pen.textAlign = "center";
  pen.font = atlasFont(grid.cw, font);
  for (let i = 0; i < RAMP.length; i++) pen.fillText(RAMP[i], i * grid.cw + grid.cw / 2, grid.ch / 2 + grid.ch * GLYPH_DROP);
  return sheet;
}

function watchPointer(frame: HTMLElement, target: Window | undefined, move: (x: number, y: number) => void): void {
  (target ?? frame).addEventListener("pointermove", (event) => {
    const box = frame.getBoundingClientRect();
    const at = event as PointerEvent;
    move(((at.clientX - box.left) / box.width) * 2 - 1, ((at.clientY - box.top) / box.height) * 2 - 1);
  });
  (target ? document.documentElement : frame).addEventListener("pointerleave", () => move(0, 0));
}

export function createHole(frame: HTMLElement, options: HoleOptions): Hole | null {
  const canvas = frame.querySelector("canvas");
  const gl = canvas?.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!canvas || !gl) {
    frame.classList.add("nogl");
    return null;
  }
  let scene: Program;
  let ascii: Program;
  try {
    scene = link(gl, FS_SCENE);
    ascii = link(gl, FS_ASCII);
  } catch (error) {
    console.error(error);
    frame.classList.add("nogl");
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const sceneTexture = texture(gl);
  const atlasTexture = texture(gl);
  const target = gl.createFramebuffer();
  const pointer = { x: 0, y: 0, toX: 0, toY: 0 };
  let grid: Grid | null = null;
  let font = FALLBACK_FONT;
  let visible = true;
  let last = 0;

  function uploadAtlas(): void {
    if (!grid) return;
    gl!.bindTexture(gl!.TEXTURE_2D, atlasTexture);
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, false);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.LUMINANCE, gl!.LUMINANCE, gl!.UNSIGNED_BYTE, glyphAtlas(grid, font));
  }

  function drawScene(now: number, size: Grid): void {
    const view = sceneView(options.preset, pointer.x, pointer.y);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, target);
    gl!.viewport(0, 0, size.cols, size.rows);
    gl!.useProgram(scene.program);
    gl!.uniform2f(scene.uniforms.uGrid, size.cols, size.rows);
    gl!.uniform2f(scene.uniforms.uCell, size.cw, size.ch);
    gl!.uniform2f(scene.uniforms.uCenter, view.centerX, view.centerY);
    gl!.uniform1f(scene.uniforms.uTime, sceneTime(now, options.reduce));
    gl!.uniform1f(scene.uniforms.uElev, view.elev);
    gl!.uniform1f(scene.uniforms.uDist, options.preset.dist);
    gl!.uniform1f(scene.uniforms.uRoll, view.roll);
    gl!.uniform1f(scene.uniforms.uFocal, FOCAL);
    gl!.uniform1f(scene.uniforms.uSpin, options.preset.spin);
    gl!.uniform1f(scene.uniforms.uDopMix, options.palette.dop);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  function drawGlyphs(size: Grid): void {
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, canvas!.width, canvas!.height);
    gl!.useProgram(ascii.program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, sceneTexture);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, atlasTexture);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.uniform1i(ascii.uniforms.uScene, 0);
    gl!.uniform1i(ascii.uniforms.uAtlas, 1);
    gl!.uniform2f(ascii.uniforms.uGrid, size.cols, size.rows);
    gl!.uniform2f(ascii.uniforms.uCell, size.cw, size.ch);
    gl!.uniform1f(ascii.uniforms.uN, RAMP.length);
    gl!.uniform3fv(ascii.uniforms.uInk, options.ink);
    gl!.uniform3fv(ascii.uniforms.uVoid, options.voidColor);
    gl!.uniform3fv(ascii.uniforms["uRamp[0]"], options.palette.ramp);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  const hole: Hole = {
    paused: false,
    dirty: true,
    setFont(family) {
      font = family;
      uploadAtlas();
      hole.dirty = true;
    },
    resize() {
      const next = gridFor(frame.clientWidth, frame.clientHeight, window.devicePixelRatio);
      if (!next) return;
      grid = next;
      canvas.width = next.cols * next.cw;
      canvas.height = next.rows * next.ch;
      canvas.style.width = `${canvas.width / next.dpr}px`;
      canvas.style.height = `${canvas.height / next.dpr}px`;
      gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, next.cols, next.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0);
      uploadAtlas();
      hole.dirty = true;
    },
    draw(now) {
      const dt = stepMs(now, last);
      last = now;
      pointer.x = settle(pointer.x, pointer.toX, dt);
      pointer.y = settle(pointer.y, pointer.toY, dt);
      if (!grid) return;
      drawScene(now, grid);
      drawGlyphs(grid);
      hole.dirty = false;
    },
    active: () => isActive({ paused: hole.paused, dirty: hole.dirty, visible, reduce: options.reduce }),
  };

  if (options.pointer && !options.reduce) {
    watchPointer(frame, options.pointerTarget, (x, y) => {
      pointer.toX = x;
      pointer.toY = y;
    });
  }
  new ResizeObserver(() => hole.resize()).observe(frame);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    }, { rootMargin: VISIBLE_MARGIN }).observe(frame);
  }
  hole.resize();
  hole.draw(performance.now());
  return hole;
}
