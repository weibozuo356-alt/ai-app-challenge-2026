import { normalizeCode } from "./validator.js";

export const DEBUG_SESSION_KEY = "bugmentor-debug-session";
export const DEBUG_SESSION_VERSION = 1;

export const EMPTY_DEBUG_SESSION = {
  code: "",
  originalCode: "",
  verifiedCode: "",
  expectedResult: "",
  errorMessage: "",
  hintLevel: 0,
  coachMessage: "提交代码后，我会从第一级提示开始引导你。",
  verification: {
    status: "none",
    message: "",
  },
  isSolved: false,
};

const VERIFICATION_STATUSES = new Set([
  "none",
  "passed",
  "failed",
  "inconclusive",
  "unsupported",
]);

function isString(value) {
  return typeof value === "string";
}

function isValidVerification(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    VERIFICATION_STATUSES.has(value.status) &&
    isString(value.message)
  );
}

export function sanitizeDebugSession(value) {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const session = {
    ...EMPTY_DEBUG_SESSION,
    code: isString(value.code) ? value.code : "",
    originalCode: isString(value.originalCode) ? value.originalCode : "",
    verifiedCode: isString(value.verifiedCode) ? value.verifiedCode : "",
    expectedResult: isString(value.expectedResult)
      ? value.expectedResult
      : "",
    errorMessage: isString(value.errorMessage) ? value.errorMessage : "",
    hintLevel:
      Number.isInteger(value.hintLevel) &&
      value.hintLevel >= 0 &&
      value.hintLevel <= 5
        ? value.hintLevel
        : 0,
    coachMessage: isString(value.coachMessage)
      ? value.coachMessage
      : EMPTY_DEBUG_SESSION.coachMessage,
    verification: isValidVerification(value.verification)
      ? value.verification
      : EMPTY_DEBUG_SESSION.verification,
    isSolved: value.isSolved === true,
  };

  if (session.code.trim() === "" || session.originalCode.trim() === "") {
    session.hintLevel = 0;
    session.verifiedCode = "";
    session.verification = { ...EMPTY_DEBUG_SESSION.verification };
    session.isSolved = false;
  }

  const verifiedCodeMatchesCurrent =
    session.verifiedCode !== "" &&
    normalizeCode(session.verifiedCode) === normalizeCode(session.code);

  if (
    session.verification.status === "passed" &&
    !verifiedCodeMatchesCurrent
  ) {
    session.verification = {
      status: "none",
      message: "代码已修改，等待重新验证。",
    };
    session.isSolved = false;
  }

  if (session.verification.status !== "passed") {
    session.isSolved = false;
  }

  return session;
}

export function loadDebugSession(storage = localStorage) {
  try {
    const rawValue = storage.getItem(DEBUG_SESSION_KEY);

    if (!rawValue) {
      return { ...EMPTY_DEBUG_SESSION };
    }

    const savedValue = JSON.parse(rawValue);

    if (savedValue.version !== DEBUG_SESSION_VERSION) {
      return { ...EMPTY_DEBUG_SESSION };
    }

    return sanitizeDebugSession(savedValue.session) || {
      ...EMPTY_DEBUG_SESSION,
    };
  } catch {
    return { ...EMPTY_DEBUG_SESSION };
  }
}

export function saveDebugSession(session, storage = localStorage) {
  const safeSession = sanitizeDebugSession(session);

  if (!safeSession || safeSession.originalCode.trim() === "") {
    storage.removeItem(DEBUG_SESSION_KEY);
    return;
  }

  storage.setItem(
    DEBUG_SESSION_KEY,
    JSON.stringify({
      version: DEBUG_SESSION_VERSION,
      session: safeSession,
    }),
  );
}

export function clearDebugSession(storage = localStorage) {
  storage.removeItem(DEBUG_SESSION_KEY);
}
