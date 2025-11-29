import { vec2, vec3, vec4, mat3, mat4 } from 'gl-matrix';
import Drawable from './Drawable';
import { gl } from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
}

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;
  attrUV: number;

  private uniformLocations: Map<string, WebGLUniformLocation> = new Map();

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.attrUV = gl.getAttribLocation(this.prog, "vs_UV");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  private getUniformLocation(name: string): WebGLUniformLocation {
    let loc = this.uniformLocations.get(name);
    if (!loc) {
      loc = gl.getUniformLocation(this.prog, name);
      if (!loc) throw new Error(`Uniform '${name}' not found`);
      this.uniformLocations.set(name, loc);
    }
    return loc;
  }

  setUniformFloat(name: string, v: number) { this.use(); gl.uniform1f(this.getUniformLocation(name), v); }
  setUniformInt(name: string, v: number) { this.use(); gl.uniform1i(this.getUniformLocation(name), v); }
  setUniformVec2(name: string, v: vec2) { this.use(); gl.uniform2fv(this.getUniformLocation(name), v); }
  setUniformVec3(name: string, v: vec3) { this.use(); gl.uniform3fv(this.getUniformLocation(name), v); }
  setUniformVec4(name: string, v: vec4) { this.use(); gl.uniform4fv(this.getUniformLocation(name), v); }
  setUniformMat3(name: string, m: mat3) { this.use(); gl.uniformMatrix3fv(this.getUniformLocation(name), false, m); }
  setUniformMat4(name: string, m: mat4) { this.use(); gl.uniformMatrix4fv(this.getUniformLocation(name), false, m); }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrUV != -1 && d.bindUV()) {
      gl.enableVertexAttribArray(this.attrUV);
      gl.vertexAttribPointer(this.attrUV, 2, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    if (this.attrUV != -1) gl.disableVertexAttribArray(this.attrUV);
  }
}

export default ShaderProgram;
