export const DEMO_EXAMPLES = [
  {
    id: "index-error",
    name: "IndexError：列表索引越界",
    code: "numbers = [10, 20, 30]\nprint(numbers[3])",
    expectedResult: "输出最后一个数字 30",
    errorMessage: "IndexError: list index out of range",
  },
  {
    id: "type-error",
    name: "TypeError：字符串与整数拼接",
    code: 'age = 18\nprint("年龄：" + age)',
    expectedResult: "输出：年龄：18",
    errorMessage:
      'TypeError: can only concatenate str (not "int") to str',
  },
  {
    id: "syntax-error",
    name: "SyntaxError：条件语句缺少冒号",
    code: 'age = 18\nif age >= 18\n    print("已成年")',
    expectedResult: "输出：已成年",
    errorMessage: "SyntaxError: expected ':'",
  },
];

export function getDemoExample(exampleId) {
  return DEMO_EXAMPLES.find((example) => example.id === exampleId) || null;
}
