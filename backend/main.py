import json
import logging
import os
import re
import time
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai_service import generate_debug_hint


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(message)s",
)
logger = logging.getLogger("bugmentor")

REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


DEFAULT_FRONTEND_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173"
)


def get_frontend_origins() -> list[str]:
    configured_origins = os.getenv(
        "FRONTEND_ORIGINS",
        DEFAULT_FRONTEND_ORIGINS,
    )

    return [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]


def get_request_id(request: Request) -> str:
    candidate = request.headers.get("X-Request-ID", "")

    if REQUEST_ID_PATTERN.fullmatch(candidate):
        return candidate

    return str(uuid.uuid4())


app = FastAPI(
    title="BugMentor API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_frontend_origins(),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def add_request_observability(request: Request, call_next):
    request_id = get_request_id(request)
    request.state.request_id = request_id
    started_at = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception as error:
        logger.exception(
            json.dumps(
                {
                    "event": "http_request_failed",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "error_type": type(error).__name__,
                },
                ensure_ascii=False,
            )
        )
        raise

    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    for header_name, header_value in SECURITY_HEADERS.items():
        response.headers[header_name] = header_value

    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    logger.info(
        json.dumps(
            {
                "event": "http_request_completed",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
            ensure_ascii=False,
        )
    )

    return response


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


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "bugmentor-api",
    }


@app.post("/api/debug")
def debug_code(payload: DebugRequest, request: Request):
    try:
        hint = generate_debug_hint(
            code=payload.code,
            expected_result=payload.expected_result,
            error_message=payload.error_message,
            hint_level=payload.hint_level,
            student_response=payload.student_response,
            previous_hint=payload.previous_hint,
        )
    except Exception as error:
        logger.exception(
            json.dumps(
                {
                    "event": "ai_hint_failed",
                    "request_id": request.state.request_id,
                    "hint_level": payload.hint_level,
                    "error_type": type(error).__name__,
                },
                ensure_ascii=False,
            )
        )
        raise HTTPException(
            status_code=503,
            detail="AI 教练暂时无法响应，请稍后再试。",
        )

    return {
        "hint_level": payload.hint_level,
        "hint": hint,
        "interaction": (
            "follow_up" if payload.student_response.strip() else "hint"
        ),
        "mode": "deepseek",
    }
