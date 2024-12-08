import clearOutput from "./plugins/rollup-plugin-clear-output.mjs";
export default {
  input: "src/main.js",
  output: {
    dir: "lib",
    format: "es",
  },
  plugins: [clearOutput()],
};
