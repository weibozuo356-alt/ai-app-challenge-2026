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