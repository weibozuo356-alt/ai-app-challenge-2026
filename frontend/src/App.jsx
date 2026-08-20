import { useEffect, useState } from "react";
import "./App.css";
import {
  EMPTY_DEBUG_SESSION,
  clearDebugSession,
  loadDebugSession,
  saveDebugSession,
} from "./debugSession";
import { DEMO_EXAMPLES, getDemoExample } from "./demoExamples";
import { normalizeCode, validateModifiedCode } from "./validator";

const STORAGE_KEY = "bugmentor-learning-records";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(
    /\/+$/,
    "",
  );
const API_TIMEOUT_MS = 30000;

function isValidLearningRecord(record) {
  return (
    record !== null &&
    typeof record === "object" &&
    typeof record.errorType === "string" &&
    typeof record.knowledgePoint === "string" &&
    typeof record.errorCause === "string" &&
    typeof record.prevention === "string" &&
    typeof record.savedAt === "string" &&
    !Number.isNaN(Date.parse(record.savedAt))
  );
}

function ensureRecordId(record) {
  const hasValidId = typeof record.id === "string" && record.id.trim() !== "";

  return {
    ...record,
    id: hasValidId ? record.id : `legacy-${record.savedAt}`,
  };
}

function loadLearningRecords() {
  try {
    const savedRecords = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(savedRecords)) {
      return [];
    }

    return savedRecords
      .filter(isValidLearningRecord)
      .map(ensureRecordId)
      .slice(-20);
  } catch {
    return [];
  }
}

function App() {
  const [restoredSession] = useState(loadDebugSession);
  const [code, setCode] = useState(restoredSession.code);
  const [originalCode, setOriginalCode] = useState(
    restoredSession.originalCode,
  );
  const [verifiedCode, setVerifiedCode] = useState(
    restoredSession.verifiedCode,
  );
  const [verification, setVerification] = useState(
    restoredSession.verification,
  );
  const [expectedResult, setExpectedResult] = useState(
    restoredSession.expectedResult,
  );
  const [errorMessage, setErrorMessage] = useState(
    restoredSession.errorMessage,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(restoredSession.hintLevel);
  const [isSolved, setIsSolved] = useState(restoredSession.isSolved);
  const [studentResponse, setStudentResponse] = useState("");
  const [coachMessage, setCoachMessage] = useState(
    restoredSession.coachMessage,
  );

  const [errorType, setErrorType] = useState("");
  const [knowledgePoint, setKnowledgePoint] = useState("");
  const [errorCause, setErrorCause] = useState("");
  const [prevention, setPrevention] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [learningRecords, setLearningRecords] = useState(loadLearningRecords);
  const [selectedExampleId, setSelectedExampleId] = useState(
    DEMO_EXAMPLES[0].id,
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    try {
      saveDebugSession({
        code,
        originalCode,
        verifiedCode,
        expectedResult,
        errorMessage,
        hintLevel,
        coachMessage,
        verification,
        isSolved,
      });
    } catch {
      // 调试会话保存失败不应阻止用户继续使用当前页面。
    }
  }, [
    code,
    originalCode,
    verifiedCode,
    expectedResult,
    errorMessage,
    hintLevel,
    coachMessage,
    verification,
    isSolved,
    isLoading,
  ]);

  function handleCodeChange(nextCode) {
    setCode(nextCode);

    const hasBeenVerified = verifiedCode !== "";
    const differsFromVerifiedCode =
      normalizeCode(nextCode) !== normalizeCode(verifiedCode);

    if (hasBeenVerified && differsFromVerifiedCode) {
      setVerification({
        status: "none",
        message: "代码已修改，等待重新验证。",
      });
      setIsSolved(false);
      setSaveMessage("");
    }
  }
  function hasCode() {
    if (code.trim() === "") {
      setCoachMessage("请先在左侧粘贴需要调试的 Python 代码。");
      return false;
    }

    return true;
  }

  async function requestHint(level, responseText = "") {
    const previousHint = coachMessage;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      API_TIMEOUT_MS,
    );

    setIsLoading(true);
    setCoachMessage(responseText ? "正在判断你的思路……" : "正在分析你的代码……");

    try {
      const response = await fetch(`${API_BASE_URL}/api/debug`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          code: code,
          expected_result: expectedResult,
          error_message: errorMessage,
          hint_level: level,
          student_response: responseText,
          previous_hint: responseText ? previousHint : "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `请求失败，状态码：${response.status}`);
      }

      setHintLevel(data.hint_level);
      setCoachMessage(data.hint);

      if (responseText) {
        setStudentResponse("");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setCoachMessage("AI 教练响应超时，请稍后重试。");
      } else if (error instanceof TypeError) {
        setCoachMessage("无法连接后端，请确认后端正在运行。");
      } else {
        setCoachMessage(error.message || "请求失败，请稍后再试。");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }

  async function startDebugging() {
    if (!hasCode()) {
      return;
    }

    setOriginalCode(code);
    setVerifiedCode("");
    setVerification({
      status: "none",
      message: "",
    });
    setIsSolved(false);
    setStudentResponse("");
    setSaveMessage("");

    await requestHint(1);
  }
  function verifyModifiedCode() {
    if (originalCode === "") {
      setVerification({
        status: "inconclusive",
        message: "请先开始调试，再根据提示修改代码。",
      });
      return;
    }

    const result = validateModifiedCode(originalCode, code, errorMessage);

    setVerifiedCode(code);
    setVerification(result);
    setIsSolved(result.status === "passed");
    setSaveMessage("");
  }

  async function submitStudentResponse() {
    if (!hasCode()) {
      return;
    }

    const responseText = studentResponse.trim();

    if (hintLevel === 0) {
      setCoachMessage("请先点击“开始侦查 Bug”获得第一条提示。");
      return;
    }

    if (responseText === "") {
      setCoachMessage("请先写下你对问题的判断，再提交给 AI 教练。");
      return;
    }

    await requestHint(hintLevel, responseText);
  }

  async function showNextHint() {
    if (!hasCode()) {
      return;
    }

    if (hintLevel >= 4) {
      setCoachMessage(
        "你已经看完四级引导提示，请先尝试修改代码，实在无法解决时再查看答案。",
      );
      return;
    }

    const nextLevel = hintLevel === 0 ? 1 : hintLevel + 1;
    await requestHint(nextLevel);
  }

  async function showAnswer() {
    if (!hasCode()) {
      return;
    }

    await requestHint(5);
  }

  function markAsSolved() {
    if (!hasCode()) {
      return;
    }

    setCoachMessage(
      "很好，你已经形成了自己的判断。请修改左侧代码并点击“重新验证修改后的代码”；验证通过后会自动解锁学习复盘。",
    );
  }

  function resetDebugging() {
    clearDebugSession();
    setCode(EMPTY_DEBUG_SESSION.code);
    setOriginalCode(EMPTY_DEBUG_SESSION.originalCode);
    setVerifiedCode(EMPTY_DEBUG_SESSION.verifiedCode);
    setExpectedResult(EMPTY_DEBUG_SESSION.expectedResult);
    setErrorMessage(EMPTY_DEBUG_SESSION.errorMessage);
    setHintLevel(EMPTY_DEBUG_SESSION.hintLevel);
    setCoachMessage(EMPTY_DEBUG_SESSION.coachMessage);
    setVerification({ ...EMPTY_DEBUG_SESSION.verification });
    setIsSolved(EMPTY_DEBUG_SESSION.isSolved);
    setStudentResponse("");
    setErrorType("");
    setKnowledgePoint("");
    setErrorCause("");
    setPrevention("");
    setSaveMessage("调试会话已重置。历史学习记录不会受到影响。");
  }

  function loadSelectedExample() {
    const example = getDemoExample(selectedExampleId);

    if (!example) {
      return;
    }

    const hasCurrentWork =
      code.trim() !== "" || expectedResult.trim() !== "" || hintLevel > 0;

    if (
      hasCurrentWork &&
      !window.confirm("载入案例会替换当前调试内容，是否继续？")
    ) {
      return;
    }

    clearDebugSession();
    setCode(example.code);
    setOriginalCode("");
    setVerifiedCode("");
    setExpectedResult(example.expectedResult);
    setErrorMessage(example.errorMessage);
    setHintLevel(0);
    setCoachMessage(EMPTY_DEBUG_SESSION.coachMessage);
    setVerification({ ...EMPTY_DEBUG_SESSION.verification });
    setIsSolved(false);
    setStudentResponse("");
    setErrorType("");
    setKnowledgePoint("");
    setErrorCause("");
    setPrevention("");
    setSaveMessage("");
  }

  function saveLearningRecord() {
    const recordFields = [errorType, knowledgePoint, errorCause, prevention];

    if (recordFields.some((field) => field.trim() === "")) {
      setSaveMessage("请填写完整的学习复盘后再保存。");
      return;
    }

    const newRecord = {
      id: crypto.randomUUID(),
      errorType: errorType.trim(),
      knowledgePoint: knowledgePoint.trim(),
      errorCause: errorCause.trim(),
      prevention: prevention.trim(),
      savedAt: new Date().toISOString(),
    };

    const updatedRecords = [...learningRecords, newRecord].slice(-20);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));

      setLearningRecords(updatedRecords);
      setSaveMessage(
        `学习记录已保存，当前浏览器共有 ${updatedRecords.length} 条记录。`,
      );
    } catch {
      setSaveMessage("保存失败，请检查浏览器是否允许本地存储。");
    }
  }

  function deleteLearningRecord(recordId) {
    const confirmed = window.confirm(
      "确定要删除这条学习记录吗？删除后无法恢复。",
    );

    if (!confirmed) {
      return;
    }

    const updatedRecords = learningRecords.filter(
      (record) => record.id !== recordId,
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
      setLearningRecords(updatedRecords);
      setSaveMessage("学习记录已删除。");
    } catch {
      setSaveMessage("删除失败，请检查浏览器是否允许本地存储。");
    }
  }

  function clearLearningRecords() {
    if (learningRecords.length === 0) {
      setSaveMessage("当前没有可以清空的学习记录。");
      return;
    }

    const confirmed = window.confirm(
      `确定要清空全部 ${learningRecords.length} 条学习记录吗？此操作无法恢复。`,
    );

    if (!confirmed) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      setLearningRecords([]);
      setSaveMessage("全部学习记录已清空。");
    } catch {
      setSaveMessage("清空失败，请检查浏览器是否允许本地存储。");
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p>AI DEBUG COACH</p>
          <h1>BugMentor</h1>
          <span>不会直接告诉你答案的 AI Debug 教练</span>
        </div>

        <span>Python MVP</span>
      </header>

      <section className="workspace">
        <article className="panel">
          <h2>提交你的代码</h2>

          <label htmlFor="language">编程语言</label>
          <select id="language">
            <option>Python</option>
          </select>

          <label htmlFor="demo-example">快速演示案例</label>
          <div className="example-loader">
            <select
              id="demo-example"
              value={selectedExampleId}
              onChange={(event) => setSelectedExampleId(event.target.value)}
            >
              {DEMO_EXAMPLES.map((example) => (
                <option key={example.id} value={example.id}>
                  {example.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={loadSelectedExample}>
              载入案例
            </button>
          </div>

          <label htmlFor="code">代码</label>
          <textarea
            id="code"
            rows="12"
            placeholder="在这里粘贴你的 Python 代码……"
            value={code}
            onChange={(event) => handleCodeChange(event.target.value)}
          />

          <label htmlFor="expected">预期结果</label>
          <textarea
            id="expected"
            rows="3"
            placeholder="你希望代码产生什么结果？"
            value={expectedResult}
            onChange={(event) => setExpectedResult(event.target.value)}
          />

          <label htmlFor="error">报错信息</label>
          <textarea
            id="error"
            rows="3"
            placeholder="粘贴报错信息；没有报错可以留空"
            value={errorMessage}
            onChange={(event) => setErrorMessage(event.target.value)}
          />

          <button
            type="button"
            onClick={startDebugging}
            disabled={isLoading}
          >
            {isLoading
              ? "正在分析……"
              : hintLevel > 0
                ? "重新提交为新问题"
                : "开始侦查 Bug"}
          </button>

          <button
            className="reset-debug-button"
            type="button"
            onClick={resetDebugging}
            disabled={isLoading}
          >
            重置当前调试
          </button>

          {hintLevel > 0 && (
            <button
              className="verify-button"
              type="button"
              onClick={verifyModifiedCode}
              disabled={isLoading}
            >
              重新验证修改后的代码
            </button>
          )}

          {verification.message && (
            <div
              className={`verification-card verification-${verification.status}`}
            >
              <strong>
                {verification.status === "passed"
                  ? "验证通过"
                  : verification.status === "failed"
                    ? "验证未通过"
                    : verification.status === "inconclusive"
                      ? "暂时无法判断"
                      : "等待重新验证"}
              </strong>

              <p>{verification.message}</p>

              <small>
                当前结果来自预设规则模拟，代码未在服务器执行。目前支持
                IndexError、字符串拼接类 TypeError 与缺少冒号的
                SyntaxError。
              </small>
            </div>
          )}
        </article>

        <article className="panel">
          <h2>AI Debug 教练</h2>

          <div className="hint-box">
            <p>{coachMessage}</p>
          </div>

          <p>
            当前提示等级：
            {hintLevel === 0 ? "尚未开始" : `第 ${hintLevel} 级`}
          </p>

          <div className="student-response-box">
            <label htmlFor="student-response">我的判断</label>
            <textarea
              id="student-response"
              rows="4"
              maxLength="2000"
              placeholder="例如：我认为索引超出了列表范围，因为……"
              value={studentResponse}
              onChange={(event) => setStudentResponse(event.target.value)}
              disabled={hintLevel === 0 || isLoading || isSolved}
            />
            <button
              type="button"
              onClick={submitStudentResponse}
              disabled={hintLevel === 0 || isLoading || isSolved}
            >
              提交我的判断
            </button>
          </div>

          <button
            type="button"
            onClick={markAsSolved}
            disabled={hintLevel === 0 || isLoading || isSolved}
          >
            我已定位，准备修改代码
          </button>

          <button
            type="button"
            onClick={showNextHint}
            disabled={hintLevel === 0 || isLoading || isSolved}
          >
            再给我一个提示
          </button>

          <button
            type="button"
            onClick={showAnswer}
            disabled={hintLevel === 0 || isLoading || isSolved}
          >
            实在不会，查看答案
          </button>
        </article>
      </section>

      <section className="panel">
        <h2>本次学习记录</h2>

        <label htmlFor="error-type">错误类型</label>
        <input
          id="error-type"
          type="text"
          placeholder="例如：IndexError"
          value={errorType}
          onChange={(event) => setErrorType(event.target.value)}
          disabled={!isSolved}
        />

        <label htmlFor="knowledge-point">涉及知识点</label>
        <input
          id="knowledge-point"
          type="text"
          placeholder="例如：列表索引从 0 开始"
          value={knowledgePoint}
          onChange={(event) => setKnowledgePoint(event.target.value)}
          disabled={!isSolved}
        />

        <label htmlFor="error-cause">我的错误原因</label>
        <textarea
          id="error-cause"
          rows="3"
          placeholder="请用自己的话解释错误为什么发生"
          value={errorCause}
          onChange={(event) => setErrorCause(event.target.value)}
          disabled={!isSolved}
        />

        <label htmlFor="prevention">下次如何避免</label>
        <textarea
          id="prevention"
          rows="3"
          placeholder="记录一条具体的改进方法"
          value={prevention}
          onChange={(event) => setPrevention(event.target.value)}
          disabled={!isSolved}
        />

        <button type="button" onClick={saveLearningRecord} disabled={!isSolved}>
          保存学习记录
        </button>
        <p>已保存学习记录：{learningRecords.length} 条</p>
        {saveMessage && <p>{saveMessage}</p>}
      </section>

      <section className="panel history-panel">
        <div className="history-header">
          <h2>历史学习记录</h2>

          <button
            className="clear-records-button"
            type="button"
            onClick={clearLearningRecords}
            disabled={learningRecords.length === 0}
          >
            清空全部记录
          </button>
        </div>

        {learningRecords.length === 0 ? (
          <p>还没有保存过学习记录。</p>
        ) : (
          <div className="record-list">
            {[...learningRecords].reverse().map((record) => (
              <article className="record-card" key={record.id}>
                <div className="record-header">
                  <strong>{record.errorType}</strong>
                  <time>
                    {new Date(record.savedAt).toLocaleString("zh-CN")}
                  </time>
                </div>

                <p>知识点：{record.knowledgePoint}</p>
                <p>错误原因：{record.errorCause}</p>
                <p>避免方法：{record.prevention}</p>
                <button
                  className="delete-record-button"
                  type="button"
                  onClick={() => deleteLearningRecord(record.id)}
                >
                  删除这条记录
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
