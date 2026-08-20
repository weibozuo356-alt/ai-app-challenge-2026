"""BugMentor deployment smoke test using only the Python standard library."""

import argparse
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


def request(url, *, method="GET", headers=None, data=None, timeout=90):
    req = Request(
        url,
        method=method,
        headers=headers or {},
        data=data,
    )
    with urlopen(req, timeout=timeout) as response:
        return response.status, response.headers, response.read()


def assert_check(condition, message):
    if not condition:
        raise AssertionError(message)
    print(f"PASS: {message}")


def main():
    parser = argparse.ArgumentParser(description="验收 BugMentor 线上部署")
    parser.add_argument("--frontend-url", required=True)
    parser.add_argument("--backend-url", required=True)
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--exercise-ai", action="store_true")
    args = parser.parse_args()

    frontend_url = args.frontend_url.rstrip("/")
    backend_url = args.backend_url.rstrip("/")
    frontend_parts = urlsplit(frontend_url)
    frontend_origin = f"{frontend_parts.scheme}://{frontend_parts.netloc}"

    try:
        status, _, body = request(frontend_url, timeout=args.timeout)
        assert_check(status == 200, "前端首页返回 HTTP 200")
        assert_check(b'id="root"' in body, "前端包含 React 根节点")

        status, headers, body = request(
            f"{backend_url}/health",
            timeout=args.timeout,
        )
        health = json.loads(body)
        assert_check(status == 200, "后端健康检查返回 HTTP 200")
        assert_check(health.get("status") == "ok", "后端健康状态为 ok")
        assert_check(bool(headers.get("X-Request-ID")), "后端返回请求 ID")
        assert_check(
            headers.get("X-Content-Type-Options") == "nosniff",
            "后端安全响应头已生效",
        )

        status, headers, _ = request(
            f"{backend_url}/api/debug",
            method="OPTIONS",
            headers={
                "Origin": frontend_origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
            timeout=args.timeout,
        )
        assert_check(status == 200, "CORS 预检请求通过")
        assert_check(
            headers.get("Access-Control-Allow-Origin") == frontend_origin,
            "CORS 白名单与正式前端来源一致",
        )

        if args.exercise_ai:
            payload = json.dumps(
                {
                    "code": "numbers = [10, 20, 30]\nprint(numbers[3])",
                    "expected_result": "输出 30",
                    "error_message": "IndexError: list index out of range",
                    "hint_level": 1,
                }
            ).encode("utf-8")
            status, _, body = request(
                f"{backend_url}/api/debug",
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "Origin": frontend_origin,
                },
                data=payload,
                timeout=args.timeout,
            )
            result = json.loads(body)
            assert_check(status == 200, "DeepSeek 调试接口返回 HTTP 200")
            assert_check(bool(result.get("hint")), "DeepSeek 返回非空一级提示")

    except (AssertionError, HTTPError, URLError, TimeoutError, ValueError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        return 1

    print("BugMentor 线上冒烟验收全部通过。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
