import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ["**/*.jpg", "**/*.png", "**/*.svg"],
  optimizeDeps: {
    include: ["react-intl"], // react-intl을 명시적으로 포함
  },
});
