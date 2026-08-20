import test from "node:test";
import assert from "node:assert/strict";

import {
  validateIndexError,
  validateModifiedCode,
  validateSyntaxError,
  validateTypeError,
} from "./validator.js";

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

const originalTypeErrorCode = `
age = 18
print("年龄：" + age)
`;

const typeErrorMessage =
  'TypeError: can only concatenate str (not "int") to str';

test("TypeError 未修改代码时验证失败", () => {
  const result = validateTypeError(
    originalTypeErrorCode,
    originalTypeErrorCode,
    typeErrorMessage,
  );

  assert.equal(result.status, "failed");
});

test("使用 str 转换后 TypeError 验证成功", () => {
  const result = validateModifiedCode(
    originalTypeErrorCode,
    'age = 18\nprint("年龄：" + str(age))',
    typeErrorMessage,
  );

  assert.equal(result.status, "passed");
});

test("使用 f-string 后 TypeError 验证成功", () => {
  const result = validateModifiedCode(
    originalTypeErrorCode,
    'age = 18\nprint(f"年龄：{age}")',
    typeErrorMessage,
  );

  assert.equal(result.status, "passed");
});

test("使用 print 逗号分隔参数后 TypeError 验证成功", () => {
  const result = validateModifiedCode(
    originalTypeErrorCode,
    'age = 18\nprint("年龄：", age)',
    typeErrorMessage,
  );

  assert.equal(result.status, "passed");
});

test("仍然直接拼接原变量时 TypeError 验证失败", () => {
  const result = validateModifiedCode(
    originalTypeErrorCode,
    'age = 20\nprint("年龄：" + age)',
    typeErrorMessage,
  );

  assert.equal(result.status, "failed");
});

test("删除原来的输出语句不能误判 TypeError 修复成功", () => {
  const result = validateModifiedCode(
    originalTypeErrorCode,
    "age = 18",
    typeErrorMessage,
  );

  assert.equal(result.status, "inconclusive");
});

test("验证分发器对未知错误返回不支持", () => {
  const result = validateModifiedCode(
    "print(missing_name)",
    "print('ok')",
    "NameError: name 'missing_name' is not defined",
  );

  assert.equal(result.status, "unsupported");
});

const originalSyntaxErrorCode = `
age = 18
if age >= 18
    print("已成年")
`;

const syntaxErrorMessage = "SyntaxError: expected ':'";

test("SyntaxError 未修改代码时验证失败", () => {
  const result = validateSyntaxError(
    originalSyntaxErrorCode,
    originalSyntaxErrorCode,
    syntaxErrorMessage,
  );

  assert.equal(result.status, "failed");
});

test("为条件语句补上冒号后 SyntaxError 验证成功", () => {
  const fixedCode = `
age = 18
if age >= 18:
    print("已成年")
`;
  const result = validateModifiedCode(
    originalSyntaxErrorCode,
    fixedCode,
    syntaxErrorMessage,
  );

  assert.equal(result.status, "passed");
});

test("仍有复合语句缺少冒号时 SyntaxError 验证失败", () => {
  const modifiedCode = `
age = 20
if age >= 18
    print("已成年")
`;
  const result = validateModifiedCode(
    originalSyntaxErrorCode,
    modifiedCode,
    syntaxErrorMessage,
  );

  assert.equal(result.status, "failed");
});

test("删除出错条件语句不能误判 SyntaxError 修复成功", () => {
  const result = validateModifiedCode(
    originalSyntaxErrorCode,
    'age = 18\nprint("已成年")',
    syntaxErrorMessage,
  );

  assert.equal(result.status, "inconclusive");
});

test("其他 SyntaxError 场景不会被缺冒号规则误判", () => {
  const result = validateModifiedCode(
    'print("hello"',
    'print("hello")',
    "SyntaxError: '(' was never closed",
  );

  assert.equal(result.status, "inconclusive");
});
