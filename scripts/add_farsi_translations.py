#!/usr/bin/env python3
"""Add Persian (Farsi) translations to the standalone app's question data.

Translations are generated from the existing, reviewed English text so Spanish
question and answer data is never modified. Existing Persian fields are reused,
which makes this script safe to run again after adding new questions.

The script uses Google's public translation endpoint and needs internet access:

    python3 scripts/add_farsi_translations.py
    python3 scripts/build_standalone.py
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent
QUESTIONS_PATH = ROOT / "data" / "questions.json"
PASSAGES_PATH = ROOT / "data" / "reading_passages.json"
CACHE_PATH = ROOT / ".farsi-translation-cache.json"
TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
SEPARATOR = "|||NMX|||"
MAX_ENCODED_BATCH_SIZE = 5_000
MAX_WORKERS = 4


def load_json(path: Path):
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, value) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8") as file:
        json.dump(value, file, ensure_ascii=False, indent=2)
        file.write("\n")
    temporary.replace(path)


def translated_text(payload) -> str:
    """Join the sentence fragments returned by Google Translate."""
    return "".join(fragment[0] or "" for fragment in payload[0]).strip()


def request_translation(text: str) -> str:
    params = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": "en",
            "tl": "fa",
            "dt": "t",
            "q": text,
        }
    )
    request = urllib.request.Request(
        f"{TRANSLATE_URL}?{params}",
        headers={"User-Agent": "NaturalizacionMX/1.0"},
    )
    last_error: Exception | None = None
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                result = translated_text(json.loads(response.read().decode("utf-8")))
                if not result:
                    raise RuntimeError("the translation service returned empty text")
                return result
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError) as error:
            last_error = error
            if attempt == 5:
                break
            time.sleep(2**attempt)
    raise RuntimeError(f"translation request failed after retries: {last_error}")


def translate_batch(strings: list[str]) -> list[str]:
    """Translate a batch, falling back to smaller batches if a separator changes."""
    if len(strings) == 1:
        return [request_translation(strings[0])]

    result = request_translation(f"\n{SEPARATOR}\n".join(strings))
    parts = [part.strip() for part in result.split(SEPARATOR)]
    if len(parts) == len(strings) and all(parts):
        return parts

    midpoint = len(strings) // 2
    return translate_batch(strings[:midpoint]) + translate_batch(strings[midpoint:])


def make_batches(strings: Iterable[str]) -> list[list[str]]:
    batches: list[list[str]] = []
    batch: list[str] = []
    size = 0
    separator_size = len(urllib.parse.quote(f"\n{SEPARATOR}\n"))

    for text in strings:
        encoded_size = len(urllib.parse.quote(text))
        added_size = encoded_size + (separator_size if batch else 0)
        if batch and size + added_size > MAX_ENCODED_BATCH_SIZE:
            batches.append(batch)
            batch = []
            size = 0
        batch.append(text)
        size += encoded_size + (separator_size if len(batch) > 1 else 0)
    if batch:
        batches.append(batch)
    return batches


def collect_existing_translations(questions, passages) -> dict[str, str]:
    pairs: list[tuple[str | None, str | None]] = []
    for question in questions:
        pairs.append((question.get("pregunta_en"), question.get("pregunta_fa")))
        pairs.append((question.get("explicacion_en"), question.get("explicacion_fa")))
        pairs.extend(zip(question.get("opciones_en", []), question.get("opciones_fa", [])))

    for passage in passages:
        pairs.append((passage.get("text_en"), passage.get("text_fa")))
        for question in passage["questions"]:
            pairs.append((question.get("question_en"), question.get("question_fa")))
            pairs.extend(zip(question.get("options_en", []), question.get("options_fa", [])))

    return {source: target for source, target in pairs if source and target}


def collect_sources(questions, passages) -> list[str]:
    sources: list[str] = []
    for question in questions:
        sources.append(question["pregunta_en"])
        sources.extend(question["opciones_en"])
        if question.get("explicacion_en"):
            sources.append(question["explicacion_en"])

    for passage in passages:
        sources.append(passage["text_en"])
        for question in passage["questions"]:
            sources.append(question["question_en"])
            sources.extend(question["options_en"])

    # Preserve source order while avoiding repeated translations such as dates
    # and names that occur in many answer choices.
    return list(dict.fromkeys(source for source in sources if source))


def populate_fields(questions, passages, translations: dict[str, str]) -> None:
    for question in questions:
        question["pregunta_fa"] = translations[question["pregunta_en"]]
        question["opciones_fa"] = [translations[value] for value in question["opciones_en"]]
        if question.get("explicacion_en"):
            question["explicacion_fa"] = translations[question["explicacion_en"]]

    for passage in passages:
        passage["text_fa"] = translations[passage["text_en"]]
        for question in passage["questions"]:
            question["question_fa"] = translations[question["question_en"]]
            question["options_fa"] = [translations[value] for value in question["options_en"]]


def validate(questions, passages) -> None:
    for question in questions:
        assert question.get("pregunta_fa"), f"question {question['id']} has no Farsi text"
        assert len(question.get("opciones_fa", [])) == len(question["opciones"]), (
            f"question {question['id']} has an invalid Farsi options list"
        )
        if question.get("explicacion_en"):
            assert question.get("explicacion_fa"), f"question {question['id']} has no Farsi explanation"

    for passage in passages:
        assert passage.get("text_fa"), f"passage {passage['id']} has no Farsi text"
        for index, question in enumerate(passage["questions"], 1):
            assert question.get("question_fa"), f"passage {passage['id']} question {index} has no Farsi text"
            assert len(question.get("options_fa", [])) == len(question["options"]), (
                f"passage {passage['id']} question {index} has an invalid Farsi options list"
            )


def main() -> int:
    questions = load_json(QUESTIONS_PATH)
    passages = load_json(PASSAGES_PATH)
    translations = collect_existing_translations(questions, passages)

    if CACHE_PATH.exists():
        translations.update(load_json(CACHE_PATH))

    missing = [source for source in collect_sources(questions, passages) if source not in translations]
    batches = make_batches(missing)
    print(
        f"Farsi translation: {len(missing)} new unique strings "
        f"in {len(batches)} request batches ({len(translations)} already available)."
    )

    completed = 0
    if batches:
        try:
            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                futures = {executor.submit(translate_batch, batch): batch for batch in batches}
                for future in as_completed(futures):
                    batch = futures[future]
                    translated = future.result()
                    translations.update(zip(batch, translated))
                    completed += 1
                    print(f"  completed {completed}/{len(batches)} batches", flush=True)
                    if completed % 10 == 0:
                        save_json(CACHE_PATH, translations)
        except Exception:
            save_json(CACHE_PATH, translations)
            raise

    populate_fields(questions, passages, translations)
    validate(questions, passages)
    save_json(QUESTIONS_PATH, questions)
    save_json(PASSAGES_PATH, passages)
    if CACHE_PATH.exists():
        CACHE_PATH.unlink()

    history_options = sum(len(question["opciones_fa"]) for question in questions)
    reading_questions = sum(len(passage["questions"]) for passage in passages)
    print(
        f"OK: {len(questions)} history questions, {history_options} answer choices, "
        f"{len(passages)} passages, and {reading_questions} reading questions translated to Farsi."
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, KeyError, RuntimeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
