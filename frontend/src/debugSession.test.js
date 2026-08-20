import test from "node:test";
import assert from "node:assert/strict";

import {
  DEBUG_SESSION_KEY,
  EMPTY_DEBUG_SESSION,
  clearDebugSession,
  loadDebugSession,
  saveDebugSession,
} from "./debugSession.js";

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function createSession(overrides = {}) {
  return {
    ...EMPTY_DEBUG_SESSION,
    code: "numbers = [10, 20, 30]\nprint(numbers[2])",
    originalCode: "numbers = [10, 20, 30]\nprint(numbers[3])",
    expectedResult: "输出 30",
    errorMessage: "IndexError: list index out of range",
    hintLevel: 3,
    coachMessage: "检查列表长度和下标。",
    ...overrides,
  };
}

test("保存后可以完整恢复调试会话", () => {
  const storage = createMemoryStorage();
  const session = createSession({
    verifiedCode: "numbers = [10, 20, 30]\nprint(numbers[2])",
    verification: { status: "passed", message: "验证通过" },
    isSolved: true,
  });

  saveDebugSession(session, storage);

  assert.deepEqual(loadDebugSession(storage), session);
});

test("损坏的 JSON 不会阻止页面启动", () => {
  const storage = createMemoryStorage();
  storage.setItem(DEBUG_SESSION_KEY, "{invalid-json");

  assert.deepEqual(loadDebugSession(storage), EMPTY_DEBUG_SESSION);
});

test("旧版本数据安全降级为空会话", () => {
  const storage = createMemoryStorage();
  storage.setItem(
    DEBUG_SESSION_KEY,
    JSON.stringify({ version: 0, session: createSession() }),
  );

  assert.deepEqual(loadDebugSession(storage), EMPTY_DEBUG_SESSION);
});

test("成功验证后再修改代码不会恢复旧成功状态", () => {
  const storage = createMemoryStorage();
  saveDebugSession(
    createSession({
      code: "numbers = [10, 20, 30]\nprint(numbers[4])",
      verifiedCode: "numbers = [10, 20, 30]\nprint(numbers[2])",
      verification: { status: "passed", message: "验证通过" },
      isSolved: true,
    }),
    storage,
  );

  const restored = loadDebugSession(storage);

  assert.equal(restored.verification.status, "none");
  assert.equal(restored.isSolved, false);
});

test("只增加空行和注释不会让已经通过的验证失效", () => {
  const storage = createMemoryStorage();
  saveDebugSession(
    createSession({
      code: "numbers = [10, 20, 30]\n\n# 已修复\nprint(numbers[2])",
      verifiedCode: "numbers = [10, 20, 30]\nprint(numbers[2])",
      verification: { status: "passed", message: "验证通过" },
      isSolved: true,
    }),
    storage,
  );

  const restored = loadDebugSession(storage);

  assert.equal(restored.verification.status, "passed");
  assert.equal(restored.isSolved, true);
});

test("重置会删除保存的调试会话", () => {
  const storage = createMemoryStorage();
  saveDebugSession(createSession(), storage);
  clearDebugSession(storage);

  assert.deepEqual(loadDebugSession(storage), EMPTY_DEBUG_SESSION);
});
