import test from "node:test";
import assert from "node:assert/strict";

import { validateIndexError } from "./validator.js";

const originalCode = `
numbers = [10, 20, 30]
print(numbers[3])
`;

const errorMessage = "IndexError: list index out of range";

test("未修改代码时验证失败", () => {
  const result = validateIndexError(
    originalCode,
    originalCode,
    errorMessage,
  );

  assert.equal(result.status, "failed");
});

test("只修改空格和注释时验证失败", () => {
  const modifiedCode = `
numbers = [10, 20, 30]

# 只修改格式
print( numbers[3] )
`;

  const result = validateIndexError(
    originalCode,
    modifiedCode,
    errorMessage,
  );

  assert.equal(result.status, "failed");
});

test("使用最后一个合法正索引时验证成功", () => {
  const modifiedCode = `
numbers = [10, 20, 30]
print(numbers[2])
`;

  const result = validateIndexError(
    originalCode,
    modifiedCode,
    errorMessage,
  );

  assert.equal(result.status, "passed");
});

test("使用负索引时验证成功", () => {
  const modifiedCode = `
numbers = [10, 20, 30]
print(numbers[-1])
`;

  const result = validateIndexError(
    originalCode,
    modifiedCode,
    errorMessage,
  );

  assert.equal(result.status, "passed");
});

test("修改成另一个越界下标时仍然失败", () => {
  const modifiedCode = `
numbers = [10, 20, 30]
print(numbers[4])
`;

  const result = validateIndexError(
    originalCode,
    modifiedCode,
    errorMessage,
  );

  assert.equal(result.status, "failed");
});

test("删除列表访问时不能误判成功", () => {
  const modifiedCode = `
numbers = [10, 20, 30]
print("删除了原来的访问")
`;

  const result = validateIndexError(
    originalCode,
    modifiedCode,
    errorMessage,
  );

  assert.equal(result.status, "inconclusive");
});

test("非 IndexError 不使用当前规则", () => {
  const result = validateIndexError(
    originalCode,
    originalCode,
    "TypeError: unsupported operand type",
  );

  assert.equal(result.status, "unsupported");
});