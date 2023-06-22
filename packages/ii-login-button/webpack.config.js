import path from "path";
import { Buffer } from "buffer";
const __dirname = import.meta.url.substring(
  7,
  import.meta.url.lastIndexOf("/")
);

export default {
  experiments: { outputModule: true },
  mode: "production",
  entry: {
    auto: "./src/auto.ts",
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    library: {
      type: "window",
    },
    clean: true,
    environment: {
      module: true,
    },
  },
  module: {
    rules: [
      {
        //test for ts and js files
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      buffer: ["buffer"],
    },
  },
  optimization: {
    minimize: true,
    moduleIds: "deterministic",
    chunkIds: "deterministic",
    usedExports: true,
  },
};
