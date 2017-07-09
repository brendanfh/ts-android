/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var renderer_1 = __webpack_require__(1);
var WIDTH = 720;
var HEIGHT = WIDTH * 16 / 9;
function main() {
    alert("ASDFASDF");
    var xScale = document.documentElement.clientWidth / WIDTH;
    var yScale = document.documentElement.clientHeight / HEIGHT;
    var scale = Math.min(xScale, yScale);
    renderer_1.default.init("game", WIDTH, HEIGHT, scale);
    renderer_1.default.setColor([1, 1, 1, 1]);
    renderer_1.default.setClearColor([1, 0, 0, 1]);
    renderer_1.default.clear();
    for (var i = 0; i < 400; i++) {
        renderer_1.default.updateData(i, new Float32Array([
            i, i, 0, 0, 1, 1, 1, 1,
            360 + i, i, 0, 0, 1, 1, 1, 1,
            360 + i, 640 + i, 0, 0, 1, 1, 1, 1,
            i, 640 + i, 0, 0, 1, 1, 1, 1
        ]));
    }
    renderer_1.default.draw(0, 400);
}
window.addEventListener("load", main);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var matrix_1 = __webpack_require__(2);
function escapeNull(a) {
    if (a == null) {
        throw "Unexpected null";
    }
    else {
        return a;
    }
}
var Renderer;
(function (Renderer) {
    function getGL(canvas, args) {
        var gl = canvas.getContext("webgl", args);
        if (gl == null) {
            throw "Failed to create WebGL Context";
        }
        return gl;
    }
    function createShader(code, type) {
        var shader = escapeNull(gl.createShader(type));
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw "Failed to compile shader : " + gl.getShaderInfoLog(shader);
        }
        return shader;
    }
    function createProgram(vsc, fsc) {
        var vertexShader = createShader(vsc, gl.VERTEX_SHADER);
        var fragmentShader = createShader(fsc, gl.FRAGMENT_SHADER);
        var program = escapeNull(gl.createProgram());
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw "Failed to link program : " + gl.getProgramInfoLog(program);
        }
        return program;
    }
    /* MAXIMUM NUMBER OF QUADS IS 16384 (2^14) */
    Renderer.NUMBER_OF_QUADS = 4096;
    Renderer.VERTICIES_PER_QUAD = 4;
    Renderer.INDICIES_PER_QUAD = 6;
    Renderer.FLOATS_PER_VERTEX = 8;
    Renderer.BYTES_PER_SHORT = 2;
    Renderer.BYTES_PER_FLOAT = 4;
    var MAX_STORED_STATES = 128;
    var VIEW_MATRIX_DIRTY = false;
    var WORLD_MATRIX_DIRTY = false;
    var RENDERING_AVAILABLE = false;
    var canvas;
    var gl;
    var aPos;
    var aTex;
    var aClr;
    var uView;
    var uWorld;
    var uWorldClr;
    var uTexSize;
    var uTextureBound;
    var program;
    var vbo;
    var ibo;
    var texture = null;
    var viewMat;
    var worldMat;
    var worldMatStates;
    var tempMat;
    function init(canvasName, width, height, scale) {
        canvas = escapeNull(document.getElementById(canvasName));
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = "" + width * scale;
        canvas.style.height = "" + height * scale;
        gl = getGL(canvas, { antialias: false });
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
        var vertexData = new Float32Array(Renderer.FLOATS_PER_VERTEX * Renderer.VERTICIES_PER_QUAD * Renderer.NUMBER_OF_QUADS);
        vbo = escapeNull(gl.createBuffer());
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        var indicies = new Uint16Array(Renderer.NUMBER_OF_QUADS * Renderer.INDICIES_PER_QUAD);
        for (var i = 0; i < Renderer.NUMBER_OF_QUADS; i++) {
            var v = i * Renderer.VERTICIES_PER_QUAD;
            indicies.set([v, v + 1, v + 2, v, v + 2, v + 3], i * Renderer.INDICIES_PER_QUAD);
        }
        ibo = escapeNull(gl.createBuffer());
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicies, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        preRender();
    }
    Renderer.init = init;
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
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, Renderer.FLOATS_PER_VERTEX * Renderer.BYTES_PER_FLOAT, 0 * 0);
            gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, Renderer.FLOATS_PER_VERTEX * Renderer.BYTES_PER_FLOAT, 2 * Renderer.BYTES_PER_FLOAT);
            gl.vertexAttribPointer(aClr, 4, gl.FLOAT, false, Renderer.FLOATS_PER_VERTEX * Renderer.BYTES_PER_FLOAT, 4 * Renderer.BYTES_PER_FLOAT);
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
    function updateData(id, data) {
        if (!RENDERING_AVAILABLE)
            return;
        gl.bufferSubData(gl.ARRAY_BUFFER, id * Renderer.VERTICIES_PER_QUAD * Renderer.FLOATS_PER_VERTEX * Renderer.BYTES_PER_FLOAT, data);
    }
    Renderer.updateData = updateData;
    function clearData(start, count) {
        if (!RENDERING_AVAILABLE)
            return;
        gl.bufferSubData(gl.ARRAY_BUFFER, start * Renderer.VERTICIES_PER_QUAD * Renderer.FLOATS_PER_VERTEX * Renderer.BYTES_PER_FLOAT, new Float32Array(count * Renderer.VERTICIES_PER_QUAD * Renderer.FLOATS_PER_VERTEX));
    }
    Renderer.clearData = clearData;
    function draw(start, quadCount) {
        if (start === void 0) { start = 0; }
        if (quadCount === void 0) { quadCount = Renderer.NUMBER_OF_QUADS; }
        preRender();
        // gl.drawArrays(gl.TRIANGLES, 0, NUMBER_OF_QUADS * VERTICIES_PER_QUAD);
        gl.drawElements(gl.TRIANGLES, quadCount * Renderer.INDICIES_PER_QUAD, gl.UNSIGNED_SHORT, start * Renderer.INDICIES_PER_QUAD * Renderer.BYTES_PER_SHORT);
    }
    Renderer.draw = draw;
    function clear() {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    Renderer.clear = clear;
    function setClearColor(clr) {
        gl.clearColor(clr[0], clr[1], clr[2], clr[3]);
    }
    Renderer.setClearColor = setClearColor;
    function setColor(clr) {
        gl.uniform4fv(uWorldClr, clr);
    }
    Renderer.setColor = setColor;
    function setInternalSize(width, height) {
        viewMat = matrix_1.Matrix4x4.identity();
        viewMat[0] = 2 / width;
        viewMat[5] = -2 / height;
        viewMat[10] = -1;
        viewMat[12] = -1;
        viewMat[13] = 1;
        viewMat[15] = 1;
        VIEW_MATRIX_DIRTY = true;
    }
    Renderer.setInternalSize = setInternalSize;
    function clearTransformations() {
        worldMat = matrix_1.Matrix4x4.identity();
        WORLD_MATRIX_DIRTY = true;
    }
    Renderer.clearTransformations = clearTransformations;
    function getWorldTransformation() {
        return worldMatStates[worldMatStates.length - 1];
    }
    Renderer.getWorldTransformation = getWorldTransformation;
    function pushState() {
        worldMatStates.push(worldMat);
        if (worldMatStates.length >= MAX_STORED_STATES) {
            throw "Exceeded number of maximum states stored";
        }
    }
    Renderer.pushState = pushState;
    function popState() {
        var wm = worldMatStates.pop();
        if (wm == undefined) {
            worldMat = matrix_1.Matrix4x4.identity();
        }
        else {
            worldMat = wm;
        }
        WORLD_MATRIX_DIRTY = true;
    }
    Renderer.popState = popState;
    function translate(x, y) {
        tempMat = matrix_1.Matrix4x4.identity();
        tempMat[12] = x;
        tempMat[13] = y;
        worldMat = matrix_1.Matrix4x4.mul(worldMat, tempMat);
        WORLD_MATRIX_DIRTY = true;
    }
    Renderer.translate = translate;
    function scale(w, h) {
        tempMat = matrix_1.Matrix4x4.identity();
        tempMat[0] = w;
        tempMat[5] = h;
        worldMat = matrix_1.Matrix4x4.mul(worldMat, tempMat);
        WORLD_MATRIX_DIRTY = true;
    }
    Renderer.scale = scale;
    // export function centerOn(x: number, y: number) {
    //     Renderer.clearTransformations();
    //     Renderer.translate(-x + Game.WIDTH / 2, -y + Game.HEIGHT / 2);
    // }
    function setTileSheet(image) {
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
    Renderer.setTileSheet = setTileSheet;
    var vertexShader = "\n        attribute vec2 aPos;\n        attribute vec2 aTex;\n        attribute vec4 aClr;\n\n        uniform mat4 uView;\n        uniform mat4 uWorld;\n\n        varying vec2 vTex;\n        varying vec4 vClr;\n\n        void main() {\n            vTex = aTex;\n            vClr = aClr;\n            gl_Position = uView * uWorld * vec4(aPos, 0, 1);\n        }\n    ";
    var fragmentShader = "\n        precision mediump float;\n\n        uniform bool uTextureBound;\n        uniform vec4 uWorldClr;\n        uniform sampler2D uTexture;\n        uniform vec2 uTexSize;\n\n        varying vec2 vTex;\n        varying vec4 vClr;\n\n        void main() {\n            if (uTextureBound == true) {\n                gl_FragColor = texture2D(uTexture, (vTex / uTexSize)) * vClr * uWorldClr;\n            } else {\n                gl_FragColor = vClr * uWorldClr;\n            }\n        }\n    ";
})(Renderer || (Renderer = {}));
exports.default = Renderer;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Matrix4x4;
(function (Matrix4x4) {
    function identity() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
    Matrix4x4.identity = identity;
    function mul(a, b) {
        if (a.length != 16 || b.length != 16) {
            throw "Expected 4x4 matricies";
        }
        var res = new Float32Array(16);
        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 4; x++) {
                for (var i = 0; i < 4; i++) {
                    res[x + y * 4] += a[i + y * 4] * b[x + i * 4];
                }
            }
        }
        return res;
    }
    Matrix4x4.mul = mul;
    /**
     * Matrix-Vector Multiplication
     * @param a The matrix in the multiplication (4x4)
     * @param b The vector in the multiplication (1x4)
     */
    function mulVec4(a, b) {
        if (a.length != 16 || b.length != 4) {
            throw "Expected correct arguments";
        }
        var res = new Float32Array(4);
        for (var n = 0; n < 4; n++) {
            for (var m = 0; m < 4; m++) {
                res[n] += b[m] * a[n + m * 4];
            }
        }
        return res;
    }
    Matrix4x4.mulVec4 = mulVec4;
})(Matrix4x4 = exports.Matrix4x4 || (exports.Matrix4x4 = {}));


/***/ })
/******/ ]);