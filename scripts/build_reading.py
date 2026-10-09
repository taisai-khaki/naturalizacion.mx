#!/usr/bin/env python3
"""Genera data/reading_passages.json a partir de las fuentes de lectura.

Fuentes (fuente de verdad, editables a mano):
  data/reading/pasajes.txt        textos: @PASAJE n | título | tema
                                  y @PARRAFO n.k | texto del párrafo
  data/reading/preguntas_N.txt    preguntas por párrafo: @P n.k, Q: enunciado,
                                  * opción correcta, - distractor (3 por pregunta)

Salida: data/reading_passages.json, una fila por párrafo (39 filas):
  {id, passage_id, passage, paragraph, title, topic, source_hint, text,
   questions: [{question, options, correct}]}

El script FALLA (exit 1) si los datos no cuadran: el total de preguntas debe ser
exactamente TARGET_TOTAL, cada párrafo debe tener al menos MIN_PER_PARAGRAPH
preguntas, cada pregunta debe tener una sola respuesta correcta y 3 distractores,
y no puede haber enunciados repetidos.

Uso:  python3 scripts/build_reading.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_TEXT = os.path.join(ROOT, "data", "reading", "pasajes.txt")
SRC_QS_GLOB = os.path.join(ROOT, "data", "reading", "preguntas_*.txt")
OUT = os.path.join(ROOT, "data", "reading_passages.json")

TARGET_TOTAL = 600
MIN_PER_PARAGRAPH = 6
DISTRACTORS = 3
PARA_ID = re.compile(r"^(\d+)\.(\d+)$")

errors = []


def fail(msg):
    errors.append(msg)


def parse_texts(path):
    passages = {}  # passage_id -> dict
    paragraphs = []  # ordered list of dicts
    cur = None
    with open(path, encoding="utf-8") as f:
        for lineno, raw in enumerate(f, 1):
            line = raw.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            if line.startswith("@PASAJE "):
                parts = [p.strip() for p in line[len("@PASAJE "):].split("|")]
                if len(parts) != 3 or not parts[0].isdigit():
                    fail(f"{path}:{lineno}: encabezado de pasaje mal formado")
                    continue
                pid = int(parts[0])
                if pid in passages:
                    fail(f"{path}:{lineno}: pasaje {pid} duplicado")
                passages[pid] = {"id": pid, "title": parts[1], "topic": parts[2]}
                cur = pid
                continue
            if line.startswith("@PARRAFO "):
                parts = [p.strip() for p in line[len("@PARRAFO "):].split("|", 1)]
                if len(parts) != 2:
                    fail(f"{path}:{lineno}: párrafo sin texto")
                    continue
                m = PARA_ID.match(parts[0])
                if not m:
                    fail(f"{path}:{lineno}: id de párrafo inválido '{parts[0]}'")
                    continue
                pid, k = int(m.group(1)), int(m.group(2))
                if cur is None or pid != cur:
                    fail(f"{path}:{lineno}: párrafo {parts[0]} fuera de su pasaje")
                    continue
                paragraphs.append({"pid": pid, "k": k, "text": parts[1]})
                continue
            fail(f"{path}:{lineno}: línea no reconocida")
    return passages, paragraphs


def parse_questions(path):
    """Devuelve {'n.k': [question, ...]} con question = {question, options, correct}."""
    out = {}
    cur = None
    q = None
    with open(path, encoding="utf-8") as f:
        for lineno, raw in enumerate(f, 1):
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("@P "):
                pid = line[3:].strip()
                if not PARA_ID.match(pid):
                    fail(f"{path}:{lineno}: id de párrafo inválido '{pid}'")
                    cur = None
                    continue
                if pid in out:
                    fail(f"{path}:{lineno}: bloque @P {pid} repetido")
                out.setdefault(pid, [])
                cur = pid
                q = None
                continue
            if cur is None:
                fail(f"{path}:{lineno}: pregunta fuera de un bloque @P")
                continue
            if line.startswith("Q: "):
                q = {"question": line[3:].strip(), "options": [], "correct": None, "_line": lineno}
                out[cur].append(q)
                continue
            if q is None:
                fail(f"{path}:{lineno}: opción sin pregunta")
                continue
            if line.startswith("* "):
                if q["correct"] is not None:
                    fail(f"{path}:{lineno}: más de una opción correcta en '{q['question']}'")
                q["correct"] = len(q["options"])
                q["options"].append(line[2:].strip())
                continue
            if line.startswith("- "):
                q["options"].append(line[2:].strip())
                continue
            fail(f"{path}:{lineno}: línea no reconocida")
    return out


def main():
    passages, paragraphs = parse_texts(SRC_TEXT)
    if len(passages) != 6:
        fail(f"se esperaban 6 pasajes y hay {len(passages)}")

    # Numeración por pasaje: cada pasaje debe tener k = 1..m en orden.
    per_passage = {}
    for p in paragraphs:
        per_passage.setdefault(p["pid"], []).append(p["k"])
    for pid, ks in per_passage.items():
        if ks != list(range(1, len(ks) + 1)):
            fail(f"pasaje {pid}: los párrafos no están numerados 1..{len(ks)} en orden ({ks})")

    # Preguntas por párrafo (todos los archivos preguntas_*.txt).
    qs_by_para = {}
    files = sorted(glob.glob(SRC_QS_GLOB))
    if not files:
        fail("no hay archivos data/reading/preguntas_*.txt")
    for path in files:
        for pid, qs in parse_questions(path).items():
            if pid in qs_by_para:
                fail(f"párrafo {pid} aparece en más de un archivo de preguntas")
            qs_by_para[pid] = qs

    para_ids = {f"{p['pid']}.{p['k']}" for p in paragraphs}
    for pid in sorted(qs_by_para.keys() - para_ids):
        fail(f"preguntas para un párrafo que no existe en pasajes.txt: {pid}")
    for pid in sorted(para_ids - qs_by_para.keys(), key=lambda s: [int(x) for x in s.split(".")]):
        fail(f"el párrafo {pid} no tiene bloque @P en los archivos de preguntas")

    seen_stems = {}
    rows = []
    total = 0
    for gid, p in enumerate(paragraphs, 1):
        key = f"{p['pid']}.{p['k']}"
        passage = passages.get(p["pid"], {"title": "", "topic": ""})
        qs = qs_by_para.get(key, [])
        if len(qs) < MIN_PER_PARAGRAPH:
            fail(f"párrafo {key}: {len(qs)} preguntas (mínimo {MIN_PER_PARAGRAPH})")
        clean = []
        for q in qs:
            where = f"párrafo {key} línea {q['_line']}"
            stem = q["question"]
            if not stem.endswith("?"):
                fail(f"{where}: el enunciado no termina en '?': {stem}")
            if q["correct"] is None:
                fail(f"{where}: sin opción correcta (*): {stem}")
                continue
            if len(q["options"]) != DISTRACTORS + 1:
                fail(f"{where}: {len(q['options'])} opciones (se esperan {DISTRACTORS + 1}): {stem}")
            if len(set(q["options"])) != len(q["options"]):
                fail(f"{where}: opciones repetidas: {stem}")
            if stem in seen_stems:
                fail(f"{where}: enunciado repetido (también en {seen_stems[stem]}): {stem}")
            seen_stems[stem] = where
            clean.append({"question": stem, "options": q["options"], "correct": q["correct"]})
        total += len(clean)
        rows.append({
            "id": gid,
            "passage_id": p["pid"],
            "passage": passage["title"],
            "paragraph": p["k"],
            "title": f"Párrafo {p['k']} · {passage['title']}",
            "topic": passage["topic"],
            "source_hint": f"Pasaje {p['pid']}: {passage['title']}",
            "text": p["text"],
            "questions": clean,
        })

    if total != TARGET_TOTAL:
        fail(f"el total de preguntas es {total}; debe ser exactamente {TARGET_TOTAL}")

    if errors:
        print("ERROR: los datos de lectura no validan:", file=sys.stderr)
        for e in errors:
            print("  - " + e, file=sys.stderr)
        print(f"({len(errors)} problema(s); no se escribió {OUT})", file=sys.stderr)
        return 1

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"OK -> {OUT}: {len(rows)} párrafos, {len(passages)} pasajes, {total} preguntas")
    for pid in sorted(passages):
        n = sum(len(r["questions"]) for r in rows if r["passage_id"] == pid)
        print(f"  Pasaje {pid} · {passages[pid]['title']}: {n} preguntas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
