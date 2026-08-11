import { useState } from 'react'
import './App.css'

const hints = [
  '第一级提示：先查看报错信息的最后一行，它通常会告诉你错误类型。',
  '第二级提示：找到报错中出现的行号，重点检查这一行以及它的上一行。',
  '第三级提示：检查变量类型、括号、缩进和循环边界是否符合你的预期。',
  '第四级提示：尝试用一句话描述这段代码应该按什么顺序执行，再对照实际代码。',
]

function App() {
  const [code, setCode] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [coachMessage, setCoachMessage] = useState(
    '提交代码后，我会从第一级提示开始引导你。'
  )

  function hasCode() {
    if (code.trim() === '') {
      setCoachMessage('请先在左侧粘贴需要调试的 Python 代码。')
      return false
    }

    return true
  }

  function startDebugging() {
    if (!hasCode()) {
      return
    }

    setHintLevel(1)
    setIsSolved(false)
    setCoachMessage(hints[0])
  }

  function showNextHint() {
    if (!hasCode()) {
      return
    }

    if (hintLevel === 0) {
      startDebugging()
      return
    }

    if (hintLevel >= hints.length) {
      setCoachMessage(
        '你已经看完全部引导提示。请先尝试修改代码，实在无法解决时再查看答案。'
      )
      return
    }

    const nextLevel = hintLevel + 1

    setHintLevel(nextLevel)
    setCoachMessage(hints[nextLevel - 1])
  }

  function showAnswer() {
    if (!hasCode()) {
      return
    }

    setHintLevel(5)
    setCoachMessage(
      '第五级：进入答案模式。当前原型尚未接入 AI，后续这里会展示错误原因和修改建议。'
    )
  }

  function markAsSolved() {
    if (!hasCode()) {
      return
    }

    setIsSolved(true)
    setCoachMessage(
      '太好了！请用自己的话解释：错误为什么发生，以及下次如何避免？'
    )
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
          />

          <label htmlFor="error">报错信息</label>
          <textarea
            id="error"
            rows="3"
            placeholder="粘贴报错信息；没有报错可以留空"
          />

          <button type="button" onClick={startDebugging}>
            开始侦查 Bug
          </button>
        </article>

        <article className="panel">
          <h2>AI Debug 教练</h2>

          <div className="hint-box">
            <p>{coachMessage}</p>
          </div>

          <p>
            当前提示等级：
            {hintLevel === 0 ? '尚未开始' : `第 ${hintLevel} 级`}
          </p>

          <button type="button" onClick={markAsSolved}>
            我找到问题了
          </button>

          <button type="button" onClick={showNextHint}>
            再给我一个提示
          </button>

          <button type="button" onClick={showAnswer}>
            实在不会，查看答案
          </button>
        </article>
      </section>

      <section className="panel">
        <h2>本次学习记录</h2>
        <p>
          错误类型：
          {isSolved ? '等待用户复盘' : '等待完成调试'}
        </p>
        <p>
          涉及知识点：
          {isSolved ? '等待用户复盘' : '等待完成调试'}
        </p>
        <p>
          我的错误原因：
          {isSolved ? '请用自己的话总结' : '等待完成调试'}
        </p>
        <p>
          下次如何避免：
          {isSolved ? '请记录一条改进方法' : '等待完成调试'}
        </p>
      </section>
    </main>
  )
}

export default App