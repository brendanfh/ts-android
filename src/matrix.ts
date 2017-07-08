export namespace Matrix4x4 {
    export function identity() : Float32Array {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    export function mul(a: Float32Array, b: Float32Array) : Float32Array {
        if (a.length != 16 || b.length != 16) {
            throw "Expected 4x4 matricies";
        }

        let res = new Float32Array(16);

        for (let y=0; y<4; y++) {
            for (let x=0; x<4; x++) {
                for (let i=0; i<4; i++) {
                    res[x + y * 4] += a[i + y * 4] * b[x + i * 4];
                }
            }
        }

        return res;
    }

    /**
     * Matrix-Vector Multiplication
     * @param a The matrix in the multiplication (4x4)
     * @param b The vector in the multiplication (1x4)
     */
    export function mulVec4(a: Float32Array, b: Float32Array | number[]): Float32Array {
        if (a.length != 16 || b.length != 4) {
            throw "Expected correct arguments";
        }

        let res = new Float32Array(4);

        for (let n=0; n<4; n++) {
            for (let m=0; m<4; m++) {
                res[n] += b[m] * a[n + m * 4];
            }
        }

        return res;
    }
}