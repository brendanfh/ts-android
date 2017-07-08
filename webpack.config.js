module.exports = {
    entry: "./src/main.ts",
    output: {
        filename: "./bin/bundle.js"
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        loaders: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    }
}