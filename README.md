# BugMentor

[![CI](https://github.com/weibozuo356-alt/ai-app-challenge-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/weibozuo356-alt/ai-app-challenge-2026/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.1.0--beta-244584)](CHANGELOG.md)

不会直接告诉你答案的 AI Debug 教练。

## 项目介绍

很多编程初学者遇到报错后，会直接让 AI 给出修改后的代码。虽然问题暂时解决了，但用户并没有真正理解错误原因，下一次遇到类似问题时仍然无法独立解决。

BugMentor 不会立即公布答案，而是通过逐级提示，引导用户自己观察报错、定位代码并理解错误原理。

## 目标用户

正在学习 Python、能够编写简单代码，但缺乏独立 Debug 能力的大学生和编程初学者。

## 核心流程

1. 用户提交代码、预期结果和报错信息
2. 系统检查用户是否输入代码
3. 从第一级提示开始引导用户
4. 用户可以回答 AI 的引导问题，并获得判断与追问
5. 用户可以逐级获取更多提示，并修改代码
6. 系统使用确定性规则模拟验证修改后的代码
7. 验证成功后进入复盘；代码再次修改后旧结论失效
8. 系统记录错误原因、知识点和改进方法

## 当前已实现

- [x] 完成竞品调研
- [x] 确定产品方向与 MVP
- [x] 完成纸面低保真原型
- [x] 搭建 React 前端项目
- [x] 完成第一版页面
- [x] 实现代码输入检查
- [x] 实现五级提示交互流程
- [x] 实现调试完成与学习复盘状态
- [x] 搭建 FastAPI 后端服务
- [x] 实现前端与后端的数据通信
- [x] 由后端返回五级模拟提示
- [x] 增加后端输入长度与提示等级校验
- [x] 通过正式构建检查
- [x] 接入 DeepSeek 真实 AI 分析
- [x] 根据代码和提示等级动态生成提示
- [x] 增加 AI 请求超时与安全错误处理
- [x] 区分后端不可用与 AI 服务异常
- [x] 增加后端自动化测试
- [x] 在浏览器本地保存用户学习记录
- [x] 展示最近 20 条历史学习记录
- [x] 支持学生提交自己的判断并获得 AI 反馈
- [x] 支持修改代码后重新开始调试
- [x] 对一级初始提示隐藏代码和报错细节，避免提前泄露答案
- [x] 使用 12 项后端自动化测试保护接口、健康检查、安全头与 CORS
- [x] 将前端 API 地址改为环境变量配置
- [x] 为学习记录生成稳定的唯一 ID
- [x] 支持删除单条学习记录和确认后清空全部记录
- [x] 实现 IndexError 直接列表索引的确定性规则验证
- [x] 实现等待验证、验证失败、无法判断和验证成功状态
- [x] 验证成功后解锁复盘，再次修改后重新锁定
- [x] 使用 7 项前端自动化测试保护验证规则
- [x] 保存当前调试会话并在刷新后恢复代码、提示和验证状态
- [x] 成功验证后再次修改代码会使旧结论失效并重新锁定复盘
- [x] 支持一键重置当前调试会话且不影响历史学习记录
- [x] 实现字符串拼接类 TypeError 的确定性规则验证
- [x] 支持识别 `str()`、f-string 和 `print()` 逗号分隔三种修复方式
- [x] 使用 20 项前端自动化测试保护会话恢复和验证规则
- [x] 实现条件语句缺少冒号的 SyntaxError 确定性验证
- [x] 增加 IndexError、TypeError、SyntaxError 三个一键演示案例
- [x] 防止通过删除出错语句伪装成 SyntaxError 修复成功
- [x] 使用 27 项前端自动化测试保护验证、恢复和演示数据
- [x] 增加 Render Blueprint 与 Vercel 构建配置
- [x] 增加生产环境 CORS 白名单和独立健康检查接口
- [x] 增加不记录用户代码与密钥的后端请求日志
- [x] 完成上线验收清单、故障排查与回滚说明
- [x] 增加 GitHub Actions 前后端质量门禁
- [x] 增加生产安全响应头、AI 请求超时与 React 错误兜底页
- [x] 增加隐私说明、安全说明、更新日志与线上自动验收脚本
- [ ] 部署在线演示版本

## 提示等级

1. 观察报错类型
2. 定位相关代码
3. 检查变量、类型、缩进和边界
4. 梳理程序执行思路
5. 查看错误原因和修改建议

## 技术栈

- React
- JavaScript
- Vite
- CSS
- Python
- FastAPI
- Pydantic
- Git 与 GitHub
- DeepSeek API
- OpenAI Python SDK
- python-dotenv

## 本地运行

### 启动后端

创建并安装后端环境：

```bash
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```

在 `backend` 目录中根据 `.env.example` 创建 `.env`，并填写自己的 DeepSeek API 密钥：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

启动 FastAPI：

```bash
backend/.venv/Scripts/python.exe -m fastapi dev backend/main.py
```

后端默认运行在 `http://127.0.0.1:8000`。


### 启动前端

进入前端目录：

```bash
cd frontend
```

安装依赖：

```bash
npm install
```

根据 `.env.example` 创建 `.env.local`，配置后端地址：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

`.env.local` 只用于当前电脑，不会提交到 GitHub；`.env.example` 只保留配置项示例，不包含密钥。

启动开发服务器：

```bash
npm run dev
```

根据终端提示，在浏览器中打开本地网址。

## 正式构建

```bash
cd frontend
npm run build
```

## 在线部署

项目已经包含：

- 根目录 `render.yaml`：创建 Render FastAPI Web Service
- `frontend/vercel.json`：配置 Vercel 的 Vite 构建
- `/health`：Render 健康检查接口
- `FRONTEND_ORIGINS`：生产环境前端来源白名单
- `.github/workflows/ci.yml`：推送与拉取请求自动运行测试、检查和构建

完整操作步骤、验收清单和回滚方案见[在线部署说明](DEPLOYMENT.md)。生产密钥只能填写在 Render 环境变量中，不能提交到 GitHub。

数据处理方式见[隐私说明](PRIVACY.md)，安全边界和已知限制见[安全说明](SECURITY.md)，版本变化见[更新日志](CHANGELOG.md)。

## 自动化测试

运行前端验证器测试：

```bash
cd frontend
npm test
```

运行后端接口测试：

```bash
cd backend
.venv/Scripts/python.exe -m unittest test_main -v
```

## 当前说明

当前版本已经完成 React 前端、FastAPI 后端与 DeepSeek API 的通信。用户提交代码、预期结果、报错信息和提示等级后，后端会调用 DeepSeek 动态生成对应等级的调试提示。用户还可以提交自己的判断，AI 会在当前提示等级内判断思路并继续追问。

对于直接列表索引导致的 IndexError，前端可以使用确定性规则比较原始代码和修改后的代码，返回等待验证、验证失败、无法判断或验证成功状态。`numbers[2]` 与 `numbers[-1]` 等合法修复可以通过；只修改格式、删除访问语句或换成另一个越界下标不会被误判成功。

字符串与整数直接拼接导致的 TypeError 也已加入规则验证。系统能够识别使用 `str()` 显式转换、f-string 格式化和 `print()` 逗号分隔参数等常见修复；仅删除原输出语句不会被误判为修复成功。验证规则不会执行用户的 Python 代码，只覆盖当前明确支持的静态文本场景。

对于报错信息为 `SyntaxError` 且复合语句末尾缺少冒号的场景，系统能够检查 `if`、`for`、`while`、函数定义等语句是否补回了冒号。直接删除原语句或改写成无法确认意图的代码只会返回“暂时无法判断”，不会误判为成功。

页面提供 IndexError、TypeError 和 SyntaxError 三个快速演示案例。载入案例会自动填写代码、预期结果和报错信息，方便产品验收与比赛演示；如果页面已有调试内容，会先向用户确认再替换。

当前调试会话会保存在浏览器 `localStorage` 中，包括原始代码、当前代码、最近验证代码、预期结果、报错信息、提示等级、教练消息、验证状态和复盘解锁状态。刷新页面不会重新请求 DeepSeek，而是直接恢复保存的状态。成功验证后如果再次修改代码，旧验证结论会立即失效，复盘区域也会重新锁定；重置当前调试会话不会删除已经保存的历史学习记录。

BugMentor 使用五级提示控制答案揭示的程度：前四级逐步引导用户观察、定位和理解问题，第五级才提供完整错误原因、修改方案和避免方法。

用户代码只作为文本交给模型分析，不会在后端直接执行。DeepSeek API 密钥保存在本地 `.env` 文件中，不会提交到 GitHub。

用户完成调试后，可以填写错误类型、知识点、错误原因和避免方法。学习记录保存在当前浏览器的 `localStorage` 中，刷新页面后仍然存在，最多保留最近 20 条。每条记录具有唯一 ID，支持单条删除，也可以在二次确认后清空全部记录。当前版本尚未实现账号系统和跨设备同步。

前端包含 27 项自动化测试，保护 IndexError、TypeError、SyntaxError、调试会话恢复、演示案例数据、损坏数据降级和重置清理等场景。后端包含 12 项自动化测试，覆盖接口正常响应、AI 调用成功、AI 服务异常、空代码、非法提示等级、学生回答转发、超长回答拒绝、健康检查、安全响应头、请求 ID 和 CORS 白名单。后端测试使用 Mock 替代真实模型，不消耗 DeepSeek 调用额度。

## 产品原则

AI 的目标不是替用户修好代码，而是帮助用户学会自己修复代码。

## 开发日志

- [Day 1：完成产品原型与分级提示流程](docs/dev-log/2026-08-11.md)
- [Day 2：理解技术栈并跑通前后端通信](docs/dev-log/2026-08-12.md)
- [Day 3：接入 DeepSeek，完成自动化测试与学习记录闭环](docs/dev-log/2026-08-13.md)
- [Day 4：完成学生追问、修改重试与分级提示硬约束](docs/dev-log/2026-08-14.md)
- [Day 5：验证秒悟原型并完善配置与学习记录管理](docs/dev-log/2026-08-16.md)
- [Day 6：完成 IndexError 验证闭环并梳理双版本差异](docs/dev-log/2026-08-17.md)
- [Day 7—8：完成调试会话恢复与 TypeError 验证闭环](docs/dev-log/2026-08-20.md)
- [Day 9：扩展 SyntaxError 验证与比赛演示案例](docs/dev-log/2026-08-20-day-9.md)
- [Day 10：完成线上部署准备与可观测性](docs/dev-log/2026-08-20-deployment.md)

## 双版本说明

BugMentor 当前同时维护秒悟平台原型与 GitHub 主项目。两者共享同一产品目标，但技术实现和当前能力不同。开发与比赛准备时以[双版本差异与同步计划](docs/meoo-github-gap.md)为准，避免把某一版本已实现的功能误认为另一版本也已同步。
