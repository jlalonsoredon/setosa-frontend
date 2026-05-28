// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: "https://astro-scifi-ui.netlify.app/",
  vite: {
    plugins: [tailwindcss()],
    /** TensorFlow.js pulls many submodules; avoid SSR touching them and help Vite chunk resolution. */
    ssr: {
      external: ["@tensorflow/tfjs", "@tensorflow-models/coco-ssd"],
    },
    optimizeDeps: {
      include: ["@tensorflow/tfjs", "@tensorflow-models/coco-ssd"],
    },
  },

  integrations: [react()],
});
