import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "static-site"),
  base: "/uts-four-course-study/",
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "site-dist"),
    emptyOutDir: true,
  },
});
