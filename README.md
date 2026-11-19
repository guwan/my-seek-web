# MySeek Web

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![React Router](https://img.shields.io/badge/React%20Router-7.18-CA4245?logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/guwan/my-seek-web?style=social)](https://github.com/guwan/my-seek-web)

**MySeek 的 Web 前端** —— 一个面向企事业内部的 AI 对话工作台，支持多模型切换、流式输出、联网搜索、会话管理、知识库问答与 AI 写作。与 [MySeek 后端](https://github.com/guwan/my-seek) 配套使用。

---

## 界面预览

<p align="center">
  <img src="./assets/image.png" alt="MySeek 聊天界面" width="920" />
</p>

<p align="center">
  <em>聊天页：多轮对话、Markdown 渲染、模型切换与会话列表</em>
</p>

---

## 功能特性

- **多模型切换**：本地 Ollama、豆包、千问及 OpenAI 兼容接口，按请求动态选择
- **流式对话**：逐字输出，Markdown / 代码高亮 / 数学公式（KaTeX）渲染，支持推理过程展示与消息时间分组
- **结构化流协议**：按 `meta / content / done / error` 帧解析，兼容旧版裸文本流
- **联网搜索**：可在对话中开启实时搜索，展示引用的来源链接
- **供应商管理**：可视化新增、编辑、启停第三方 AI 接口并测试连通性，API Key 由后端加密保存
- **知识库管理**：上传文档、查看解析状态与分块数、删除文档、全库或单文档检索
- **AI 写作工作台**：独立的写作页面，支持草稿本地保存与 AI 续写/润色/扩写
- **新建写作仿写**：仅按风格描述生成开篇，不依赖具体范文；风格可作为作品设定持续编辑
- **会话管理**：侧边栏会话搜索与一键新建对话，历史消息持久化，按用户隔离
- **统一鉴权**：JWT 登录，未授权自动跳转登录页并携带回跳地址
- **响应式布局**：可折叠侧边栏，适配不同屏幕尺寸

## 技术栈

| 类别 | 技术 | 版本 |
| --- | --- | --- |
| UI 框架 | React | 19.3 |
| 路由 | React Router | 7.18（SPA 模式） |
| 语言 | TypeScript | 5.9（strict） |
| 构建 | Vite | 7.3 |
| 样式 | Tailwind CSS | 4.3 |
| 状态管理 | Redux Toolkit | 2.14 |
| 组件库 | shadcn/ui（Radix UI） | — |
| 包管理 | pnpm | 11 |

## 快速开始

### 环境要求

- Node.js 22+
- pnpm 11+
- 后端服务已启动并监听 `8080` 端口（见 [my-seek](https://github.com/guwan/my-seek)）

### 安装与运行

```bash
pnpm install
pnpm dev
```

浏览器打开 `http://localhost:5173`。

开发环境下 Vite 会把所有 `/api` 请求代理到后端，默认 `http://localhost:8080`；可在 `.env` 中设置 `VITE_API_PROXY_TARGET` 覆盖，代理规则见 `vite.config.ts`。

### 校验与构建

```bash
pnpm typecheck   # react-router typegen + tsc
pnpm build       # 产出静态站点到 build/client
```

## 部署

本项目为 **SPA 模式**（`ssr: false`），`pnpm build` 的产物是 `build/client/` 下的纯静态文件。部署时需要：

1. 用任意静态服务器托管 `build/client/` 并确保未知路径回退到 `index.html`；
2. 配置反向代理，将 `/api` 转发到后端服务。

> 仓库中的 `Dockerfile` 为早期模板遗留（仍基于 npm / Node 20），尚未适配当前的 pnpm + Node 22 工具链，请勿直接用于生产。

## 目录结构

```
app/
├── components/   # 界面组件（聊天、知识库、登录、供应商、写作、布局、通用 UI）
├── routes/       # 文件路由（home / login / dashboard）
├── pages/        # 页面级组件（Chat / Write / Knowledge / Providers）
├── store/        # Redux 切片（用户、会话、模型、写作）
├── lib/          # HTTP 客户端、鉴权工具、事件常量
├── auth/         # 登录状态 Context
└── services/     # 类型声明与 API 封装（含知识库、写作、流解析）
assets/           # README 截图
```

## 相关项目

| 项目 | 说明 |
| --- | --- |
| [guwan/my-seek](https://github.com/guwan/my-seek) | Spring Boot 4 + Spring AI 2 后端，提供鉴权、对话、联网搜索、向量库与知识库接口 |
| [guwan/my-seek-page](https://github.com/guwan/my-seek-page) | MySeek 官方宣传站 |

## 开源协议

本项目采用 [MIT License](./LICENSE) 开源协议。
