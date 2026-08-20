import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


class DebugApiTests(unittest.TestCase):
    def test_root_endpoint(self):
        response = client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"message": "BugMentor 后端运行成功"},
        )

    @patch("main.generate_debug_hint", return_value="这是一条测试提示")
    def test_debug_endpoint_success(self, mock_generate_hint):
        response = client.post(
            "/api/debug",
            json={
                "code": "print(1)",
                "expected_result": "输出1",
                "error_message": "",
                "hint_level": 2,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["hint_level"], 2)
        self.assertEqual(response.json()["hint"], "这是一条测试提示")
        self.assertEqual(response.json()["mode"], "deepseek")
        mock_generate_hint.assert_called_once()

    @patch("main.generate_debug_hint", return_value="你的判断方向正确，请继续检查索引范围。")
    def test_student_response_is_forwarded_to_ai_coach(
        self,
        mock_generate_hint,
    ):
        response = client.post(
            "/api/debug",
            json={
                "code": "numbers = [10, 20, 30]\nprint(numbers[3])",
                "expected_result": "输出30",
                "error_message": "IndexError: list index out of range",
                "hint_level": 2,
                "student_response": "我认为索引 3 超出了列表范围。",
                "previous_hint": "请观察报错信息和列表索引。",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["interaction"], "follow_up")
        mock_generate_hint.assert_called_once_with(
            code="numbers = [10, 20, 30]\nprint(numbers[3])",
            expected_result="输出30",
            error_message="IndexError: list index out of range",
            hint_level=2,
            student_response="我认为索引 3 超出了列表范围。",
            previous_hint="请观察报错信息和列表索引。",
        )

    def test_health_endpoint(self):
        response = client.get(
            "/health",
            headers={"X-Request-ID": "health-test-request"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "service": "bugmentor-api",
            },
        )
        self.assertEqual(
            response.headers["x-request-id"],
            "health-test-request",
        )

    def test_local_frontend_is_allowed_by_cors(self):
        response = client.options(
            "/api/debug",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            "http://localhost:5173",
        )

    def test_unknown_frontend_is_rejected_by_cors(self):
        response = client.options(
            "/api/debug",
            headers={
                "Origin": "https://untrusted.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertNotIn(
            "access-control-allow-origin",
            response.headers,
        )

    @patch(
        "main.generate_debug_hint",
        side_effect=RuntimeError("内部模型错误"),
    )
    def test_ai_failure_returns_safe_error(self, mock_generate_hint):
        response = client.post(
            "/api/debug",
            json={
                "code": "print(1)",
                "expected_result": "",
                "error_message": "",
                "hint_level": 1,
            },
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json()["detail"],
            "AI 教练暂时无法响应，请稍后再试。",
        )
        self.assertNotIn("内部模型错误", response.text)

    def test_empty_code_is_rejected(self):
        response = client.post(
            "/api/debug",
            json={
                "code": "",
                "expected_result": "",
                "error_message": "",
                "hint_level": 1,
            },
        )

        self.assertEqual(response.status_code, 422)

    def test_invalid_hint_level_is_rejected(self):
        response = client.post(
            "/api/debug",
            json={
                "code": "print(1)",
                "expected_result": "",
                "error_message": "",
                "hint_level": 6,
            },
        )

        self.assertEqual(response.status_code, 422)

    @patch("main.generate_debug_hint")
    def test_oversized_student_response_is_rejected(
        self,
        mock_generate_hint,
    ):
        response = client.post(
            "/api/debug",
            json={
                "code": "print(1)",
                "expected_result": "",
                "error_message": "",
                "hint_level": 1,
                "student_response": "a" * 2001,
            },
        )

        self.assertEqual(response.status_code, 422)
        mock_generate_hint.assert_not_called()


if __name__ == "__main__":
    unittest.main()
