import { useState } from "react";
import "./App.css";

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

      if (!response.ok) {
        throw new Error("后端返回错误");
      }

      const data = await response.json();

      setHintLevel(data.hint_level);
      setCoachMessage(data.hint);
    } catch {
      setHintLevel(0);
      setCoachMessage("连接后端失败，请确认前端和后端都在运行。");
    } finally {
      setIsLoading(false);
    }
  }

  async function startDebugging() {
    if (!hasCode()) {
      return;
    }

    setIsSolved(false);
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
        <p>
          错误类型：
          {isSolved ? "等待用户复盘" : "等待完成调试"}
        </p>
        <p>
          涉及知识点：
          {isSolved ? "等待用户复盘" : "等待完成调试"}
        </p>
        <p>
          我的错误原因：
          {isSolved ? "请用自己的话总结" : "等待完成调试"}
        </p>
        <p>
          下次如何避免：
          {isSolved ? "请记录一条改进方法" : "等待完成调试"}
        </p>
      </section>
    </main>
  );
}

export default App;
