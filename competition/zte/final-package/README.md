# BugMentor 中兴赛道材料包

本目录为中兴赛道命题二“专业课助教智能体”的公开非视频正式材料，版本日期为 2026-09-05。

## 正式文件

- `BugMentor-中兴赛道-技术文档.docx` / `.pdf`：内容按官方技术报告十章结构编排
- `BugMentor-中兴赛道-测试报告.docx` / `.pdf`：命题二评测用例与测试证据
- `BugMentor-中兴赛道-合规说明.docx` / `.pdf`
- `acceptance-report.md`：发布后线上验收记录与证据索引
- `evidence/`：线上关键流程截图
- `../live-demo-guide.md`：6 分钟现场演示与离线兜底方案
- `../defense-qa.md`：答辩高频问题及建议回答

## 线上资源

- 在线应用：https://ai-app-challenge-2026.vercel.app/
- 后端服务：https://bugmentor-api.onrender.com
- API 文档：https://bugmentor-api.onrender.com/docs
- GitHub：https://github.com/weibozuo356-alt/ai-app-challenge-2026

## 尚未包含

演示视频不在本材料包中，将在录制、剪辑和字幕校对完成后单独补入。报名表、待签字合规承诺书等含个人信息的官方材料在本机私有目录生成，不进入公开仓库。

## 文档重建

Markdown 源文件更新后，可执行：

```powershell
$env:NODE_PATH='C:\Users\86152\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node scripts\build_zte_documents.cjs
```

生成 Word 后再使用 Microsoft Word 或 LibreOffice 导出同名 PDF，并进行逐页视觉检查。
