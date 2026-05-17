import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 仅为读取构建期的 VITE_BASE 环境变量；避免引入完整的 @types/node。
declare const process: { env: Record<string, string | undefined> };

// 开发期代理：把 /api/<provider>/* 转到各家官方域名，规避浏览器 CORS。
// 生产构建是纯静态产物，浏览器直接走官方域名（部分厂商已默认开放 CORS）。
//
// `base` 通过环境变量 VITE_BASE 覆盖：
//   - 本地开发 / Vercel / Cloudflare Pages / 自定义域名：保持默认 '/'
//   - GitHub Pages 子路径部署（如 https://<user>.github.io/<repo>/）：
//     在 GitHub Actions 里设置 VITE_BASE=/<repo>/ 即可（已在 deploy.yml 中处理）
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/openai/, ''),
      },
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/anthropic/, ''),
      },
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/gemini/, ''),
      },
      '/api/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/deepseek/, ''),
      },
      '/api/zhipu': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/zhipu/, ''),
      },
      '/api/moonshot': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/moonshot/, ''),
      },
      '/api/qwen': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/qwen/, ''),
      },
    },
  },
});
