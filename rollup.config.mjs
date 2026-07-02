import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const dev = process.env.ROLLUP_WATCH;

const plugins = () => [
  resolve(),
  commonjs(),
  typescript({ tsconfig: "./tsconfig.json" }),
  !dev && terser({ format: { comments: false } }),
];

export default [
  // Lovelace bundle: main card + mini card, served by HACS.
  {
    input: "src/wall-panel-sonos-card.ts",
    output: {
      file: "dist/wall-panel-sonos-card.js",
      format: "es",
      sourcemap: dev ? "inline" : false,
      inlineDynamicImports: true,
    },
    plugins: plugins(),
  },
  // Sidebar panel: served by the wall_panel_sonos custom component
  // (integration registers /wall_panel_sonos/panel.js as a static path).
  {
    input: "src/panel.ts",
    output: {
      file: "custom_components/wall_panel_sonos/panel.js",
      format: "es",
      sourcemap: dev ? "inline" : false,
      inlineDynamicImports: true,
    },
    plugins: plugins(),
  },
];
