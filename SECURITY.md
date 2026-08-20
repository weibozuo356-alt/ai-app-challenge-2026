# BugMentor 安全说明

## 威胁边界

1. 浏览器输入：代码、报错、预期结果和学生判断均视为不可信输入。
2. FastAPI 接口：使用 Pydantic 限制字段类型、长度和提示等级。
3. DeepSeek：用户内容只作为待分析数据，模型输出只作为 React 文本渲染，不进入 SQL、Shell、`eval` 或 HTML 注入接口。
4. 本地存储：只保存调试进度和学习复盘，不保存登录令牌或生产密钥。

## 已实施控制

- 精确 CORS 来源白名单
- DeepSeek 密钥仅从服务端环境变量读取
- 用户代码不写入服务端日志
- AI 超时、通用错误响应和请求 ID
- 请求字段长度上限和提示等级范围校验
- `Cache-Control: no-store` 保护 AI 接口响应
- CSP、禁止 iframe、MIME 嗅探防护、权限策略和 Referrer Policy
- 前端 React 自动转义，不使用 `dangerouslySetInnerHTML`
- npm 生产依赖审计、Python 依赖一致性检查和 GitHub Actions 质量门禁
- Dependabot 每周检查 npm 与 pip 更新

## 已知限制

- 当前公开演示没有用户账号或授权模型，请勿存放私人代码。
- 当前尚未设置请求频率限制；正式开放给大量用户前，需要根据 DeepSeek 额度和预期并发确定阈值。
- 规则验证器是静态模拟，不会在沙箱中执行 Python。

## 报告问题

请不要在公开 Issue 中粘贴 API 密钥、个人信息或真实私有代码。报告时提供复现步骤、预期行为和不含敏感数据的最小示例。
