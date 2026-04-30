import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE_PATH lets us deploy under a subpath (e.g. GitHub Pages serves
// from /<repo-name>/). Vercel, Netlify, Docker/nginx all serve from "/".
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  plugins: [react()],
  base,
});
