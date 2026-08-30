const KNOWLEDGE_CARDS = {
  IndexError: {
    errorType: "IndexError",
    title: "列表索引与边界",
    knowledgePoint: "Python 列表从 0 开始计数，合法索引范围由列表长度决定。",
    rule:
      "长度为 n 的列表，正索引范围是 0 到 n-1，负索引范围是 -n 到 -1。",
    verification:
      "先用 len(列表) 确认元素个数，再把实际下标与合法范围逐项比较。",
    sourceTitle: "Python 官方教程：列表",
    sourceUrl:
      "https://docs.python.org/zh-cn/3/tutorial/introduction.html#lists",
  },
  TypeError: {
    errorType: "TypeError",
    title: "字符串与数据类型",
    knowledgePoint: "字符串拼接要求操作数类型兼容。",
    rule:
      "字符串与整数不能直接使用 + 拼接；可以显式转换、使用 f-string，或让 print 接收多个参数。",
    verification:
      "分别写出运算符两侧表达式的类型，确认转换发生在拼接之前。",
    sourceTitle: "Python 官方教程：字符串",
    sourceUrl:
      "https://docs.python.org/zh-cn/3/tutorial/introduction.html#text",
  },
  SyntaxError: {
    errorType: "SyntaxError",
    title: "复合语句与冒号",
    knowledgePoint: "Python 复合语句的语句头必须符合固定语法。",
    rule:
      "if、for、while、def 等复合语句的语句头通常以冒号结尾，随后是缩进代码块。",
    verification:
      "定位解释器指出的行，并同时检查该行结尾的冒号与下一行缩进。",
    sourceTitle: "Python 语言参考：复合语句",
    sourceUrl: "https://docs.python.org/zh-cn/3/reference/compound_stmts.html",
  },
};

const PRACTICE_EXERCISES = {
  IndexError: {
    id: "practice-index-error",
    title: "迁移练习：读取最后一次成绩",
    goal: "不直接复制刚才的答案，重新判断另一个列表的最后一个合法位置。",
    code: "scores = [72, 85, 91, 66]\nprint(scores[4])",
    expectedResult: "输出最后一次成绩 66",
    errorMessage: "IndexError: list index out of range",
  },
  TypeError: {
    id: "practice-type-error",
    title: "迁移练习：输出课程得分",
    goal: "选择一种清晰的字符串格式化方式，正确输出整数成绩。",
    code: 'score = 95\nprint("课程得分：" + score)',
    expectedResult: "输出：课程得分：95",
    errorMessage:
      'TypeError: can only concatenate str (not "int") to str',
  },
  SyntaxError: {
    id: "practice-syntax-error",
    title: "迁移练习：遍历课程编号",
    goal: "检查复合语句的语句头和缩进结构。",
    code: 'for course_id in [1, 2, 3]\n    print(course_id)',
    expectedResult: "依次输出 1、2、3",
    errorMessage: "SyntaxError: expected ':'",
  },
};

const ERROR_TYPE_ALIASES = {
  IndexError: ["indexerror", "index error", "索引"],
  TypeError: ["typeerror", "type error", "类型"],
  SyntaxError: ["syntaxerror", "syntax error", "语法"],
};

export function detectSupportedErrorType(text = "") {
  const normalizedText = text.toLowerCase();

  return Object.entries(ERROR_TYPE_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalizedText.includes(alias)),
  )?.[0] || null;
}

export function getKnowledgeCard(errorMessage = "") {
  const errorType = detectSupportedErrorType(errorMessage);
  return errorType ? KNOWLEDGE_CARDS[errorType] : null;
}

function normalizeRecordErrorType(record) {
  return detectSupportedErrorType(record?.errorType || "") || "其他错误";
}

export function buildReviewPlan(records = []) {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      totalRecords: 0,
      focusErrorType: null,
      headline: "完成第一次调试后生成复习计划",
      summary: "保存学习复盘后，系统会根据历史错误类型安排迁移练习。",
      steps: [
        "先完成一个演示案例并通过修改验证。",
        "用自己的话填写根本原因和预防措施。",
        "保存记录后完成系统推荐的迁移练习。",
      ],
    };
  }

  const counts = new Map();
  for (const record of records) {
    const errorType = normalizeRecordErrorType(record);
    counts.set(errorType, (counts.get(errorType) || 0) + 1);
  }

  const [focusErrorType, focusCount] = [...counts.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0];
  const supportedFocus = KNOWLEDGE_CARDS[focusErrorType]
    ? focusErrorType
    : null;

  return {
    totalRecords: records.length,
    focusErrorType: supportedFocus,
    headline: `本阶段重点：${focusErrorType}`,
    summary: `最近 ${records.length} 条记录中，${focusErrorType} 出现 ${focusCount} 次。建议先巩固高频错误，再进行间隔复习。`,
    steps: [
      `今天：不看旧答案，复述一次 ${focusErrorType} 的触发条件。`,
      supportedFocus
        ? "下一次学习：完成下方迁移练习，并走完判断—修改—验证闭环。"
        : "下一次学习：重新选择一道同知识点题目，记录输入、现象和结论。",
      "本周结束前：回看预防措施，检查新代码中是否再次出现同类模式。",
    ],
  };
}

export function getRecommendedPractice(reviewPlan) {
  if (!reviewPlan?.focusErrorType) {
    return null;
  }

  return PRACTICE_EXERCISES[reviewPlan.focusErrorType] || null;
}

export function createLearningExport(records, exportedAt = new Date()) {
  return {
    schemaVersion: 1,
    product: "BugMentor",
    exportedAt: exportedAt.toISOString(),
    recordCount: records.length,
    records,
  };
}
