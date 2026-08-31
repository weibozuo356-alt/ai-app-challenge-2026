# BugMentor 中兴赛道发布验收报告

## 1. 验收结论

2026-08-30 对 BugMentor“专业课助教版”完成发布验收。代码质量门禁、线上前后端可用性、真实 AI 调用、安全边界、部署内容标记以及桌面/窄屏首屏视觉检查均通过，可以进入视频录制与正式提交阶段。

本报告区分“自动化/接口证据”和“人工视觉证据”，不把未执行的浏览器点击伪装成手工测试。核心交互在开发过程中已由参赛者实际操作确认，本轮再由 47 项自动化测试覆盖状态机与规则边界。

## 2. 版本与环境

- 验收日期：2026-08-30
- 发布基线提交：`3b8a7ef69f791b9bb5fcad50822b51aac7845dfc`
- 前端：https://ai-app-challenge-2026.vercel.app/
- 后端：https://bugmentor-api.onrender.com
- 仓库：https://github.com/weibozuo356-alt/ai-app-challenge-2026
- 基线 CI：https://github.com/weibozuo356-alt/ai-app-challenge-2026/actions/runs/33320913160（成功）

## 3. 验收结果

| 检查项 | 结果 | 证据 |
|---|---|---|
| 前端单元/状态测试 | 35/35 通过 | `npm test` |
| 前端静态检查 | 通过 | `npm run lint` |
| 前端生产构建 | 通过 | Vite 23 modules，JS gzip 69.05 kB |
| 后端单元/API 测试 | 12/12 通过 | `python -m unittest test_main -v` |
| 依赖完整性 | 通过 | `npm audit` 0 个高危漏洞；`pip check` 无冲突 |
| 前端在线访问 | HTTP 200 | 线上冒烟脚本 |
| 后端健康检查 | HTTP 200，`status=ok` | 线上冒烟脚本 |
| 真实 AI 一级提示 | HTTP 200，返回非空提示 | `smoke_test.py --exercise-ai` |
| 合法来源 CORS | 通过 | Vercel 正式域名预检 |
| 未知来源 CORS | 拒绝 | `https://evil.example` 预检返回 HTTP 400 |
| 空请求校验 | 通过 | `/api/debug` 空 JSON 返回 HTTP 422，不含密钥和堆栈 |
| 安全响应头 | 通过 | `no-store`、`nosniff`、`DENY`、请求 ID |
| 部署内容 | 通过 | 正式 JS 包含“专业课助教版”“个性化复习建议”标记 |
| 桌面首屏 | 通过 | `evidence/01-online-desktop.png` |
| 窄屏布局 | 通过 | 500 px 视口单栏布局，无横向内容裁切 |

## 4. 25 项用例覆盖关系

- TC-01—TC-15：既有人工流程验收 + 提示解锁、验证器、会话恢复和历史记录自动化回归。
- TC-16—TC-19：后端异常、安全响应、输入约束和 CORS 自动化/线上接口探测。
- TC-20：桌面与 500 px 窄屏视觉检查；录制视频时补充完整点击过程作为展示证据。
- TC-21—TC-25：知识卡、复习计划、迁移练习、JSON 导出和本地隐私边界自动化回归。

完整步骤和预期结果见 `../test-cases.md`。

## 5. 已知边界

1. 当前“修改后验证”是针对 IndexError、TypeError 和特定 SyntaxError 的静态规则模拟，不在服务器执行用户代码。
2. AI 提示依赖 DeepSeek；余额不足或服务异常时会返回安全错误，不影响本地历史记录。
3. 复习建议和 JSON 导出在浏览器本地完成，不把学习历史发送给 AI 后端。
4. Render 免费实例可能冷启动，演示前应提前打开后端根地址唤醒服务。

## 6. 提交前仅剩事项

- 录制中兴赛道演示视频，并按 `../live-demo-guide.md` 复核关键路径。
- 由参赛者确认报名状态、中期检查要求、最终入口和文件大小限制。
- 视频导出后，把最终 MP4 文件名和校验结果补入提交检查表。
