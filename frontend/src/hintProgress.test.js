import test from "node:test";
import assert from "node:assert/strict";

import { canRevealAnswer, canUnlockNextHint } from "./hintProgress.js";

test("当前等级没有成功反馈时不能解锁下一级提示", () => {
  assert.equal(
    canUnlockNextHint({ hintLevel: 1, feedbackLevel: 0 }),
    false,
  );
  assert.equal(
    canUnlockNextHint({ hintLevel: 1, feedbackLevel: 1 }),
    true,
  );
});

test("完整答案只能在第四级反馈成功后解锁", () => {
  assert.equal(canRevealAnswer({ hintLevel: 3, feedbackLevel: 3 }), false);
  assert.equal(canRevealAnswer({ hintLevel: 4, feedbackLevel: 0 }), false);
  assert.equal(canRevealAnswer({ hintLevel: 4, feedbackLevel: 4 }), true);
});
