#!/usr/bin/env python3
"""Validación de calidad del banco de preguntas (data/questions.json).

Detecta los defectos que arruinaban el lote OCR añadido en 2026 y evita que
vuelvan a colarse:

  ERRORES (sale con código 1):
  - palabras pegadas por OCR ("Teotihuacán,EstadodeMexico", "delaNuevaEspana")
  - enunciados que no son pregunta ni indicación (sin "¿?" y sin ":" final)
  - opciones que no contienen la respuesta correcta, o != 4, o duplicadas
  - traducción al inglés de pregunta/opciones faltante o desalineada
  - categorías fuera del conjunto canónico, subtema vacío
  - preguntas duplicadas

  AVISOS (no bloquean; tolerados en el banco heredado):
  - explicacion_en ausente (las 571 tarjetas originales no la traían)
  - respuesta larga sin puntuación final (posible recorte)

Uso:  python3 scripts/validate_bank.py
"""
import json
import os
import re
import sys
import unicodedata
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, "data", "questions.json")

CANON_CATS = {"Historia", "Cultura", "Cívica", "Geografía"}

# minúscula seguida de mayúscula dentro de una misma palabra => OCR pegó dos
# (se ignoran nombres legítimos tipo "McLane")
CAMEL = re.compile(r"(?<!M)[a-záéíóúüñ][A-ZÁÉÍÓÚÜÑ]")
END_PUNCT = re.compile(r"[.!?…)»\"\']$")


def norm(s: str) -> str:
    s = s.lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def main() -> int:
    bank = json.load(open(BANK, encoding="utf-8"))
    errors = []
    warnings = []

    def err(qid, msg):
        errors.append(f"[{qid}] {msg}")

    def warn(qid, msg):
        warnings.append(f"[{qid}] {msg}")

    seen = Counter()
    for q in bank:
        qid = q.get("id")
        p = q.get("pregunta", "")
        r = q.get("respuesta", "")
        opts = q.get("opciones", [])
        seen[norm(p)] += 1

        if q.get("categoria") not in CANON_CATS:
            err(qid, f"categoría no canónica: {q.get('categoria')!r}")
        if not q.get("subtema"):
            err(qid, "subtema vacío")
        if "?" not in p and not p.rstrip().endswith(":"):
            err(qid, f"enunciado no es pregunta: {p[:60]!r}")
        for field, label in ((p, "pregunta"), (r, "respuesta")):
            if CAMEL.search(field):
                err(qid, f"palabras pegadas en {label}: {field[:60]!r}")
        for o in opts:
            if CAMEL.search(o):
                err(qid, f"palabras pegadas en opción: {o[:60]!r}")
        if len(r) > 60 and not END_PUNCT.search(r.strip()):
            warn(qid, f"respuesta larga sin puntuación final: {r[:60]!r}")
        if len(opts) != 4:
            err(qid, f"opciones != 4 ({len(opts)})")
        if r not in opts:
            err(qid, "la respuesta correcta no está entre las opciones")
        if len(set(opts)) != len(opts):
            err(qid, "opciones duplicadas")
        if not q.get("pregunta_en"):
            err(qid, "falta pregunta_en")
        if len(q.get("opciones_en", [])) != len(opts):
            err(qid, "opciones_en no alineadas con opciones")
        if not q.get("explicacion_en"):
            warn(qid, "falta explicacion_en")

    dups = {k: v for k, v in seen.items() if v > 1}
    for k, v in dups.items():
        errors.append(f"pregunta duplicada x{v}: {k[:70]!r}")

    if warnings:
        print(f"· {len(warnings)} aviso(s) no bloqueantes (banco heredado).")
    if errors:
        print(f"✗ {len(errors)} problema(s) en {len(bank)} preguntas:")
        for e in errors[:100]:
            print("  -", e)
        return 1

    print(f"✓ Banco válido: {len(bank)} preguntas, sin defectos bloqueantes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
