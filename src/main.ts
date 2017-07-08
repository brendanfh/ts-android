import Renderer from "./Renderer";

let WIDTH = 720;
let HEIGHT = WIDTH * 16 / 9;

function main(): void {

    let xScale = document.documentElement.clientWidth / WIDTH;
    let yScale = document.documentElement.clientHeight / HEIGHT;
    let scale = Math.min(xScale, yScale);

    Renderer.init("game", WIDTH, HEIGHT, scale);

    Renderer.setColor([1, 1, 1, 1]);
    Renderer.setClearColor([1, 0, 0, 1]);
    Renderer.clear();
    for (let i=0; i<400; i++) {
        Renderer.updateData(i, new Float32Array([
            i, i, 0, 0, 1, 1, 1, 1,
            360+i, i, 0, 0, 1, 1, 1, 1,
            360+i, 640+i, 0, 0, 1, 1, 1, 1,
            i, 640+i, 0, 0, 1, 1, 1, 1
        ]));
    }
    Renderer.draw(0, 400);
}

window.addEventListener("load", main);