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


if __name__ == "__main__":
    unittest.main()