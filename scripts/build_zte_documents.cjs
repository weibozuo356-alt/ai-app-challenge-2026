const fs = require("node:fs");
const path = require("node:path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "competition", "zte");
const OUTPUT_DIR = path.join(SOURCE_DIR, "final-package");
const FONT = "Microsoft YaHei";
const MONO = "Consolas";
const NAVY = "173B72";
const BLUE = "24579A";
const LIGHT_BLUE = "EAF1FA";
const LIGHT_GRAY = "F3F5F7";
const BORDER = "C8D3E1";

const documents = [
  {
    source: "technical-document.md",
    output: "BugMentor-中兴赛道-技术文档.docx",
    label: "技术报告",
  },
  {
    source: "test-cases.md",
    output: "BugMentor-中兴赛道-测试报告.docx",
    label: "测试报告",
  },
  {
    source: "compliance-statement.md",
    output: "BugMentor-中兴赛道-合规说明.docx",
    label: "合规说明",
  },
];

function textRun(text, options = {}) {
  return new TextRun({ text, font: options.mono ? MONO : FONT, ...options });
}

function inlineRuns(text) {
  const runs = [];
  const tokenPattern = /(`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/[^\s，。；]+)/g;
  let cursor = 0;
  for (const match of text.matchAll(tokenPattern)) {
    if (match.index > cursor) runs.push(textRun(text.slice(cursor, match.index)));
    const token = match[0];
    if (token.startsWith("`")) {
      runs.push(textRun(token.slice(1, -1), { mono: true, color: "8B2F2F", size: 20 }));
    } else if (token.startsWith("[")) {
      const parts = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      runs.push(
        new ExternalHyperlink({
          link: parts[2],
          children: [textRun(parts[1], { color: BLUE, underline: {} })],
        }),
      );
    } else {
      runs.push(
        new ExternalHyperlink({
          link: token,
          children: [textRun(token, { color: BLUE, underline: {} })],
        }),
      );
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length) runs.push(textRun(text.slice(cursor)));
  return runs.length ? runs : [textRun(text)];
}

function normalParagraph(text, options = {}) {
  return new Paragraph({
    children: inlineRuns(text),
    alignment: options.alignment,
    spacing: { after: options.after ?? 120, line: 360 },
    indent: options.indent,
    keepNext: options.keepNext,
  });
}

function tableFromRows(rows) {
  const columnCount = Math.max(...rows.map((row) => row.length));
  const width = Math.floor(9360 / columnCount);
  const borders = {
    top: { style: BorderStyle.SINGLE, size: 6, color: BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER },
    left: { style: BorderStyle.SINGLE, size: 6, color: BORDER },
    right: { style: BorderStyle.SINGLE, size: 6, color: BORDER },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
  };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders,
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          cantSplit: true,
          tableHeader: rowIndex === 0,
          children: Array.from({ length: columnCount }, (_, colIndex) =>
            new TableCell({
              width: { size: width, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              shading:
                rowIndex === 0
                  ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" }
                  : rowIndex % 2 === 0
                    ? { type: ShadingType.CLEAR, fill: LIGHT_GRAY, color: "auto" }
                    : undefined,
              margins: { top: 90, bottom: 90, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: inlineRuns(row[colIndex] || "").map((run) => {
                    if (rowIndex !== 0 || !(run instanceof TextRun)) return run;
                    return textRun(run.options?.text || row[colIndex] || "", {
                      bold: true,
                      color: "FFFFFF",
                      size: 19,
                    });
                  }),
                  spacing: { after: 0, line: 300 },
                }),
              ],
            }),
          ),
        }),
    ),
  });
}

function parseTable(lines, start) {
  const rows = [];
  let index = start;
  while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
    const cells = lines[index]
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) rows.push(cells);
    index += 1;
  }
  return { table: tableFromRows(rows), next: index };
}

function codeBlock(lines, language) {
  const title = language === "mermaid" ? "流程/架构示意（文本表达）" : language || "代码";
  return [
    new Paragraph({
      children: [textRun(title, { bold: true, color: NAVY, size: 18 })],
      shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE, color: "auto" },
      spacing: { before: 80, after: 0 },
      indent: { left: 180, right: 180 },
    }),
    ...lines.map(
      (line, idx) =>
        new Paragraph({
          children: [textRun(line || " ", { mono: true, size: 18 })],
          shading: { type: ShadingType.CLEAR, fill: LIGHT_GRAY, color: "auto" },
          spacing: { after: idx === lines.length - 1 ? 140 : 0, line: 280 },
          indent: { left: 180, right: 180 },
        }),
    ),
  ];
}

function cover(label) {
  return [
    new Paragraph({ spacing: { before: 1400, after: 280 } }),
    new Paragraph({
      children: [textRun("BugMentor", { bold: true, color: NAVY, size: 56 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }),
    new Paragraph({
      children: [textRun(`中兴赛道命题二 · ${label}`, { bold: true, color: BLUE, size: 34 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 520 },
    }),
    new Paragraph({
      children: [textRun("专业课助教智能体", { size: 26, color: "43546B" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 900 },
    }),
    new Paragraph({ children: [textRun("负责人：左伟博", { size: 22 })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [textRun("学校：南京理工大学", { size: 22 })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [textRun("团队：BugMentor（个人参赛）", { size: 22 })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [textRun("版本：1.1 · 2026-09-05", { size: 22 })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [textRun("提交版", { bold: true, color: NAVY, size: 22 })], alignment: AlignmentType.CENTER, pageBreakBefore: false }),
    new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),
  ];
}

function markdownToChildren(markdown, label) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const children = cover(label);
  let index = 0;
  let inCode = false;
  let codeLanguage = "";
  let codeLines = [];
  let paragraphLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    children.push(normalParagraph(paragraphLines.join(" ").replace(/\s{2,}/g, " ")));
    paragraphLines = [];
  };

  while (index < lines.length) {
    const raw = lines[index];
    const line = raw.trimEnd();
    if (line.startsWith("```")) {
      flushParagraph();
      if (!inCode) {
        inCode = true;
        codeLanguage = line.slice(3).trim();
        codeLines = [];
      } else {
        children.push(...codeBlock(codeLines, codeLanguage));
        inCode = false;
      }
      index += 1;
      continue;
    }
    if (inCode) {
      codeLines.push(raw);
      index += 1;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(raw) && index + 1 < lines.length && /^\s*\|\s*:?-/.test(lines[index + 1])) {
      flushParagraph();
      const parsed = parseTable(lines, index);
      children.push(parsed.table, new Paragraph({ spacing: { after: 100 } }));
      index = parsed.next;
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      if (heading[1].length === 1) {
        index += 1;
        continue;
      }
      const level = Math.min(heading[1].length - 1, 3);
      children.push(
        new Paragraph({
          children: inlineRuns(heading[2]),
          heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][level - 1],
          keepNext: true,
        }),
      );
      index += 1;
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      children.push(
        new Paragraph({
          children: inlineRuns((bullet || numbered)[1]),
          ...(bullet ? { bullet: { level: 0 } } : { numbering: { reference: "numbered-list", level: 0 } }),
          spacing: { after: 80, line: 340 },
        }),
      );
      index += 1;
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
    } else if (/^---+$/.test(line.trim())) {
      flushParagraph();
    } else {
      paragraphLines.push(line.trim().replace(/\s{2,}$/, ""));
    }
    index += 1;
  }
  flushParagraph();
  if (inCode) children.push(...codeBlock(codeLines, codeLanguage));
  return children;
}

function makeDocument(markdown, label) {
  return new Document({
    creator: "BugMentor",
    title: `BugMentor 中兴赛道 ${label}`,
    subject: "中兴赛道命题二专业课助教智能体参赛材料",
    description: "BugMentor 中兴赛道正式提交材料",
    keywords: "BugMentor, Python, 调试学习, 专业课助教智能体",
    numbering: {
      config: [
        {
          reference: "numbered-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 520, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: FONT, size: 21, color: "18243A" }, paragraph: { spacing: { line: 360 } } },
        heading1: { run: { font: FONT, size: 32, bold: true, color: NAVY }, paragraph: { spacing: { before: 260, after: 150 }, keepNext: true } },
        heading2: { run: { font: FONT, size: 27, bold: true, color: BLUE }, paragraph: { spacing: { before: 220, after: 120 }, keepNext: true } },
        heading3: { run: { font: FONT, size: 23, bold: true, color: "344C6B" }, paragraph: { spacing: { before: 160, after: 100 }, keepNext: true } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 960, right: 1100, bottom: 960, left: 1100 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [textRun(`BugMentor · 中兴赛道 · ${label}`, { color: "66758A", size: 18 })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [textRun("第 ", { size: 18, color: "66758A" }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "66758A" }), textRun(" 页", { size: 18, color: "66758A" })],
              }),
            ],
          }),
        },
        children: markdownToChildren(markdown, label),
      },
    ],
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const item of documents) {
    const markdown = fs.readFileSync(path.join(SOURCE_DIR, item.source), "utf8");
    const doc = makeDocument(markdown, item.label);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUTPUT_DIR, item.output), buffer);
    process.stdout.write(`${item.output}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
