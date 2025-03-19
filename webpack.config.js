const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./dev/form-tool/form-tool-v2/formtool-v2.ts",
  output: {
    filename: "formtool-test-v2.js",
    path: path.resolve(__dirname, "tools/form-tool"),
    library: "FormTool",
    libraryTarget: "umd",
    globalObject: "this",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          mangle: false,
          keep_classnames: true,
          keep_fnames: true,
        },
        extractComments: false,
      }),
    ],
  },
};
