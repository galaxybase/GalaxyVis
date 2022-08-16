const HtmlWebpackPlugin = require("html-webpack-plugin")
const path = require("path")
/* eslint-enable @typescript-eslint/no-var-requires */

const EXAMPLES = {
    test_node: {
        id: "test_node",
        title: "点样式",
    },
    test_edge: {
        id: "test_edge",
        title: "边样式",
    },
    test_all: {
        id: "test_all",
        title: "性能测试",
    },
    demonstration: {
        id: "demonstration",
        title: "布局效果演示",
    },
    test_export: {
        id: "test-export",
        title: "导出",
    },
    incremental: {
        id: "incremental",
        title: "局部布局",
    },
    geo: {
        id: "geo",
        title: "地图",
    },
    test_list: {
        id: "test_list",
        title: "测试",
    },
}

const entry = {}

const plugins = [
    new HtmlWebpackPlugin({
        filename: "index.html",
        title: "Examples",
        template: path.join(__dirname, "templates", "index.ejs"),
        pages: Object.keys(EXAMPLES).map((key) => EXAMPLES[key]),
        chunks: [],
    }),
]

for (const key in EXAMPLES) {
    const example = EXAMPLES[key]

    entry[key] = `./${example.id}.ts`

    plugins.push(
        new HtmlWebpackPlugin({
            filename: `${example.id}.html`,
            title: `${example.title} Example`,
            chunks: ["commons", key],
            template: path.join(__dirname, "templates", "default.ejs"),
        })
    )
}

module.exports = {
    mode: "development",
    context: __dirname,
    entry,
    output: {
        filename: "[name].bundle.js",
    },
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".js", ".glsl", ".gefx"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: "ts-loader",
                options: {
                    configFile: "tsconfig.example.json",
                },
            },
            {
                test: /\.(?:glsl|gexf)$/,
                exclude: /node_modules/,
                loader: "raw-loader",
            },
            {
                test: /\.worker\.(c|m)?js$/i,
                use: [
                    {
                        loader: "worker-loader",
                    },
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                        },
                    },
                ],
            },
        ],
    },
    plugins,
    optimization: {
        splitChunks: {
            chunks: "initial",
            minChunks: 2,
            name: "commons",
        },
    },
    devServer: {
        host: "0.0.0.0",
        open: "http://localhost:8086",
        port: 8086,
    },
}
