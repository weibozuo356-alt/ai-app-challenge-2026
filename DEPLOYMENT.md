# BugMentor 在线部署说明

推荐架构：Vercel 托管 React 前端，Render 运行 FastAPI 后端。

## 一、部署后端到 Render

### 使用 Blueprint

1. 登录 Render，并连接 GitHub。
2. 选择 **New > Blueprint**。
3. 选择仓库 `ai-app-challenge-2026`。
4. Render 会读取仓库根目录的 `render.yaml` 创建 `bugmentor-api`。
5. 在 Render 后台填写两个标记为 `sync: false` 的变量：

```env
DEEPSEEK_API_KEY=真实的 DeepSeek API 密钥
FRONTEND_ORIGINS=https://你的前端域名.vercel.app
```

首次创建后，如果尚未获得 Vercel 域名，可以先临时填写预计域名，前端部署完成后再回来修改并重新部署。

### 后端验收

部署结束后打开：

```text
https://你的后端域名.onrender.com/health
```

预期返回：

```json
{"status":"ok","service":"bugmentor-api"}
```

API 文档地址：

```text
https://你的后端域名.onrender.com/docs
```

## 二、部署前端到 Vercel

1. 登录 Vercel，并选择 **Add New > Project**。
2. 导入同一个 GitHub 仓库。
3. 将 **Root Directory** 设置为 `frontend`。
4. Vercel 会从 `frontend/vercel.json` 读取构建配置。
5. 添加生产环境变量：

```env
VITE_API_BASE_URL=https://你的后端域名.onrender.com
```

6. 点击部署，获得 `https://xxx.vercel.app` 前端网址。

## 三、回填正式前端域名

回到 Render 的 `bugmentor-api`：

1. 打开 **Environment**。
2. 把 `FRONTEND_ORIGINS` 修改为最终 Vercel 地址，不要在结尾添加 `/`。
3. 如需同时允许多个正式域名，使用英文逗号分隔。
4. 保存并重新部署。

示例：

```env
FRONTEND_ORIGINS=https://bugmentor.vercel.app,https://www.example.com
```

## 四、上线验收清单

- [ ] `/health` 返回 HTTP 200
- [ ] Vercel 首页可以正常打开
- [ ] IndexError、TypeError、SyntaxError 三个演示案例可以载入
- [ ] 点击开始调试后能获得 DeepSeek 一级提示
- [ ] 提交判断、获取下一级提示正常
- [ ] 修改代码后验证状态正确
- [ ] 验证通过后学习复盘解锁
- [ ] 刷新后当前调试会话恢复
- [ ] 保存和删除历史学习记录正常
- [ ] 手机浏览器布局可以正常使用
- [ ] 浏览器控制台没有 CORS 错误

## 五、故障排查

### 前端提示无法连接后端

依次检查：

1. Render `/health` 是否能打开。
2. Vercel 的 `VITE_API_BASE_URL` 是否为完整 HTTPS 后端地址。
3. Render 的 `FRONTEND_ORIGINS` 是否与浏览器地址栏中的前端来源完全一致。
4. 修改 Vercel 环境变量后是否重新部署前端。

### 后端返回 503

检查 Render 日志和以下变量：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`
- DeepSeek 账户是否有可用余额

### 第一次访问很慢

Render 免费 Web Service 闲置后会休眠。正式演示前先访问一次 `/health`，等待服务唤醒。

## 六、回滚方案

如果新版本部署失败：

1. 在 Render 或 Vercel 后台选择上一个成功部署并执行回滚。
2. 或在 GitHub 中撤销有问题的提交，再由两个平台自动重新部署。
3. 回滚后重新检查 `/health` 和三个演示案例。

本项目不使用线上数据库，因此回滚代码不会造成数据库迁移或用户数据损坏；浏览器中的学习记录仍保存在用户本地。

## 七、运行日志与排查目标

Render 会收集后端标准输出。BugMentor 的服务端日志使用稳定事件名和请求 ID，且不会记录用户代码、报错全文、DeepSeek 密钥或完整请求体。

上线后遇到问题时，优先回答三个问题：

1. 请求是否到达后端，最终状态码和耗时是多少？查看 `http_request_completed`。
2. AI 服务失败发生在哪一次请求？使用响应头 `X-Request-ID` 对应日志中的 `request_id`。
3. 故障属于哪类异常？查看 `ai_hint_failed` 的 `error_type`，不要在日志中输出密钥或用户代码。

每次正式发布后至少检查一次 Render Logs，确认健康检查和真实调试请求都有对应日志。
