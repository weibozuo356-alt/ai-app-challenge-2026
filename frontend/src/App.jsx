import './App.css'

function App() {
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

          <button type="button">开始侦查 Bug</button>
        </article>

        <article className="panel">
          <h2>AI Debug 教练</h2>

          <div className="hint-box">
            <p>提交代码后，我会从第一级提示开始引导你。</p>
          </div>

          <p>当前提示等级：第 1 级</p>

          <button type="button">我找到问题了</button>
          <button type="button">再给我一个提示</button>
          <button type="button">实在不会，查看答案</button>
        </article>
      </section>

      <section className="panel">
        <h2>本次学习记录</h2>
        <p>错误类型：等待完成调试</p>
        <p>涉及知识点：等待完成调试</p>
        <p>我的错误原因：等待完成调试</p>
        <p>下次如何避免：等待完成调试</p>
      </section>
    </main>
  )
}

export default App