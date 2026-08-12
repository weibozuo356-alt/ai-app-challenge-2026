from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class DebugRequest(BaseModel):
    code: str = Field(min_length=1, max_length=10000)
    expected_result: str = Field(default="", max_length=2000)
    error_message: str = Field(default="", max_length=5000)
    hint_level: int = Field(default=1, ge=1, le=5)


@app.get("/")
def read_root():
    return {"message": "BugMentor 后端运行成功"}


@app.post("/api/debug")
def debug_code(request: DebugRequest):
    hints = {
        2: "第二级提示：找到报错中出现的行号，重点检查这一行以及它的上一行。",
        3: "第三级提示：检查变量类型、括号、缩进和循环边界是否符合预期。",
        4: "第四级提示：用一句话描述代码应该按照什么顺序执行，再与实际代码对照。",
        5: "第五级：进入答案模式。当前版本尚未接入真实 AI，之后这里会返回错误原因和修改建议。",
    }

    if request.hint_level == 1:
        if request.error_message.strip():
            hint = "第一级提示：先查看报错信息的最后一行，它通常会告诉你错误类型。"
        else:
            hint = "第一级提示：当前没有报错信息，请比较实际结果和预期结果有什么不同。"
    else:
        hint = hints[request.hint_level]

    return {
        "hint_level": request.hint_level,
        "hint": hint,
        "mode": "mock",
    }