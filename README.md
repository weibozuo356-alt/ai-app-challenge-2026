# BugMentor

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
- [x] 使用 7 项后端自动化测试保护核心接口
- [x] 将前端 API 地址改为环境变量配置
- [x] 为学习记录生成稳定的唯一 ID
- [x] 支持删除单条学习记录和确认后清空全部记录
- [x] 实现 IndexError 直接列表索引的确定性规则验证
- [x] 实现等待验证、验证失败、无法判断和验证成功状态
- [x] 验证成功后解锁复盘，再次修改后重新锁定
- [x] 使用 7 项前端自动化测试保护验证规则
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

对于直接列表索引导致的 IndexError，前端还可以使用确定性规则比较原始代码和修改后的代码，返回等待验证、验证失败、无法判断或验证成功状态。`numbers[2]` 与 `numbers[-1]` 等合法修复可以通过；只修改格式、删除访问语句或换成另一个越界下标不会被误判成功。该验证不会执行 Python，只覆盖当前明确支持的规则场景。

BugMentor 使用五级提示控制答案揭示的程度：前四级逐步引导用户观察、定位和理解问题，第五级才提供完整错误原因、修改方案和避免方法。

用户代码只作为文本交给模型分析，不会在后端直接执行。DeepSeek API 密钥保存在本地 `.env` 文件中，不会提交到 GitHub。

用户完成调试后，可以填写错误类型、知识点、错误原因和避免方法。学习记录保存在当前浏览器的 `localStorage` 中，刷新页面后仍然存在，最多保留最近 20 条。每条记录具有唯一 ID，支持单条删除，也可以在二次确认后清空全部记录。当前版本尚未实现账号系统和跨设备同步。

前端包含 7 项验证器自动化测试，保护 IndexError 的成功、失败、无法判断和不支持场景。后端包含 7 项自动化测试，覆盖接口正常响应、AI 调用成功、AI 服务异常、空代码、非法提示等级、学生回答转发和超长回答拒绝。后端测试使用 Mock 替代真实模型，不消耗 DeepSeek 调用额度。

## 产品原则

AI 的目标不是替用户修好代码，而是帮助用户学会自己修复代码。

## 开发日志

- [Day 1：完成产品原型与分级提示流程](docs/dev-log/2026-08-11.md)
- [Day 2：理解技术栈并跑通前后端通信](docs/dev-log/2026-08-12.md)
- [Day 3：接入 DeepSeek，完成自动化测试与学习记录闭环](docs/dev-log/2026-08-13.md)
- [Day 4：完成学生追问、修改重试与分级提示硬约束](docs/dev-log/2026-08-14.md)
- [Day 5：验证秒悟原型并完善配置与学习记录管理](docs/dev-log/2026-08-16.md)
- [Day 6：完成 IndexError 验证闭环并梳理双版本差异](docs/dev-log/2026-08-17.md)

## 双版本说明

BugMentor 当前同时维护秒悟平台原型与 GitHub 主项目。两者共享同一产品目标，但技术实现和当前能力不同。开发与比赛准备时以[双版本差异与同步计划](docs/meoo-github-gap.md)为准，避免把某一版本已实现的功能误认为另一版本也已同步。
