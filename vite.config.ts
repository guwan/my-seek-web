import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8080";

  // 将所有 /api 开头的请求代理到后端，地址可通过 VITE_API_PROXY_TARGET 覆盖
  const proxy = {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {proxy},
    preview: {proxy},
  };
});
