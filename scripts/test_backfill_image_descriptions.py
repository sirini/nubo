import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).with_name("backfill_image_descriptions.py")
SPEC = importlib.util.spec_from_file_location("backfill_image_descriptions", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return json.dumps(self.payload).encode()


class FakeDB:
    def __init__(self):
        self.sql = ""

    def run(self, sql):
        self.sql = sql
        return "1\n"


class BackfillImageDescriptionsTest(unittest.TestCase):
    def test_load_dotenv_supports_quotes_comments_and_environment_override(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env"
            path.write_text('DB_PASS="a#b"\nDB_NAME=file_db # comment\nexport DB_USER=nubo\n')
            with patch.dict(os.environ, {"DB_NAME": "environment_db"}, clear=True):
                values = MODULE.load_dotenv(path)
        self.assertEqual(values["DB_PASS"], "a#b")
        self.assertEqual(values["DB_NAME"], "environment_db")
        self.assertEqual(values["DB_USER"], "nubo")

    def test_candidate_query_only_selects_active_missing_image_descriptions(self):
        query = MODULE.candidate_query(MODULE.validate_prefix("nubo_"))
        self.assertIn("p.status != -1", query)
        self.assertIn("TRIM(d.description) != ''", query)
        self.assertIn("nubo_file_thumbnail", query)
        with self.assertRaises(MODULE.BackfillError):
            MODULE.validate_prefix("nubo_; DROP TABLE post")

    def test_parse_candidates(self):
        result = MODULE.parse_candidates("7\t9\t/upload/thumbnails/t.webp\t/upload/attachments/a.jpg\n")
        self.assertEqual(
            result,
            [MODULE.Candidate(7, 9, "/upload/thumbnails/t.webp", "/upload/attachments/a.jpg")],
        )

    def test_choose_image_prefers_thumbnail_and_rejects_escape(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            thumbnail = root / "thumbnails" / "t.webp"
            thumbnail.parent.mkdir()
            thumbnail.write_bytes(b"webp")
            candidate = MODULE.Candidate(
                7,
                9,
                "/upload/thumbnails/t.webp",
                "/upload/attachments/a.jpg",
            )
            selected, reason = MODULE.choose_image(candidate, root)
            self.assertEqual(selected, thumbnail)
            self.assertEqual(reason, "")
            with self.assertRaises(MODULE.BackfillError):
                MODULE.resolve_public_path("/upload/../../etc/passwd", root)

    def test_description_and_cost_limits(self):
        normalized = MODULE.normalize_description("  해변의\n 노을  " + "가" * 600)
        self.assertEqual(len(normalized), MODULE.MAX_DESCRIPTION_CHARS)
        self.assertTrue(normalized.endswith("…"))
        self.assertAlmostEqual(
            MODULE.estimate_cost(1, 0.20, 1.20),
            0.000354,
        )

    def test_request_description_uses_luna_low_detail_and_usage(self):
        payload = {
            "choices": [{"message": {"content": "해변의 노을이다. 검색어: 해변, 노을"}}],
            "usage": {"prompt_tokens": 350, "completion_tokens": 80},
        }
        requests = []

        def fake_urlopen(request, timeout):
            requests.append((request, timeout))
            return FakeResponse(payload)

        with tempfile.TemporaryDirectory() as directory:
            image = Path(directory) / "image.webp"
            image.write_bytes(b"webp")
            with patch.object(MODULE.urllib.request, "urlopen", side_effect=fake_urlopen):
                description, input_tokens, output_tokens = MODULE.request_description(image, "secret")

        request_payload = json.loads(requests[0][0].data)
        self.assertEqual(request_payload["model"], MODULE.MODEL)
        self.assertEqual(request_payload["messages"][0]["content"][0]["image_url"]["detail"], "low")
        self.assertEqual(description, payload["choices"][0]["message"]["content"])
        self.assertEqual((input_tokens, output_tokens), (350, 80))
        self.assertNotIn("secret", requests[0][0].data.decode())

    def test_store_description_uses_hex_and_is_restart_safe(self):
        db = FakeDB()
        MODULE.store_description(db, "nubo_", MODULE.Candidate(7, 9, "", ""), "해변의 노을")
        self.assertIn("START TRANSACTION", db.sql)
        self.assertIn("WHERE NOT EXISTS", db.sql)
        self.assertIn("file_uid = 7", db.sql)
        self.assertNotIn("해변의 노을", db.sql)


if __name__ == "__main__":
    unittest.main()
