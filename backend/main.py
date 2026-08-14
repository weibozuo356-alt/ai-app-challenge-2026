from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai_service import generate_debug_hint


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
    student_response: str = Field(default="", max_length=2000)
    previous_hint: str = Field(default="", max_length=2000)


@app.get("/")
def read_root():
    return {"message": "BugMentor 后端运行成功"}


@app.post("/api/debug")
def debug_code(request: DebugRequest):
    try:
        hint = generate_debug_hint(
            code=request.code,
            expected_result=request.expected_result,
            error_message=request.error_message,
            hint_level=request.hint_level,
            student_response=request.student_response,
            previous_hint=request.previous_hint,
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="AI 教练暂时无法响应，请稍后再试。",
        )

    return {
        "hint_level": request.hint_level,
        "hint": hint,
        "interaction": (
            "follow_up" if request.student_response.strip() else "hint"
        ),
        "mode": "deepseek",
    }
