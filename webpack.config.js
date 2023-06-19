const path = require("path");

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
    filename: "galaxyvis.js",
    path: path.join(__dirname, "build"),
    libraryTarget: "umd",
  },
  resolve: {
    extensions: [".ts", ".js", ".glsl"],
  },
  module: moduleConfig,
}, ];