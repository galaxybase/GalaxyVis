let path = require('path'),
    glob = require('glob')

const shaders = glob.sync(path.join(__dirname, 'src', 'renderers', 'webgl', 'shaders', '*.glsl'))

const entry = {}

shaders.forEach(function (p) {
    entry[path.basename(p, '.glsl')] = p
})

module.exports = {
    mode: 'production',
    entry,
    output: {
        path: path.join(__dirname, 'lib', 'renderers', 'webgl', 'shaders'),
        filename: '[name].glsl.js',
        libraryTarget: 'commonjs2',
        environment: {
            arrowFunction: false,
        },
    },
    module: {
        rules: [
            {
                test: /\.glsl$/,
                exclude: /node_modules/,
                use: {
                    loader: 'raw-loader',
                    options: {
                        esModule: false,
                    },
                },
            },
        ],
    },
}
