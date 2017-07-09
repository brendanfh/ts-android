import Renderer from "./renderer"

let WIDTH = 720;
let HEIGHT = WIDTH * 16 / 9;

let touches: [number, number][] = [];

function onTouch(e: TouchEvent): void {
    touches = []; 
    for (let i=0; i<e.touches.length; i++) {
        let t = e.touches.item(i);
        touches.push([t.clientX * WIDTH / document.documentElement.clientWidth
                    , t.clientY * HEIGHT / document.documentElement.clientHeight]);
    }
}

function main(): void {
    
    let canvas = document.getElementById("game");
    if (canvas != null) {
        canvas.addEventListener("touchstart", onTouch);
        canvas.addEventListener("touchmove", onTouch);
        canvas.addEventListener("touchend", onTouch);
    }
    
    let xScale = document.documentElement.clientWidth / WIDTH;
    let yScale = document.documentElement.clientHeight / HEIGHT;
    let scale = Math.min(xScale, yScale);

    Renderer.init("game", WIDTH, HEIGHT, scale);

    Renderer.setColor([1, 1, 1, 1]);
    Renderer.setClearColor([.1, .1, .1, 1]);
    
    let dt = 0;
    let now, last = performance.now();
    function loop(): void {
        now = performance.now();
        dt += (now - last) / 1000.0;
        last = now;
        
        Renderer.clear();
        let x = Math.cos(dt) * 50 + 100;
        let y = Math.sin(dt) * 50 + 100;
        Renderer.updateData(0, new Float32Array([
            x, y, 0, 0, 1, 0, 0, 1,
            360+x, y, 0, 0, 1, 0, 1, 1,
            360+x, 640+y, 0, 0, 0, 1, 1, 1,
            x, 640+y, 0, 0, 0, 0, 1, 1
        ]));
        
        let j = 1;
        for (let touch of touches) {
            let tx = touch[0];
            let ty = touch[1];
            Renderer.updateData(j++, new Float32Array([
                tx, ty, 0, 0, 1, 1, 1, 1,
                tx+10, ty, 0, 0, 1, 1, 1, 1,
                tx+10, ty+10, 0, 0, 1, 1, 1, 1,
                tx, ty+10, 0, 0, 1, 1, 1, 1,
            ]));
        }
        
        Renderer.draw(0, 100);
        window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
}

window.addEventListener("load", main);