import { useState } from "react";
import "./App.css";

const STORAGE_KEY = "bugmentor-learning-records";

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

function loadLearningRecords() {
  try {
    const savedRecords = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    );

    if (!Array.isArray(savedRecords)) {
      return [];
    }

    return savedRecords.filter(isValidLearningRecord).slice(-20);
  } catch {
    return [];
  }
}

function App() {
  const [code, setCode] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [coachMessage, setCoachMessage] = useState(
    "提交代码后，我会从第一级提示开始引导你。",
  );

  const [errorType, setErrorType] = useState("");
  const [knowledgePoint, setKnowledgePoint] = useState("");
  const [errorCause, setErrorCause] = useState("");
  const [prevention, setPrevention] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [learningRecords, setLearningRecords] =
    useState(loadLearningRecords);

  function hasCode() {
    if (code.trim() === "") {
      setCoachMessage("请先在左侧粘贴需要调试的 Python 代码。");
      return false;
    }

    return true;
  }

  async function requestHint(level) {
    setIsLoading(true);
    setCoachMessage("正在分析你的代码……");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          expected_result: expectedResult,
          error_message: errorMessage,
          hint_level: level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `请求失败，状态码：${response.status}`);
      }

      setHintLevel(data.hint_level);
      setCoachMessage(data.hint);
    } catch (error) {
      setHintLevel(0);

      if (error instanceof TypeError) {
        setCoachMessage("无法连接后端，请确认后端正在运行。");
      } else {
        setCoachMessage(error.message || "请求失败，请稍后再试。");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function startDebugging() {
    if (!hasCode()) {
      return;
    }

    setIsSolved(false);
    setSaveMessage("");
    await requestHint(1);
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

    setIsSolved(true);
    setCoachMessage(
      "太好了！请用自己的话解释：错误为什么发生，以及下次如何避免？",
    );
  }

  function saveLearningRecord() {
    const recordFields = [
      errorType,
      knowledgePoint,
      errorCause,
      prevention,
    ];

    if (recordFields.some((field) => field.trim() === "")) {
      setSaveMessage("请填写完整的学习复盘后再保存。");
      return;
    }

    const newRecord = {
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

          <label htmlFor="code">代码</label>
          <textarea
            id="code"
            rows="12"
            placeholder="在这里粘贴你的 Python 代码……"
            value={code}
            onChange={(event) => setCode(event.target.value)}
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

          <button type="button" onClick={startDebugging} disabled={isLoading}>
            {isLoading ? "正在分析……" : "开始侦查 Bug"}
          </button>
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

          <button type="button" onClick={markAsSolved}>
            我找到问题了
          </button>

          <button type="button" onClick={showNextHint} disabled={isLoading}>
            再给我一个提示
          </button>

          <button type="button" onClick={showAnswer} disabled={isLoading}>
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

        <button
          type="button"
          onClick={saveLearningRecord}
          disabled={!isSolved}
        >
          保存学习记录
        </button>
        <p>已保存学习记录：{learningRecords.length} 条</p>
        {saveMessage && <p>{saveMessage}</p>}
      </section>

      <section className="panel history-panel">
        <h2>历史学习记录</h2>

        {learningRecords.length === 0 ? (
          <p>还没有保存过学习记录。</p>
        ) : (
          <div className="record-list">
            {[...learningRecords].reverse().map((record) => (
              <article className="record-card" key={record.savedAt}>
                <div className="record-header">
                  <strong>{record.errorType}</strong>
                  <time>
                    {new Date(record.savedAt).toLocaleString("zh-CN")}
                  </time>
                </div>

                <p>知识点：{record.knowledgePoint}</p>
                <p>错误原因：{record.errorCause}</p>
                <p>避免方法：{record.prevention}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
