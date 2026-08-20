# Day 10：完成线上部署准备与可观测性

## 今日目标

把“只能在本机运行”的 BugMentor 改造成可以安全部署到 Vercel 与 Render 的版本，同时让部署后的故障能够被定位和回滚。

## 完成内容

### 1. Render 后端部署配置

仓库根目录新增 `render.yaml`，声明：

- 后端根目录为 `backend`
- 安装命令为 `pip install -r requirements.txt`
- 使用 Uvicorn 监听 Render 提供的 `$PORT`
- 免费 Web Service 方案
- `/health` 健康检查
- GitHub 提交后自动部署
- DeepSeek 密钥和正式前端来源由后台安全填写

### 2. Vercel 前端部署配置

新增 `frontend/vercel.json`，固定 Vite 框架、`npm run build` 构建命令和 `dist` 输出目录。

正式部署时只需添加：

```env
VITE_API_BASE_URL=https://后端域名.onrender.com
```

### 3. 生产环境 CORS

后端不再只允许固定的 `http://localhost:5173`，而是从 `FRONTEND_ORIGINS` 读取逗号分隔的精确白名单。

本地默认允许：

```text
http://localhost:5173
http://127.0.0.1:5173
```

部署后只允许填写的 Vercel 正式域名。未知来源的预检请求会被拒绝，避免使用通配符 `*` 扩大访问范围。

### 4. 健康检查

新增：

```text
GET /health
```

它不调用 DeepSeek，只判断 FastAPI 服务本身是否正常，Render 可以用它判断新版本是否成功启动。

### 5. 最小化生产日志

每个后端请求都会获得请求 ID，并在响应头中返回 `X-Request-ID`。日志记录：

- 稳定事件名
- 请求 ID
- HTTP 方法与路径
- 状态码与耗时
- AI 故障的异常类型

日志不会记录用户代码、完整请求体、报错全文或 API 密钥。

### 6. 部署与回滚手册

新增 `DEPLOYMENT.md`，包括：

- Render Blueprint 创建步骤
- Vercel 项目创建步骤
- 环境变量填写位置
- 部署后完整验收清单
- CORS、503 和冷启动排查方法
- 从上一个成功版本回滚的方法

### 7. GitHub Actions 质量门禁

新增 `.github/workflows/ci.yml`。以后每次推送到 `main` 或创建拉取请求时，GitHub 会自动执行：

- 前端依赖安装、27 项单元测试、ESLint、生产构建和依赖安全审计
- 后端依赖安装、一致性检查和 10 项接口测试

这意味着部署平台接收到新提交前，仓库会先给出一份可重复的自动检查结果。CI 不读取生产环境密钥，后端测试使用模拟 AI 响应。

## 新理解的概念

### 健康检查（Health Check）

平台定期访问一个轻量接口，确认服务进程仍能响应。健康检查不应该依赖 DeepSeek 等外部服务，否则外部 API 短暂故障会被误判成整个后端死亡。

### 基础设施即代码（Infrastructure as Code）

`render.yaml` 把部署命令、服务类型和环境变量名称保存在 Git 中，避免每次凭记忆手动填写。

### CORS 白名单

浏览器会检查前端来源是否被后端允许。白名单必须填写完整的协议、主机和端口；生产环境不使用 `*`。

### 请求关联 ID（Correlation ID）

浏览器报告一次失败时，可以用响应头里的请求 ID 在 Render 日志中找到同一次请求，避免在大量交错日志中猜测。

### 回滚（Rollback）

如果新版本上线失败，恢复到上一个已知可用部署。项目当前没有线上数据库，因此代码回滚不会涉及数据库结构或用户数据迁移。

## 验收结果

- 前端自动化测试：27 项通过
- 后端自动化测试：10 项通过
- 前端生产构建：通过
- ESLint：通过
- npm 生产依赖审计：0 个已知漏洞
- Python 依赖一致性检查：通过
- Git 差异格式检查：通过

## 仍需用户在平台完成的安全步骤

1. 在 Render 初次创建时填写真实 DeepSeek API 密钥。
2. 在 Vercel 填写部署后端得到的公开网址。
3. 把最终 Vercel 域名回填到 Render 的 CORS 白名单。

这些值属于账号和生产密钥，不能预先写入 GitHub。
