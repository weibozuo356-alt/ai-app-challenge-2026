export function normalizeCode(code) {
  return code
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean)
    .join("\n");
}
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findListDefinitions(code) {
  const definitions = [];
  const pattern = /([A-Za-z_]\w*)\s*=\s*\[([^\]]*)\]/g;

  for (const match of code.matchAll(pattern)) {
    const variableName = match[1];
    const content = match[2].trim();

    const length =
      content === ""
        ? 0
        : content.split(",").filter((item) => item.trim() !== "").length;

    definitions.push({
      variableName,
      length,
    });
  }

  return definitions;
}

function findLiteralIndexes(code, variableName) {
  const safeName = escapeRegExp(variableName);
  const pattern = new RegExp(
    `${safeName}\\s*\\[\\s*(-?\\d+)\\s*\\]`,
    "g",
  );

  return [...code.matchAll(pattern)].map((match) => Number(match[1]));
}

function isIndexValid(index, length) {
  return index >= -length && index < length;
}

export function validateIndexError(originalCode, currentCode, errorMessage) {
  if (!errorMessage.includes("IndexError")) {
    return {
      status: "unsupported",
      message: "当前错误类型暂不支持规则验证。",
    };
  }

  const normalizedOriginal = normalizeCode(originalCode);
  const normalizedCurrent = normalizeCode(currentCode);

  if (normalizedOriginal === normalizedCurrent) {
    return {
      status: "failed",
      message: "代码还没有发生实质修改，请先根据提示调整代码。",
    };
  }

  const originalLists = findListDefinitions(normalizedOriginal);

  for (const originalList of originalLists) {
    const originalIndexes = findLiteralIndexes(
      normalizedOriginal,
      originalList.variableName,
    );

    const hasOriginalOutOfRangeIndex = originalIndexes.some(
      (index) => !isIndexValid(index, originalList.length),
    );

    if (!hasOriginalOutOfRangeIndex) {
      continue;
    }

    const currentList = findListDefinitions(normalizedCurrent).find(
      (item) => item.variableName === originalList.variableName,
    );

    if (!currentList) {
      return {
        status: "inconclusive",
        message: "修改后的代码中找不到原来的列表，暂时无法确认是否修复。",
      };
    }

    const currentIndexes = findLiteralIndexes(
      normalizedCurrent,
      currentList.variableName,
    );

    if (currentIndexes.length === 0) {
      return {
        status: "inconclusive",
        message: "修改后的代码没有访问原列表，暂时无法确认是否真正修复。",
      };
    }

    const stillHasOutOfRangeIndex = currentIndexes.some(
      (index) => !isIndexValid(index, currentList.length),
    );

    if (stillHasOutOfRangeIndex) {
      return {
        status: "failed",
        message:
          "当前代码可能仍然访问了列表范围之外的位置，请重新检查列表长度和下标。",
      };
    }

    return {
      status: "passed",
      message:
        "根据当前规则检查，原来的索引越界问题已经修复。请完成学习复盘。",
    };
  }

  return {
    status: "inconclusive",
    message:
      "没有在原始代码中找到与报错对应的索引访问，请确认提交的是产生该报错的完整代码。",
  };
}

function findStringConcatenationVariables(code) {
  const variables = new Set();
  const stringLiteral = `(?:"[^"\\n]*"|'[^'\\n]*')`;
  const variable = "([A-Za-z_]\\w*)";
  const stringThenVariable = new RegExp(
    `${stringLiteral}\\s*\\+\\s*${variable}`,
    "g",
  );
  const variableThenString = new RegExp(
    `${variable}\\s*\\+\\s*${stringLiteral}`,
    "g",
  );

  for (const match of code.matchAll(stringThenVariable)) {
    variables.add(match[1]);
  }

  for (const match of code.matchAll(variableThenString)) {
    variables.add(match[1]);
  }

  return [...variables];
}

function hasSafeStringFormatting(code, variableName) {
  const safeName = escapeRegExp(variableName);
  const stringConversion = new RegExp(`str\\s*\\(\\s*${safeName}\\s*\\)`);
  const fString = new RegExp(
    `[fF](?:"[^"\\n]*\\{[^}]*\\b${safeName}\\b[^}]*\\}[^"\\n]*"|'[^'\\n]*\\{[^}]*\\b${safeName}\\b[^}]*\\}[^'\\n]*')`,
  );
  const commaSeparatedPrint = new RegExp(
    `print\\s*\\([^\\n)]*,\\s*${safeName}\\s*\\)`,
  );

  return (
    stringConversion.test(code) ||
    fString.test(code) ||
    commaSeparatedPrint.test(code)
  );
}

export function validateTypeError(originalCode, currentCode, errorMessage) {
  if (!errorMessage.includes("TypeError")) {
    return {
      status: "unsupported",
      message: "当前错误类型不适用 TypeError 验证规则。",
    };
  }

  const normalizedOriginal = normalizeCode(originalCode);
  const normalizedCurrent = normalizeCode(currentCode);

  if (normalizedOriginal === normalizedCurrent) {
    return {
      status: "failed",
      message: "代码还没有发生实质修改，请先根据提示调整代码。",
    };
  }

  const problemVariables = findStringConcatenationVariables(normalizedOriginal);

  if (problemVariables.length === 0) {
    return {
      status: "inconclusive",
      message:
        "没有在原始代码中找到字符串与变量直接拼接的表达式，暂时无法使用当前规则确认。",
    };
  }

  const remainingProblemVariables = findStringConcatenationVariables(
    normalizedCurrent,
  );

  if (
    problemVariables.some((variableName) =>
      remainingProblemVariables.includes(variableName),
    )
  ) {
    return {
      status: "failed",
      message:
        "当前代码中仍然存在字符串与原变量直接使用 + 拼接的写法，请继续检查两侧数据类型。",
    };
  }

  if (
    problemVariables.some((variableName) =>
      hasSafeStringFormatting(normalizedCurrent, variableName),
    )
  ) {
    return {
      status: "passed",
      message:
        "根据当前规则检查，原来的字符串拼接类型问题已经修复。请完成学习复盘。",
    };
  }

  return {
    status: "inconclusive",
    message:
      "原来的直接拼接已消失，但没有找到明确的类型转换或安全格式化写法，暂时无法确认修复结果。",
  };
}

const COLON_STATEMENT_PATTERN =
  /^(if|elif|else|for|while|def|class|try|except|finally|with|match|case)\b/;

function compactStatement(line) {
  return line.replace(/\s+/g, "").replace(/:$/, "");
}

function findStatementsMissingColon(code) {
  return normalizeCode(code)
    .split("\n")
    .filter(
      (line) =>
        COLON_STATEMENT_PATTERN.test(line) && !line.trimEnd().endsWith(":"),
    );
}

export function validateSyntaxError(originalCode, currentCode, errorMessage) {
  if (!errorMessage.includes("SyntaxError")) {
    return {
      status: "unsupported",
      message: "当前错误类型不适用 SyntaxError 验证规则。",
    };
  }

  const normalizedOriginal = normalizeCode(originalCode);
  const normalizedCurrent = normalizeCode(currentCode);

  if (normalizedOriginal === normalizedCurrent) {
    return {
      status: "failed",
      message: "代码还没有发生实质修改，请先根据提示调整代码。",
    };
  }

  const originalMissingColonStatements =
    findStatementsMissingColon(normalizedOriginal);

  if (originalMissingColonStatements.length === 0) {
    return {
      status: "inconclusive",
      message:
        "当前 SyntaxError 不属于已支持的“语句末尾缺少冒号”场景，暂时无法使用规则确认。",
    };
  }

  const currentMissingColonStatements =
    findStatementsMissingColon(normalizedCurrent);

  if (currentMissingColonStatements.length > 0) {
    return {
      status: "failed",
      message:
        "当前代码中仍有复合语句末尾缺少冒号，请检查 if、for、while 或函数定义所在行。",
    };
  }

  const currentLines = normalizedCurrent.split("\n");
  const allOriginalStatementsWereFixed = originalMissingColonStatements.every(
    (originalLine) => {
      const originalStatement = compactStatement(originalLine);

      return currentLines.some(
        (currentLine) =>
          currentLine.trimEnd().endsWith(":") &&
          compactStatement(currentLine) === originalStatement,
      );
    },
  );

  if (allOriginalStatementsWereFixed) {
    return {
      status: "passed",
      message:
        "根据当前规则检查，原来缺少冒号的语法问题已经修复。请完成学习复盘。",
    };
  }

  return {
    status: "inconclusive",
    message:
      "原来缺少冒号的语句已被删除或大幅改写，暂时无法确认程序意图是否仍然正确。",
  };
}

export function validateModifiedCode(originalCode, currentCode, errorMessage) {
  if (errorMessage.includes("IndexError")) {
    return validateIndexError(originalCode, currentCode, errorMessage);
  }

  if (errorMessage.includes("TypeError")) {
    return validateTypeError(originalCode, currentCode, errorMessage);
  }

  if (errorMessage.includes("SyntaxError")) {
    return validateSyntaxError(originalCode, currentCode, errorMessage);
  }

  return {
    status: "unsupported",
    message:
      "当前错误类型暂不支持自动验证，请继续根据提示人工检查修改结果。",
  };
}
