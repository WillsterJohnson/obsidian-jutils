import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import license from "rollup-plugin-license";
export default {
  input: "src/index.ts",
  output: {
    file: "main.js",
    format: "cjs",
  },
  plugins: [
    typescript(),
    terser(),
    license({ banner: { content: { file: "./LICENSE.md" } } }),
  ],
};
