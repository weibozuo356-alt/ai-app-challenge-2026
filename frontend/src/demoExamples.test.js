import test from "node:test";
import assert from "node:assert/strict";

import { DEMO_EXAMPLES, getDemoExample } from "./demoExamples.js";

test("演示案例 ID 唯一且字段完整", () => {
  const ids = DEMO_EXAMPLES.map((example) => example.id);

  assert.equal(new Set(ids).size, ids.length);

  for (const example of DEMO_EXAMPLES) {
    assert.ok(example.name.trim());
    assert.ok(example.code.trim());
    assert.ok(example.expectedResult.trim());
    assert.ok(example.errorMessage.trim());
  }
});

test("可以根据 ID 获取 SyntaxError 演示案例", () => {
  const example = getDemoExample("syntax-error");

  assert.equal(example.errorMessage, "SyntaxError: expected ':'");
  assert.match(example.code, /if age >= 18/);
});
