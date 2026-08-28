#!/usr/bin/env python3
"""Backfill missing NUBO attachment image descriptions with GPT-5.6 Luna."""

from __future__ import annotations

import argparse
import ast
import base64
import json
import mimetypes
import os
import posixpath
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

MODEL = "gpt-5.6-luna"
PRICE_DATE = "2026-08-28"
INPUT_USD_PER_MILLION = 0.20
OUTPUT_USD_PER_MILLION = 1.20
# Luna low detail의 최대 512px 패치 비용과 고정 프롬프트 토큰을 합친 보수적 예산값입니다.
ESTIMATED_INPUT_TOKENS = 450
MAX_OUTPUT_TOKENS = 220
MAX_DESCRIPTION_CHARS = 500
MAX_IMAGE_BYTES = 25 * 1024 * 1024
PRICING_URL = "https://developers.openai.com/api/docs/models/gpt-5.6-luna"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
PROMPT = (
    "사진 접근성 설명과 사이트 검색 색인을 작성해 주세요. 이미지에서 직접 확인되는 사실만 "
    "한국어 평문 2~3문장, 350자 이내로 설명하세요. 주요 대상, 장소나 환경, 행동, 시간대, "
    '날씨와 색감을 포함하고 마지막에 "검색어: " 다음으로 검색에 유용한 단순 명사 5~10개를 '
    "쉼표로 적으세요. 핵심어와 사용자가 찾을 법한 일상 동의어를 함께 쓰세요(예: 해안, 해변). "
    "제목, 마크다운, 목록 기호는 사용하지 마세요."
)
IMAGE_EXTENSIONS = ("avif", "bmp", "gif", "jpeg", "jpg", "png", "webp")
MIME_TYPES = {
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class BackfillError(RuntimeError):
    pass


@dataclass(frozen=True)
class Candidate:
    file_uid: int
    post_uid: int
    thumbnail_path: str
    original_path: str


@dataclass
class Totals:
    api_calls: int = 0
    succeeded: int = 0
    skipped: int = 0
    failed: int = 0
    input_tokens: int = 0
    output_tokens: int = 0


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="설명이 없는 NUBO 첨부 이미지를 GPT-5.6 Luna로 소급 처리합니다."
    )
    parser.add_argument(
        "--env-file",
        default=os.environ.get("NUBO_ENV_FILE", ".env"),
        help="GOAPI 환경 파일 경로 (기본: NUBO_ENV_FILE 또는 .env)",
    )
    parser.add_argument("--upload-dir", help="NUBO_UPLOAD_DIR 대신 사용할 업로드 루트")
    parser.add_argument("--limit", type=int, help="이번 실행에서 처리할 최대 이미지 수")
    parser.add_argument("--scan-only", action="store_true", help="개수와 비용만 확인하고 종료")
    parser.add_argument(
        "--input-price",
        type=float,
        default=INPUT_USD_PER_MILLION,
        help="입력 100만 토큰당 USD 단가",
    )
    parser.add_argument(
        "--output-price",
        type=float,
        default=OUTPUT_USD_PER_MILLION,
        help="출력 100만 토큰당 USD 단가",
    )
    args = parser.parse_args(argv)
    if args.limit is not None and args.limit < 1:
        parser.error("--limit은 1 이상이어야 합니다")
    if args.input_price < 0 or args.output_price < 0:
        parser.error("토큰 단가는 0 이상이어야 합니다")
    return args


def load_dotenv(path: Path) -> dict[str, str]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise BackfillError(f"환경 파일을 읽을 수 없습니다: {path}: {exc}") from exc
    values: dict[str, str] = {}
    for number, raw in enumerate(lines, 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            raise BackfillError(f"환경 파일 {number}번째 줄에 '='가 없습니다")
        key, value = line.split("=", 1)
        key = key.strip()
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
            raise BackfillError(f"환경 파일 {number}번째 줄의 키가 올바르지 않습니다")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            try:
                value = ast.literal_eval(value)
            except (SyntaxError, ValueError) as exc:
                raise BackfillError(f"환경 파일 {number}번째 줄의 따옴표가 올바르지 않습니다") from exc
        else:
            value = re.split(r"\s+#", value, maxsplit=1)[0].rstrip()
        values[key] = value
    values.update(os.environ)
    return values


def config_value(config: dict[str, str], key: str, default: str = "") -> str:
    return config.get(key, default).strip()


def validate_prefix(prefix: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_]*", prefix):
        raise BackfillError("DB_TABLE_PREFIX에는 영문, 숫자, 밑줄만 사용할 수 있습니다")
    return prefix


def option_value(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


class MysqlClient:
    def __init__(self, config: dict[str, str]):
        self.binary = shutil.which("mysql") or shutil.which("mariadb")
        if not self.binary:
            raise BackfillError("mysql 또는 mariadb CLI를 찾을 수 없습니다")
        required = {key: config_value(config, key) for key in ("DB_USER", "DB_NAME")}
        missing = [key for key, value in required.items() if not value]
        if missing:
            raise BackfillError(f"환경 파일에 {', '.join(missing)} 값이 필요합니다")
        fd, self.defaults_path = tempfile.mkstemp(prefix="nubo-mysql-", suffix=".cnf")
        os.fchmod(fd, 0o600)
        socket = config_value(config, "DB_UNIX_SOCKET")
        options = {
            "user": required["DB_USER"],
            "password": config_value(config, "DB_PASS"),
            "database": required["DB_NAME"],
            "default-character-set": "utf8mb4",
        }
        if socket:
            options.update({"protocol": "socket", "socket": socket})
        else:
            options.update(
                {
                    "protocol": "tcp",
                    "host": config_value(config, "DB_HOST", "localhost"),
                    "port": config_value(config, "DB_PORT", "3306"),
                }
            )
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write("[client]\n")
            for key, value in options.items():
                handle.write(f"{key}={option_value(value)}\n")

    def close(self) -> None:
        try:
            os.unlink(self.defaults_path)
        except FileNotFoundError:
            pass

    def run(self, sql: str) -> str:
        env = {
            key: os.environ[key]
            for key in ("HOME", "LANG", "LC_ALL", "LC_CTYPE", "PATH", "TMPDIR", "TZ")
            if key in os.environ
        }
        command = [
            self.binary,
            f"--defaults-file={self.defaults_path}",
            "--batch",
            "--raw",
            "--skip-column-names",
        ]
        try:
            completed = subprocess.run(
                command,
                input=sql,
                text=True,
                capture_output=True,
                timeout=120,
                env=env,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise BackfillError(f"데이터베이스 명령 실행 실패: {exc}") from exc
        if completed.returncode != 0:
            message = completed.stderr.strip() or "알 수 없는 MySQL 오류"
            raise BackfillError(f"데이터베이스 오류: {message}")
        return completed.stdout


def candidate_query(prefix: str) -> str:
    extensions = ", ".join(f"'{ext}'" for ext in IMAGE_EXTENSIONS)
    return f"""
SELECT f.uid, f.post_uid,
       COALESCE((SELECT t.path FROM {prefix}file_thumbnail AS t
                 WHERE t.file_uid = f.uid ORDER BY t.uid DESC LIMIT 1), ''),
       f.path
FROM {prefix}file AS f
JOIN {prefix}post AS p ON p.uid = f.post_uid AND p.status != -1
WHERE NOT EXISTS (
    SELECT 1 FROM {prefix}image_description AS d
    WHERE d.file_uid = f.uid AND TRIM(d.description) != ''
)
AND (
    EXISTS (SELECT 1 FROM {prefix}file_thumbnail AS t WHERE t.file_uid = f.uid)
    OR LOWER(SUBSTRING_INDEX(f.path, '.', -1)) IN ({extensions})
)
ORDER BY f.uid;
"""


def parse_candidates(output: str) -> list[Candidate]:
    candidates: list[Candidate] = []
    for line in output.splitlines():
        if not line.strip():
            continue
        fields = line.split("\t")
        if len(fields) != 4:
            raise BackfillError("후보 이미지 조회 결과 형식이 올바르지 않습니다")
        try:
            candidates.append(Candidate(int(fields[0]), int(fields[1]), fields[2], fields[3]))
        except ValueError as exc:
            raise BackfillError("후보 이미지 UID가 올바르지 않습니다") from exc
    return candidates


def resolve_public_path(public_path: str, upload_root: Path) -> Path:
    clean = posixpath.normpath("/" + public_path.strip().lstrip("/"))
    if not clean.startswith("/upload/"):
        raise BackfillError("DB 이미지 경로가 /upload/ 아래에 있지 않습니다")
    resolved_root = upload_root.resolve()
    resolved = (resolved_root / clean.removeprefix("/upload/")).resolve()
    if resolved != resolved_root and resolved_root not in resolved.parents:
        raise BackfillError("DB 이미지 경로가 업로드 루트를 벗어납니다")
    return resolved


def choose_image(candidate: Candidate, upload_root: Path) -> tuple[Path | None, str]:
    reasons: list[str] = []
    for public_path in (candidate.thumbnail_path, candidate.original_path):
        if not public_path:
            continue
        try:
            path = resolve_public_path(public_path, upload_root)
        except BackfillError as exc:
            reasons.append(str(exc))
            continue
        if not path.is_file():
            reasons.append("파일 없음")
            continue
        if path.suffix.lower() not in MIME_TYPES:
            reasons.append("OpenAI 미지원 형식")
            continue
        size = path.stat().st_size
        if size < 1 or size > MAX_IMAGE_BYTES:
            reasons.append("파일 크기 제한 초과")
            continue
        return path, ""
    return None, reasons[-1] if reasons else "사용 가능한 이미지 경로 없음"


def normalize_description(description: str) -> str:
    normalized = " ".join(description.split())
    if len(normalized) <= MAX_DESCRIPTION_CHARS:
        return normalized
    return normalized[: MAX_DESCRIPTION_CHARS - 1] + "…"


def estimate_cost(count: int, input_price: float, output_price: float) -> float:
    return count * (
        ESTIMATED_INPUT_TOKENS * input_price + MAX_OUTPUT_TOKENS * output_price
    ) / 1_000_000


def token_cost(input_tokens: int, output_tokens: int, input_price: float, output_price: float) -> float:
    return (input_tokens * input_price + output_tokens * output_price) / 1_000_000


def api_error_message(body: bytes) -> str:
    try:
        payload = json.loads(body.decode("utf-8", errors="replace"))
        return str(payload.get("error", {}).get("message") or "OpenAI API 오류")[:300]
    except (json.JSONDecodeError, AttributeError):
        return "OpenAI API 오류"


def request_description(image_path: Path, api_key: str, timeout: int = 30) -> tuple[str, int, int]:
    mime_type = MIME_TYPES.get(image_path.suffix.lower()) or mimetypes.guess_type(image_path.name)[0]
    encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{encoded}", "detail": "low"}},
                    {"type": "text", "text": PROMPT},
                ],
            }
        ],
        "max_completion_tokens": MAX_OUTPUT_TOKENS,
        "reasoning_effort": "none",
    }
    request = urllib.request.Request(
        OPENAI_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", "User-Agent": "nubo-image-backfill/1.0"},
        method="POST",
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
            description = normalize_description(result["choices"][0]["message"]["content"])
            if not description:
                raise BackfillError("OpenAI가 빈 이미지 설명을 반환했습니다")
            usage = result.get("usage", {})
            return description, int(usage.get("prompt_tokens", 0)), int(usage.get("completion_tokens", 0))
        except urllib.error.HTTPError as exc:
            message = api_error_message(exc.read(8192))
            if exc.code not in (408, 409, 429) and exc.code < 500:
                raise BackfillError(f"OpenAI API HTTP {exc.code}: {message}") from exc
            error: Exception = BackfillError(f"OpenAI API HTTP {exc.code}: {message}")
        except (
            urllib.error.URLError,
            TimeoutError,
            UnicodeDecodeError,
            json.JSONDecodeError,
            KeyError,
            IndexError,
            ValueError,
        ) as exc:
            error = exc
        if attempt < 2:
            time.sleep(2**attempt)
    raise BackfillError(f"OpenAI API 호출이 3회 실패했습니다: {error}")


def has_description(db: MysqlClient, prefix: str, file_uid: int) -> bool:
    output = db.run(
        f"SELECT COUNT(*) FROM {prefix}image_description "
        f"WHERE file_uid = {file_uid} AND TRIM(description) != '';"
    ).strip()
    try:
        return int(output or "0") > 0
    except ValueError as exc:
        raise BackfillError("이미지 설명 존재 여부 조회 결과가 올바르지 않습니다") from exc


def store_description(db: MysqlClient, prefix: str, candidate: Candidate, description: str) -> None:
    encoded = description.encode("utf-8").hex()
    expression = f"CONVERT(UNHEX('{encoded}') USING utf8mb4)"
    output = db.run(
        f"""
START TRANSACTION;
UPDATE {prefix}image_description SET description = {expression}
WHERE file_uid = {candidate.file_uid} AND TRIM(description) = '';
INSERT INTO {prefix}image_description (file_uid, post_uid, description)
SELECT {candidate.file_uid}, {candidate.post_uid}, {expression}
WHERE NOT EXISTS (SELECT 1 FROM {prefix}image_description WHERE file_uid = {candidate.file_uid});
COMMIT;
SELECT COUNT(*) FROM {prefix}image_description
WHERE file_uid = {candidate.file_uid} AND TRIM(description) != '';
"""
    ).strip().splitlines()
    try:
        stored_count = int(output[-1]) if output else 0
    except ValueError as exc:
        raise BackfillError("이미지 설명 저장 확인 결과가 올바르지 않습니다") from exc
    if stored_count < 1:
        raise BackfillError("이미지 설명 저장을 확인하지 못했습니다")


def print_summary(totals: Totals, input_price: float, output_price: float) -> None:
    actual = token_cost(totals.input_tokens, totals.output_tokens, input_price, output_price)
    print("\n처리 결과")
    print(f"  API 호출: {totals.api_calls}개")
    print(f"  저장 성공: {totals.succeeded}개 / 건너뜀: {totals.skipped}개 / 실패: {totals.failed}개")
    print(f"  실제 토큰: 입력 {totals.input_tokens:,} / 출력 {totals.output_tokens:,}")
    print(f"  현재 입력 단가로 계산한 누적 비용: 약 ${actual:.6f}")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    env_path = Path(args.env_file).expanduser().resolve()
    config = load_dotenv(env_path)
    prefix = validate_prefix(config_value(config, "DB_TABLE_PREFIX", "nubo_"))
    upload_value = args.upload_dir or config_value(config, "NUBO_UPLOAD_DIR", "./upload")
    upload_root = Path(upload_value).expanduser().resolve()
    db_name = config_value(config, "DB_NAME")
    db_socket = config_value(config, "DB_UNIX_SOCKET")
    if db_socket:
        db_target = f"unix:{db_socket}/{db_name}"
    else:
        db_target = (
            f"{config_value(config, 'DB_HOST', 'localhost')}:"
            f"{config_value(config, 'DB_PORT', '3306')}/{db_name}"
        )
    db = MysqlClient(config)
    try:
        candidates = parse_candidates(db.run(candidate_query(prefix)))
        processable: list[tuple[Candidate, Path]] = []
        unavailable: dict[str, int] = {}
        for candidate in candidates:
            image_path, reason = choose_image(candidate, upload_root)
            if image_path:
                processable.append((candidate, image_path))
            else:
                unavailable[reason] = unavailable.get(reason, 0) + 1
        selected = processable[: args.limit] if args.limit else processable
        estimate = estimate_cost(len(selected), args.input_price, args.output_price)

        print("NUBO 이미지 설명 소급 적용 사전 점검")
        print(f"  설명이 없는 활성 게시물 첨부 이미지: {len(candidates):,}개")
        print(f"  현재 디스크에서 처리 가능: {len(processable):,}개")
        print(f"  이번 실행 대상: {len(selected):,}개")
        print(f"  처리 불가: {len(candidates) - len(processable):,}개")
        for reason, count in sorted(unavailable.items()):
            print(f"    - {reason}: {count:,}개")
        print(f"  모델: {MODEL} / detail=low / 출력 최대 {MAX_OUTPUT_TOKENS}토큰")
        print(
            f"  가격 기준({PRICE_DATE}): 입력 ${args.input_price:.2f}, 출력 ${args.output_price:.2f} / 100만 토큰"
        )
        print(
            f"  예상 비용: 약 ${estimate:.6f} "
            f"(이미지당 입력 {ESTIMATED_INPUT_TOKENS}, 출력 {MAX_OUTPUT_TOKENS}토큰 가정)"
        )
        print(f"  가격 확인: {PRICING_URL}")
        print(f"  DB 대상: {db_target} / 테이블 접두사: {prefix or '(없음)'}")
        print(f"  업로드 루트: {upload_root}")
        print("\n주의: 이미지 데이터가 OpenAI로 전송되고 API 비용과 DB 쓰기가 발생합니다.")
        print("실행 전 DB 백업을 권장합니다. 중단 후 다시 실행하면 이미 저장된 설명은 건너뜁니다.")

        if args.scan_only or not selected:
            print("\n스캔만 완료했습니다. API 호출과 DB 변경은 없었습니다.")
            return 0
        if config_value(config, "OPENAI_IMAGE_DESCRIPTION_ENABLED").lower() not in ("1", "true", "yes", "on"):
            raise BackfillError("OPENAI_IMAGE_DESCRIPTION_ENABLED=true 설정이 필요합니다")
        api_key = config_value(config, "OPENAI_API_KEY")
        if not api_key:
            raise BackfillError("OPENAI_API_KEY 설정이 필요합니다")
        configured_model = config_value(config, "OPENAI_IMAGE_DESCRIPTION_MODEL", MODEL)
        if configured_model != MODEL:
            raise BackfillError(f"이 스크립트는 {MODEL} 전용입니다. 현재 모델: {configured_model}")
        if not sys.stdin.isatty():
            raise BackfillError("실제 실행은 대화형 터미널에서만 가능합니다")
        if input("\n계속하려면 '진행'을 정확히 입력하세요: ").strip() != "진행":
            print("취소했습니다. API 호출과 DB 변경은 없었습니다.")
            return 0

        totals = Totals()
        for index, (candidate, image_path) in enumerate(selected, 1):
            label = f"[{index:,}/{len(selected):,}] file_uid={candidate.file_uid} post_uid={candidate.post_uid}"
            try:
                if has_description(db, prefix, candidate.file_uid):
                    totals.skipped += 1
                    print(f"{label} 건너뜀(이미 설명 존재)", flush=True)
                    continue
                description, input_tokens, output_tokens = request_description(image_path, api_key)
                totals.api_calls += 1
                totals.input_tokens += input_tokens
                totals.output_tokens += output_tokens
                store_description(db, prefix, candidate, description)
                totals.succeeded += 1
                cost = token_cost(input_tokens, output_tokens, args.input_price, args.output_price)
                print(f"{label} 저장 완료 ({input_tokens}/{output_tokens} tokens, ${cost:.6f})", flush=True)
            except (BackfillError, OSError) as exc:
                totals.failed += 1
                print(f"{label} 실패: {exc}", file=sys.stderr, flush=True)
        print_summary(totals, args.input_price, args.output_price)
        return 1 if totals.failed else 0
    except KeyboardInterrupt:
        print("\n사용자 요청으로 중단했습니다. 저장 완료된 설명은 유지되며 재실행할 수 있습니다.")
        return 130
    finally:
        db.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BackfillError as exc:
        print(f"오류: {exc}", file=sys.stderr)
        raise SystemExit(1)
