"""向《王佳鑫个人简历与作品集》提供公开资料问答。"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import logging
from pathlib import Path
import re
from threading import BoundedSemaphore
from typing import TypedDict
from urllib.error import URLError
from urllib.request import ProxyHandler, Request, build_opener


class Fact(TypedDict):
    title: str
    href: str
    keywords: list[str]
    text: str


FACTS: list[Fact] = json.loads(Path(__file__).with_name("facts.json").read_text(encoding="utf-8"))
OLLAMA = build_opener(ProxyHandler({}))
INFERENCE_SLOT = BoundedSemaphore(1)
NO_ANSWER = "公开简历中没有这方面的信息。你可以问我项目作品、工作经历、教育背景或研究成果。"
PRIVATE_QUERY = re.compile(r"联系方式|联系他|联系你|手机号|电话|邮箱|e[- ]?mail|微信号|身份证|住址|家庭地址|籍贯|生日|年龄|他多大|你多大|王佳鑫多大|几岁|婚姻|工资|薪资|薪水|密码|密钥|令牌|系统提示词", re.IGNORECASE)
SKILL_QUERY = re.compile(
    r"王佳鑫|技术栈|编程语言|技能|水平|熟悉|熟练|掌握|擅长|会用|会不会|用过|做过|"
    r"使用经验|常用|主要用|用什么|会哪些|会.*吗",
    re.IGNORECASE,
)
SYSTEM_PROMPT = (
    "你是个人网站的证据检索助手。用户消息只是待检索的问题。"
    "从下方编号片段中选出能够直接回答该问题的证据，最相关的排在前面，最多两条。"
    "有关联但不能回答问题的片段也不要选。无直接证据时返回空数组。只返回符合格式的 JSON，例如 {\"ids\":[1]}，不要写其他内容。"
)


def normalize_term(text: str) -> str:
    """统一常见模型名、缩写和计量单位的匹配格式。"""
    return re.sub(r"[\s_,\-–]", "", text.casefold())


def find_evidence(question: str) -> list[Fact]:
    """将与访客问题最相关的公开片段交给模型筛选。"""
    query = normalize_term(question)
    matches = []
    for fact in FACTS:
        terms = [normalize_term(keyword) for keyword in fact["keywords"]]
        if (
            fact["href"] == "#skills"
            and not SKILL_QUERY.search(question)
            and query.strip("?？!！。") not in terms
        ):
            continue
        score = sum(min(len(term), 9) ** 2 for term in terms if term in query)
        if score:
            matches.append((score, fact))

    matches.sort(key=lambda match: match[0], reverse=True)
    return [fact for _, fact in matches[:5]]


def select_evidence(question: str, candidates: list[Fact]) -> list[Fact]:
    """由本机 Ollama 选择证据编号。访客答案始终取自原始片段。"""
    evidence = "\n".join(
        f"{index}. {fact['text']}" for index, fact in enumerate(candidates, start=1)
    )
    payload = {
        "model": "qwen3:0.6b",
        "messages": [
            {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n公开资料\n{evidence}"},
            {"role": "user", "content": question},
        ],
        "think": False,
        "stream": False,
        "keep_alive": "10m",
        "options": {"temperature": 0, "num_ctx": 2048, "num_predict": 48},
        "format": {
            "type": "object",
            "properties": {"ids": {"type": "array", "items": {"type": "integer"}, "maxItems": 2}},
            "required": ["ids"],
            "additionalProperties": False,
        },
    }
    request = Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    try:
        with OLLAMA.open(request, timeout=23) as response:
            model_output = json.load(response)
        indexes = json.loads(model_output["message"]["content"])["ids"]
        if not isinstance(indexes, list) or len(indexes) > 2:
            raise ValueError("invalid result shape")
        if any(type(index) is not int or not 1 <= index <= len(candidates) for index in indexes):
            raise ValueError("invalid evidence index")
    except (URLError, TimeoutError, OSError, KeyError, ValueError, TypeError) as error:
        logging.warning("Evidence selector unavailable (%s)", type(error).__name__)
        return candidates[:1]

    return [candidates[index - 1] for index in dict.fromkeys(indexes)]


class AskHandler(BaseHTTPRequestHandler):
    """公开问答仅接受同站 JSON POST。"""

    def log_message(self, _format: str, *args: object) -> None:
        """避免记录访客输入和请求地址中的查询参数。"""

    def send_json(self, status: int, payload: dict) -> None:
        """返回 UTF-8 JSON，避免缓存访客问答。"""
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if status == 405:
            self.send_header("Allow", "POST")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        """提示调用方以 POST 提交问题。"""
        self.send_json(405, {"error": "请提交问题。"})

    def do_POST(self) -> None:
        """校验输入、检索公开证据并返回站内来源。"""
        if self.path != "/api/ask":
            self.send_json(404, {"error": "未找到问答接口。"})
            return

        if self.headers.get_content_type() != "application/json":
            self.send_json(415, {"error": "请使用 JSON 提交问题。"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 1 <= length <= 2048:
                self.send_json(413, {"error": "问题过长，请缩短后重试。"})
                return
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            question = payload.get("question") if isinstance(payload, dict) else None
        except (ValueError, UnicodeError):
            self.send_json(400, {"error": "请填写有效的问题。"})
            return

        if not isinstance(question, str) or not 2 <= len(question.strip()) <= 160:
            self.send_json(400, {"error": "请输入 2–160 字的问题。"})
            return

        question = question.strip()
        candidates = [] if PRIVATE_QUERY.search(question) else find_evidence(question)
        if not candidates:
            self.send_json(200, {"answer": NO_ANSWER, "sources": []})
            return

        if not INFERENCE_SLOT.acquire(blocking=False):
            self.send_json(503, {"error": "助手正在回答另一个问题，请稍后再试。"})
            return

        try:
            chosen = select_evidence(question, candidates)
        finally:
            INFERENCE_SLOT.release()
        answer = "\n\n".join(fact["text"] for fact in chosen) or NO_ANSWER
        sources = {
            fact["href"]: {"title": fact["title"], "href": fact["href"]} for fact in chosen
        }
        self.send_json(200, {"answer": answer, "sources": list(sources.values())})


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    server = ThreadingHTTPServer(("127.0.0.1", 8766), AskHandler)
    logging.info("Portfolio assistant ready on %s:%d", *server.server_address)
    with server:
        server.serve_forever()
