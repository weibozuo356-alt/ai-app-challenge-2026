# BugMentor 前端

这里是 BugMentor 的 React + Vite 单页应用。完整的产品说明、技术架构和开发日志请阅读[仓库根目录 README](../README.md)。

## 本地运行

```bash
npm ci
npm run dev
```

根据 `.env.example` 创建不提交到 Git 的 `.env.local`：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 质量检查

```bash
npm test
npm run lint
npm run build
```
