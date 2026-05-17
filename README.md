# 羡阳 · AI 八字算命

一个**纯前端 BYOK**（Bring Your Own Key）的中文八字算命工具：
浏览器本地完成排盘 → 注入扮演命理师的系统提示词 → 调用你自己选择的 AI 模型解读。

* **自动排盘**：基于 [`lunar-typescript`](https://6tail.cn/calendar/api.html)，支持公历 / 农历输入、闰月、晚子时换日、真太阳时校正；自动给出四柱、五行强弱、十神、纳音、藏干、十二长生、胎元、命宫身宫、起运与十步大运。
* **多模型**：内置 7 家 OpenAI / Anthropic Claude / Google Gemini / DeepSeek / 智谱 GLM / Moonshot Kimi / 通义 Qwen 适配器，统一 SSE 流式输出，可一键切换。
* **可定制**：API Key、模型名、baseURL、temperature、系统提示词均可在设置面板覆盖；可指向 OneAPI / 自建反代。
* **零后端**：构建产物是纯静态 HTML/JS，发布到任意静态托管（Vercel / Cloudflare Pages / GitHub Pages / Netlify）后打开即用。Key 仅保存在你的浏览器 `localStorage`，所有请求由浏览器直发对应官方域名。

## 开始

```bash
npm install
npm run dev     # http://localhost:5173
```

首次打开后：

1. 点击右上角 **设置**，挑一家服务商，粘贴你自己的 API Key，按需调整模型；
2. 在左侧 **生辰录入** 中填入出生年月日时辰（公历或农历皆可），点击 **起盘**；
3. 在右侧 **先生在堂** 面板里点击预设话题，或自行提问；AI 会先排盘分析、再回答。

> Ctrl/⌘ + Enter 发送；点击 **停止** 可中断流式生成。

## 构建与部署

```bash
npm run build
npm run preview
```

`dist/` 目录是纯静态产物，可直接拖到任意静态托管平台。下面列出三种最常见的开源在线部署方式：

### 方式 A · GitHub Pages（推荐 · 仓库自带）

仓库已附带 `.github/workflows/deploy.yml`：每次 push 到 `main` 分支会自动构建并发布到 GitHub Pages。

启用步骤：

1. Fork 或新建仓库后，进入 **Settings → Pages**，将 **Build and deployment → Source** 设为 **GitHub Actions**；
2. 推送一次提交（或在 Actions 页手动触发 `Deploy to GitHub Pages`）；
3. 等待 workflow 跑完，访问 `https://<你的用户名>.github.io/<仓库名>/`。

> Workflow 已自动设置 `VITE_BASE=/<仓库名>/`，因此 fork 后改名也能直接用，无需手改 `vite.config.ts`。

### 方式 B · Vercel（一键导入，免配置）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

在 [vercel.com](https://vercel.com) 用 GitHub 登录 → **Add New → Project** → 选择本仓库 → 全部默认 → **Deploy**。
随后每次 push 自动构建并附带 PR 预览环境，分配 `*.vercel.app` 域名，可绑定自有域名。

### 方式 C · Cloudflare Pages

在 [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/) 选择 **Create a project → Connect to Git** → 选择仓库 →
Build command 填 `npm run build`，Build output 填 `dist` → **Save and Deploy** 即可。

## 关于 CORS / 安全

* **开发期**：Vite 配置了 `server.proxy` 将 `/api/<provider>/*` 转发到各官方域名，规避浏览器 CORS。
* **生产期**：以下厂商已支持浏览器直连（Anthropic 自动附 `anthropic-dangerous-direct-browser-access` header）：OpenAI、Anthropic、Gemini、DeepSeek、Moonshot、Qwen（DashScope 兼容模式）。
* **智谱 GLM**：少数情况下 CORS 受限，遇到失败时可在设置里手动填一个反代 baseURL。
* **API Key 安全**：Key 只写入 `localStorage`，不会上传到本项目作者或任何第三方服务器。但浏览器扩展、共享设备仍可能读取它，请勿在公共/共享设备上输入 Key，建议在服务商后台轮换。

## 目录结构

```
src/
├── App.tsx                    # 顶层布局：表头 + 左侧表单/排盘 + 右侧对话
├── components/
│   ├── BirthForm.tsx          # 生辰录入（含真太阳时、晚子时高级开关）
│   ├── BaziCard.tsx           # 四柱、五行、十神、纳音、大运表
│   ├── ChatPanel.tsx          # 多轮对话 + 流式 Markdown
│   ├── PresetQuestions.tsx    # 预设话题胶囊
│   └── SettingsDialog.tsx     # provider / model / key / baseURL / 系统提示词
├── lib/
│   ├── bazi.ts                # 排盘核心（lunar-typescript 封装）
│   ├── prompt.ts              # 命理师人设 + 排盘注入 + 预设问题
│   ├── crypto.ts              # 可选 AES-GCM Key 加密
│   ├── storage.ts             # localStorage 封装
│   └── providers/             # 7 家 AI 服务商适配器（SSE 流式）
└── store/
    └── useStore.ts            # zustand 全局状态
```

## 免责

本工具内容由 AI 生成，仅供文化娱乐参考，不构成医疗、法律、投资建议。请理性看待命理。

## License

MIT
