# BugMentor 中兴赛道材料包

本目录为“专业课助教智能体”命题的非视频正式提交材料，版本日期为 2026-08-30。

## 正式文件

- `BugMentor-中兴赛道-技术文档.docx` / `.pdf`
- `BugMentor-中兴赛道-测试报告.docx` / `.pdf`
- `BugMentor-中兴赛道-合规说明.docx` / `.pdf`
- `acceptance-report.md`：发布后线上验收记录与证据索引
- `evidence/`：线上关键流程截图

## 线上资源

- 在线应用：https://ai-app-challenge-2026.vercel.app/
- 后端服务：https://bugmentor-api.onrender.com
- API 文档：https://bugmentor-api.onrender.com/docs
- GitHub：https://github.com/weibozuo356-alt/ai-app-challenge-2026

## 尚未包含

演示视频不在本材料包中，将在录制、剪辑和字幕校对完成后单独补入。赛务报名表和个人联系方式也不进入公开仓库。

## 文档重建

Markdown 源文件更新后，可执行：

```powershell
$env:NODE_PATH='C:\Users\86152\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node scripts\build_zte_documents.cjs
```

生成 Word 后再使用 Microsoft Word 或 LibreOffice 导出同名 PDF，并进行逐页视觉检查。
