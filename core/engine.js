import { vsSource } from '../shaders/main.vert.js';
import { fsSource } from '../shaders/mandelbulb.frag.js';

export class Engine {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl');
        this.prog = this.gl.createProgram();
        this.init();
    }

    init() {
        const createSh = (t, s) => {
            const sh = this.gl.createShader(t);
            this.gl.shaderSource(sh, s);
            this.gl.compileShader(sh);
            if (!this.gl.getShaderParameter(sh, this.gl.COMPILE_STATUS)) {
                console.error(this.gl.getShaderInfoLog(sh));
            }
            return sh;
        };
        this.gl.attachShader(this.prog, createSh(this.gl.VERTEX_SHADER, vsSource));
        this.gl.attachShader(this.prog, createSh(this.gl.FRAGMENT_SHADER, fsSource));
        this.gl.linkProgram(this.prog);
        this.gl.useProgram(this.prog);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), this.gl.STATIC_DRAW);
        const pLoc = this.gl.getAttribLocation(this.prog, 'pos');
        this.gl.enableVertexAttribArray(pLoc);
        this.gl.vertexAttribPointer(pLoc, 2, this.gl.FLOAT, false, 0, 0);

        this.locs = {
            t: this.gl.getUniformLocation(this.prog, 'u_time'),
            r: this.gl.getUniformLocation(this.prog, 'u_res'),
            z: this.gl.getUniformLocation(this.prog, 'u_zoom'),
            m: this.gl.getUniformLocation(this.prog, 'u_rot'),
            h: this.gl.getUniformLocation(this.prog, 'u_heavy'),
            q: this.gl.getUniformLocation(this.prog, 'u_q')
        };
    }

    render(data) {
        this.gl.uniformMatrix3fv(this.locs.m, false, data.rotMat);
        this.gl.uniform1f(this.locs.t, data.time);
        this.gl.uniform2f(this.locs.r, data.width, data.height);
        this.gl.uniform1f(this.locs.z, data.zoom);
        this.gl.uniform1i(this.locs.h, data.heavy);
        this.gl.uniform1i(this.locs.q, data.q);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
