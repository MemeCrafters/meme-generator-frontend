# meme-generator-frontend

[meme-generator-rs](https://github.com/MemeCrafters/meme-generator-rs) 的 Web 前端界面，基于 Vue 3 + Vite + Tailwind CSS 构建。

## 功能

- 表情包浏览：网格布局展示所有模板，支持懒加载预览
- 表情包搜索：按关键词/标签搜索，随机标签推荐
- 表情包制作：上传图片、输入文字、调整选项参数，实时预览
- 结果下载：生成后可直接下载
- 后端地址切换：通过设置面板可连接不同的后端实例

## 快速开始

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- 正在运行的 [meme-generator-rs](https://github.com/MemeCrafters/meme-generator-rs) 后端服务（默认 `http://localhost:2233`）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器运行在 http://localhost:3000

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可直接部署为静态站点。

## 后端连接

前端默认连接 `http://localhost:2233` 作为后端地址。可以通过页面右上角的设置按钮（⚙）修改后端地址，配置会保存在浏览器 localStorage 中。

如需通过反向代理部署，可修改 `src/api.ts` 中的 `DEFAULT_BASE` 为相对路径（如 `/api`），并在 Nginx 等反向代理中配置转发规则。
