/**
 * Minimal WebGL2 toolkit: compile with readable errors, a cached uniform
 * setter, and a full-screen triangle. Enough for fragment-shader scenes
 * without a 600 kB engine.
 */

export class ShaderError extends Error {}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "";
    gl.deleteShader(shader);
    throw new ShaderError(annotate(log, source));
  }
  return shader;
}

/** Prefix the failing lines so errors point at real source. */
function annotate(log: string, source: string) {
  const lines = source.split("\n");
  const marked = [...log.matchAll(/ERROR: \d+:(\d+)/g)].map((m) => Number(m[1]));
  const context = marked.map((n) => `${n}: ${lines[n - 1]?.trim()}`).join("\n");
  return `${log}\n${context}`;
}

export type Uniform = number | [number, number] | [number, number, number] | Float32Array;

export function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new ShaderError(gl.getProgramInfoLog(program) ?? "link failed");
  }

  const locations = new Map<string, WebGLUniformLocation | null>();
  const loc = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    return locations.get(name)!;
  };

  return {
    program,
    use: () => gl.useProgram(program),
    set(name: string, value: Uniform) {
      const l = loc(name);
      if (!l) return; // optimised out: not an error
      if (typeof value === "number") gl.uniform1f(l, value);
      else if (value.length === 2) gl.uniform2fv(l, value);
      else gl.uniform3fv(l, value);
    },
    setInt(name: string, value: number) {
      const l = loc(name);
      if (l) gl.uniform1i(l, value);
    },
  };
}

/** A single triangle that covers the viewport: no diagonal seam, 3 vertices. */
export const FULLSCREEN_VERTEX = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export function fullscreenTriangle(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  return () => {
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

export const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  // sRGB → linear so lighting maths happens in linear space.
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.pow(c / 255, 2.2)) as [number, number, number];
};
