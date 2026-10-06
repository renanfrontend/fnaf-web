import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa: o build funciona no GitHub Pages ou em qualquer subpasta.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { assetsInlineLimit: 0 },
  test: { environment: "node" },
});
