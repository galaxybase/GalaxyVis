const path = require("path");

let production = process.argv.indexOf("--mode");
production = production !== -1 ? process.argv[production + 1] === "production" : false;

const moduleConfig = {
  rules: [{
      test: /\.glsl$/,
      exclude: /node_modules/,
      loader: "raw-loader",
    },
    {
      test: /\.ts$/,
      exclude: /node_modules/,
      loader: "ts-loader",
    }
  ],
};

module.exports = [{
  name: "galaxyvis",
  mode: "production",
  entry: "./src/index.ts",
  target: ['web', 'es5'],
  output: {
    filename: "galaxyvis.min.js",
    path: path.join(__dirname, "build"),
    library: "galaxyvis",
    libraryTarget: "umd",
  },
  resolve: {
    extensions: [".ts", ".js", ".glsl"],
  },
  module: moduleConfig,
}, ];