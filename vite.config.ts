import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      // 将所有 /api 开头的请求代理到 localhost:8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 如果 API 服务器不需要 /api 前缀，可以启用以下配置
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
});
