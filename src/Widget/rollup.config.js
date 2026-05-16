import polyfill from "rollup-plugin-polyfill-node";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import alias from "@rollup/plugin-alias";
import getRollupAliases from "./tsconfig-paths-to-rollup-alias";

export default {
  input: './dist/index.js',
  output: [{
    name: 'jooba',
    file: 'dist/jooba.js',
    format: 'iife',
  }, {
    name: 'jooba',
    file: 'dist/jooba.min.js',
    format: 'iife',
    plugins: [terser()]
  }],
  plugins: [
    alias({
      entries: getRollupAliases()
    }),
    commonjs({ transformMixedEsModules: true, strictRequires: true }),
    polyfill(),
    resolve({ browser: true, mainFields: ['module', 'main'] }),
    json()
  ]
};
