import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "path";

// Custom plugin to copy icons to dist/icons
const copyIconsPlugin = () => {
  return {
    name: "copy-icons",
    writeBundle() {
      const iconsDir = resolve(__dirname, "icons");
      const distIconsDir = resolve(__dirname, "dist/icons");

      mkdirSync(distIconsDir);

      const iconFiles = [
        "icon16.png",
        "icon48.png",
        "icon128.png",
        "icon256.png",
      ];
      iconFiles.forEach((iconFile) => {
        const srcPath = resolve(iconsDir, iconFile);
        const destPath = resolve(distIconsDir, iconFile);
        copyFileSync(srcPath, destPath);
      });

      const manifestSrc = resolve(__dirname, "manifest.json");
      const manifestDest = resolve(__dirname, "dist/manifest.json");
      copyFileSync(manifestSrc, manifestDest);
    },
  };
};

export default defineConfig({
  plugins: [reactPlugin(), copyIconsPlugin()],
  build: {
    chunkSizeWarningLimit: 1024 * 100, // 100kb limit per chunk, otherwise we're doing something wrong...
    rollupOptions: {
      input: [
        "src/popups/default.html",
        "src/background.ts",
        "/src/content.ts",
        "src/style.css",
      ],
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
    target: "esnext",
  },
  server: {
    open: "/src/popups/default.html",
    port: 3000,
  },
});
