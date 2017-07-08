import { Matrix4x4 } from "./matrix"

function escapeNull<T>(a: T | null): T {
    if (a == null) {
        throw "Unexpected null"
    } else {
        return a;
    }
}

namespace Renderer {

    function getGL(canvas: HTMLCanvasElement, args: WebGLContextAttributes): WebGLRenderingContext {
        let gl = canvas.getContext("webgl", args);
        if (gl == null) {
            throw "Failed to create WebGL Context";
        }
        return gl;
    }

    function createShader(code: string, type: number): WebGLShader {
        let shader = escapeNull(gl.createShader(type));
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw "Failed to compile shader : " + gl.getShaderInfoLog(shader);
        }
        return shader;
    }

    function createProgram(vsc: string, fsc: string): WebGLProgram {
        let vertexShader = createShader(vsc, gl.VERTEX_SHADER);
        let fragmentShader = createShader(fsc, gl.FRAGMENT_SHADER);
        let program = escapeNull(gl.createProgram());
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw "Failed to link program : " + gl.getProgramInfoLog(program);
        }
        return program;
    }

    /* MAXIMUM NUMBER OF QUADS IS 16384 (2^14) */
    export const NUMBER_OF_QUADS : number = 4096;
    export const VERTICIES_PER_QUAD : number = 4;
    export const INDICIES_PER_QUAD : number = 6;
    export const FLOATS_PER_VERTEX : number = 8;
    export const BYTES_PER_SHORT : number = 2;
    export const BYTES_PER_FLOAT : number = 4;

    const MAX_STORED_STATES = 128;

    let VIEW_MATRIX_DIRTY = false;
    let WORLD_MATRIX_DIRTY = false;
    let RENDERING_AVAILABLE = false;

    let canvas : HTMLCanvasElement;
    let gl : WebGLRenderingContext;

    let aPos : number;
    let aTex : number;
    let aClr : number;

    let uView : WebGLUniformLocation;
    let uWorld : WebGLUniformLocation;
    let uWorldClr : WebGLUniformLocation;
    let uTexSize : WebGLUniformLocation;
    let uTextureBound : WebGLUniformLocation;

    let program : WebGLProgram;
    let vbo : WebGLBuffer;
    let ibo : WebGLBuffer;
    let texture : WebGLTexture | null = null;

    let viewMat : Float32Array;
    let worldMat : Float32Array;

    let worldMatStates : Float32Array[];

    let tempMat : Float32Array;

    export function init(canvasName: string, width: number, height: number, scale: number) {
        canvas = escapeNull(document.getElementById(canvasName) as HTMLCanvasElement);
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width * scale}`;
        canvas.style.height = `${height * scale}`;

        gl = getGL(canvas, { antialias : false });

        program = createProgram(vertexShader, fragmentShader);
        gl.useProgram(program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        aPos = gl.getAttribLocation(program, "aPos");
        aTex = gl.getAttribLocation(program, "aTex");
        aClr = gl.getAttribLocation(program, "aClr");

        uView = escapeNull(gl.getUniformLocation(program, "uView"));
        uWorld = escapeNull(gl.getUniformLocation(program, "uWorld"));
        uWorldClr = escapeNull(gl.getUniformLocation(program, "uWorldClr"));
        uTexSize = escapeNull(gl.getUniformLocation(program, "uTexSize"));
        uTextureBound = escapeNull(gl.getUniformLocation(program, "uTextureBound"));

        gl.uniform1i(uTextureBound, 0);

        worldMatStates = [];
        clearTransformations();
        setInternalSize(width, height);
        setColor([1, 1, 1, 1]);

        let vertexData = new Float32Array(FLOATS_PER_VERTEX*VERTICIES_PER_QUAD*NUMBER_OF_QUADS);

        vbo = escapeNull(gl.createBuffer());
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);


        let indicies = new Uint16Array(NUMBER_OF_QUADS * INDICIES_PER_QUAD);
        for (let i=0; i<NUMBER_OF_QUADS; i++) {
            let v = i * VERTICIES_PER_QUAD;
            indicies.set([v, v+1, v+2, v, v+2, v+3], i*INDICIES_PER_QUAD);
        }

        ibo = escapeNull(gl.createBuffer());
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicies, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        preRender();
    }

    function preRender() {
        if (VIEW_MATRIX_DIRTY) {
            VIEW_MATRIX_DIRTY = false;
            gl.uniformMatrix4fv(uView, false, viewMat);
        }
        if (WORLD_MATRIX_DIRTY) {
            WORLD_MATRIX_DIRTY = false;
            gl.uniformMatrix4fv(uWorld, false, worldMat);
        }
        if (!RENDERING_AVAILABLE) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.enableVertexAttribArray(aPos);
            gl.enableVertexAttribArray(aTex);
            gl.enableVertexAttribArray(aClr);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, FLOATS_PER_VERTEX*BYTES_PER_FLOAT, 0*0);
            gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, FLOATS_PER_VERTEX*BYTES_PER_FLOAT, 2*BYTES_PER_FLOAT);
            gl.vertexAttribPointer(aClr, 4, gl.FLOAT, false, FLOATS_PER_VERTEX*BYTES_PER_FLOAT, 4*BYTES_PER_FLOAT);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            RENDERING_AVAILABLE = true;
        }
    }

    function disableRendering() {
        RENDERING_AVAILABLE = false;
        gl.disableVertexAttribArray(aPos);
        gl.disableVertexAttribArray(aTex);
        gl.disableVertexAttribArray(aClr);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    export function updateData(id: number, data: Float32Array) {
        if (!RENDERING_AVAILABLE) return;
        gl.bufferSubData(gl.ARRAY_BUFFER, id * VERTICIES_PER_QUAD * FLOATS_PER_VERTEX * BYTES_PER_FLOAT, data);
    }

    export function clearData(start: number, count: number) {
        if (!RENDERING_AVAILABLE) return;
        gl.bufferSubData(gl.ARRAY_BUFFER, start * VERTICIES_PER_QUAD * FLOATS_PER_VERTEX * BYTES_PER_FLOAT, new Float32Array(count * VERTICIES_PER_QUAD * FLOATS_PER_VERTEX));
    }

    export function draw(start: number=0, quadCount: number=Renderer.NUMBER_OF_QUADS) {
        preRender();
        // gl.drawArrays(gl.TRIANGLES, 0, NUMBER_OF_QUADS * VERTICIES_PER_QUAD);
        gl.drawElements(gl.TRIANGLES, quadCount * INDICIES_PER_QUAD, gl.UNSIGNED_SHORT, start * INDICIES_PER_QUAD * BYTES_PER_SHORT);
    }

    export function clear() {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    export function setClearColor(clr: [number, number, number, number]) {
        gl.clearColor(clr[0], clr[1], clr[2], clr[3]);
    }

    export function setColor(clr: [number, number, number, number]) {
        gl.uniform4fv(uWorldClr, clr);
    }

    export function setInternalSize(width: number, height: number) {
        viewMat = Matrix4x4.identity();
        viewMat[0] = 2 / width;
        viewMat[5] = -2 / height;
        viewMat[10] = -1;
        viewMat[12] = -1;
        viewMat[13] = 1;
        viewMat[15] = 1;

        VIEW_MATRIX_DIRTY = true;
    }

    export function clearTransformations() {
        worldMat = Matrix4x4.identity();
        WORLD_MATRIX_DIRTY = true;
    }

    export function getWorldTransformation(): Float32Array {
        return worldMatStates[worldMatStates.length - 1];
    }

    export function pushState() {
        worldMatStates.push(worldMat);
        if (worldMatStates.length >= MAX_STORED_STATES) {
            throw "Exceeded number of maximum states stored";
        }
    }

    export function popState() {
        let wm = worldMatStates.pop();

        if (wm == undefined) {
            worldMat = Matrix4x4.identity();
        } else {
            worldMat = wm;
        }
        WORLD_MATRIX_DIRTY = true;
    }

    export function translate(x: number, y: number) {
        tempMat = Matrix4x4.identity();
        tempMat[12] = x;
        tempMat[13] = y;
        worldMat = Matrix4x4.mul(worldMat, tempMat);
        WORLD_MATRIX_DIRTY = true;
    }

    export function scale(w: number, h: number) {
        tempMat = Matrix4x4.identity();
        tempMat[0] = w;
        tempMat[5] = h;
        worldMat = Matrix4x4.mul(worldMat, tempMat);
        WORLD_MATRIX_DIRTY = true;
    }

    // export function centerOn(x: number, y: number) {
    //     Renderer.clearTransformations();
    //     Renderer.translate(-x + Game.WIDTH / 2, -y + Game.HEIGHT / 2);
    // }

    export function setTileSheet(image: HTMLImageElement) {
        if (texture != null) {
            throw "Can only set tile sheet one time (currently).";
        }
        texture = escapeNull(gl.createTexture());
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.uniform2fv(uTexSize, [image.width, image.height]);
        gl.uniform1i(uTextureBound, 1);
    }

    let vertexShader = `
        attribute vec2 aPos;
        attribute vec2 aTex;
        attribute vec4 aClr;

        uniform mat4 uView;
        uniform mat4 uWorld;

        varying vec2 vTex;
        varying vec4 vClr;

        void main() {
            vTex = aTex;
            vClr = aClr;
            gl_Position = uView * uWorld * vec4(aPos, 0, 1);
        }
    `;

    let fragmentShader = `
        precision mediump float;

        uniform bool uTextureBound;
        uniform vec4 uWorldClr;
        uniform sampler2D uTexture;
        uniform vec2 uTexSize;

        varying vec2 vTex;
        varying vec4 vClr;

        void main() {
            if (uTextureBound == true) {
                gl_FragColor = texture2D(uTexture, (vTex / uTexSize)) * vClr * uWorldClr;
            } else {
                gl_FragColor = vClr * uWorldClr;
            }
        }
    `;
}

export default Renderer;