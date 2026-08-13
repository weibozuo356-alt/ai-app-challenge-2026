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
4. 用户可以逐级获取更多提示
5. 用户解决问题后进入复盘流程
6. 系统记录错误原因、知识点和改进方法

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

## 当前说明

当前版本已经完成 React 前端、FastAPI 后端与 DeepSeek API 的通信。用户提交代码、预期结果、报错信息和提示等级后，后端会调用 DeepSeek 动态生成对应等级的调试提示。

BugMentor 使用五级提示控制答案揭示的程度：前四级逐步引导用户观察、定位和理解问题，第五级才提供完整错误原因、修改方案和避免方法。

用户代码只作为文本交给模型分析，不会在后端直接执行。DeepSeek API 密钥保存在本地 `.env` 文件中，不会提交到 GitHub。

用户完成调试后，可以填写错误类型、知识点、错误原因和避免方法。学习记录保存在当前浏览器的 `localStorage` 中，刷新页面后仍然存在，最多保留最近 20 条。当前版本尚未实现账号系统和跨设备同步。

后端包含自动化测试，覆盖接口正常响应、AI 调用成功、AI 服务异常、空代码和非法提示等级。测试使用 Mock 替代真实模型，不消耗 DeepSeek 调用额度。

## 产品原则

AI 的目标不是替用户修好代码，而是帮助用户学会自己修复代码。

## 开发日志

- [Day 1：完成产品原型与分级提示流程](docs/dev-log/2026-08-11.md)
- [Day 2：理解技术栈并跑通前后端通信](docs/dev-log/2026-08-12.md)
- [Day 3：接入 DeepSeek，完成自动化测试与学习记录闭环](docs/dev-log/2026-08-13.md)
