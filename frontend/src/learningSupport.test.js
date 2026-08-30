import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReviewPlan,
  createLearningExport,
  detectSupportedErrorType,
  getKnowledgeCard,
  getRecommendedPractice,
} from "./learningSupport.js";

test("根据报错信息返回可核验的知识依据", () => {
  const card = getKnowledgeCard("IndexError: list index out of range");

  assert.equal(card.errorType, "IndexError");
  assert.match(card.sourceUrl, /^https:\/\/docs\.python\.org\//);
  assert.match(card.verification, /len/);
});

test("错误类型识别忽略大小写", () => {
  assert.equal(detectSupportedErrorType("typeerror"), "TypeError");
  assert.equal(detectSupportedErrorType("循环中的索引错误"), "IndexError");
});

test("没有历史记录时返回入门计划", () => {
  const plan = buildReviewPlan([]);

  assert.equal(plan.totalRecords, 0);
  assert.equal(plan.focusErrorType, null);
  assert.equal(plan.steps.length, 3);
});

test("复习计划优先选择出现次数最多的错误类型", () => {
  const plan = buildReviewPlan([
    { errorType: "IndexError" },
    { errorType: "索引错误 IndexError" },
    { errorType: "SyntaxError" },
  ]);

  assert.equal(plan.focusErrorType, "IndexError");
  assert.match(plan.summary, /出现 2 次/);
  assert.equal(getRecommendedPractice(plan).id, "practice-index-error");
});

test("学习记录导出包含版本、时间和记录数量", () => {
  const records = [{ errorType: "TypeError" }];
  const result = createLearningExport(
    records,
    new Date("2026-08-30T08:00:00.000Z"),
  );

  assert.equal(result.schemaVersion, 1);
  assert.equal(result.recordCount, 1);
  assert.equal(result.exportedAt, "2026-08-30T08:00:00.000Z");
  assert.deepEqual(result.records, records);
});
