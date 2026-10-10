#!/usr/bin/env python3
"""Traducciones (inglés y farsi) del banco de lectura.

El banco de lectura se compone de 39 párrafos con 474 preguntas. Cada texto que
hay que traducir aparece muchas veces repetido (la misma opción en varias
preguntas, y la respuesta correcta es siempre un fragmento LITERAL del párrafo),
así que las traducciones se guardan **una sola vez por frase en español** en:

    data/reading/traducciones.tsv

Formato (TSV, 3 columnas, cabecera con `#`):

    # es        en      fa

Una fila por frase única, en el orden canónico que produce `canonical()`
(texto de cada párrafo, y por cada pregunta su enunciado y sus 4 opciones).
Ese fichero es la fuente de verdad: `build_reading.py` lo usa para escribir
`text_en`/`text_fa` en cada párrafo y `question_en`/`question_fa`/
`options_en`/`options_fa` en cada pregunta de `data/reading_passages.json`,
que es lo que consumen `build_standalone.py` y `npm run db:seed`.

Uso:

    python3 scripts/reading_translations.py status          # cobertura
    python3 scripts/reading_translations.py sync            # reordena/añade filas nuevas
    python3 scripts/reading_translations.py show 0 40       # imprimir rango (col 1 = índice)
    python3 scripts/reading_translations.py fill chunk.tsv   # aplica "idx<TAB>en<TAB>fa"
    python3 scripts/reading_translations.py qa              # coherencia y alineación
    python3 scripts/reading_translations.py apply           # reescribe reading_passages.json

El idioma de origen del farsi es el inglés revisado (igual que en
`add_farsi_translations.py`), pero el texto persa se escribe a mano en el TSV:
ninguna parte del proceso depende de un servicio de traducción en línea.
"""

from __future__ import annotations

import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
READING_PATH = os.path.join(ROOT, "data", "reading_passages.json")
TSV_PATH = os.path.join(ROOT, "data", "reading", "traducciones.tsv")

HEADER = "\t".join(["# es", "en", "fa"])

EN_FIELDS = ("text_en", "question_en", "options_en")
FA_FIELDS = ("text_fa", "question_fa", "options_fa")

# Palabras funcionales: se ignoran al comprobar que una traducción habla de lo
# mismo que el original (detecta filas desalineadas, no la gramática).
STOP_ES = set(
    """de la el los las un una unos unas y o u que en con para por se su sus al del es son fue
fueron ser estar esta este estos estas esa ese esos esa también tambien a lo como más mas muy
todo toda todos todas entre desde hasta durante sobre tras cada quien quienes cuál cuáles cual
cuando donde cómo como hay ha han había habían ha""".split()
)
STOP_EN = set(
    """of the a an and or to in on for with is are was were be been it its this that these
those as at from by about which who whom whose when where how there their them they you
more most than then not no yes all any""".split()
)
STOP_FA = set(
    """از به با برای که این آن را در و یا هم نیست است بود می خود زیرا اما اگر تنها نیز
more most اینان آنان آنجا اینجا""".split()
)


# ---------------------------------------------------------------- fuente de datos
def load_rows(path: str = READING_PATH):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def canonical(rows) -> list[str]:
    """Frases únicas en español, en orden canónico (sin duplicados)."""
    out: list[str] = []
    seen: set[str] = set()

    def add(text: str) -> None:
        if text and text not in seen:
            seen.add(text)
            out.append(text)

    for row in rows:
        add(row["text"])
        for question in row["questions"]:
            add(question["question"])
            for option in question["options"]:
                add(option)
    return out


def load_tsv(path: str = TSV_PATH) -> dict[str, dict[str, str]]:
    table: dict[str, dict[str, str]] = {}
    if not os.path.exists(path):
        return table
    with open(path, encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, 1):
            line = raw.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            cols = line.split("\t")
            if len(cols) != 3:
                raise SystemExit(
                    f"ERROR: {os.path.relpath(path, ROOT)}:{lineno}: se esperaban 3 "
                    f"columnas separadas por TAB (hay {len(cols)})"
                )
            es, en, fa = (c.strip() for c in cols)
            table[es] = {"en": en, "fa": fa}
    return table


def save_tsv(strings: list[str], table: dict[str, dict[str, str]], path: str = TSV_PATH) -> None:
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8") as fh:
        fh.write(HEADER + "\n")
        for text in strings:
            tr = table.get(text, {})
            fh.write("\t".join([text, tr.get("en", ""), tr.get("fa", "")]) + "\n")
    os.replace(temporary, path)


def rows_from_tsv(path: str = TSV_PATH) -> list[tuple[str, str, str]]:
    rows = []
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            es, en, fa = (line.split("\t") + ["", ""])[:3]
            rows.append((es.strip(), en.strip(), fa.strip()))
    return rows


# ---------------------------------------------------------------- comandos
def cmd_sync() -> int:
    """Reescribe el TSV con el orden canónico: conserva lo traducido, añade huecos."""
    strings = canonical(load_rows())
    table = load_tsv()
    save_tsv(strings, table)
    stale = [es for es in table if es not in set(strings)]
    missing_en = [es for es in strings if not table.get(es, {}).get("en")]
    missing_fa = [es for es in strings if not table.get(es, {}).get("fa")]
    print(f"{len(strings)} frases únicas en {os.path.relpath(TSV_PATH, ROOT)}")
    print(f"  sin inglés: {len(missing_en)} · sin farsi: {len(missing_fa)} · obsoletas: {len(stale)}")
    return 0


def cmd_status() -> int:
    strings = canonical(load_rows())
    table = load_tsv()
    have_en = sum(1 for es in strings if table.get(es, {}).get("en"))
    have_fa = sum(1 for es in strings if table.get(es, {}).get("fa"))
    print(f"frases únicas: {len(strings)} · inglés: {have_en} · farsi: {have_fa}")
    gaps = [i for i, es in enumerate(strings) if not (table.get(es, {}).get("en") and table.get(es, {}).get("fa"))]
    if gaps:
        first, last = gaps[0], gaps[-1]
        print(f"  faltan {len(gaps)} (rangos: {first}-{last}; ver 'show {first} {min(last + 1, len(strings))}')")
    return 0


def cmd_show(start: int, end: int) -> int:
    """Imprime el rango [start, end) con su índice, para traducir sobre él."""
    table = load_tsv()
    strings = canonical(load_rows())
    for idx in range(start, min(end, len(strings))):
        es = strings[idx]
        tr = table.get(es, {})
        flag = "" if (tr.get("en") and tr.get("fa")) else "\t[ Vacio ]"
        print(f"{idx}\t{es}{flag}")
    return 0


def cmd_fill(path: str) -> int:
    """Aplica un fragmento de traducción: 'idx<TAB>en<TAB>fa' por línea."""
    strings = canonical(load_rows())
    table = load_tsv()
    touched = 0
    problems = []
    with open(path, encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, 1):
            line = raw.rstrip("\n")
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            cols = line.split("\t")
            if len(cols) != 3:
                problems.append(f"línea {lineno}: se esperaban 3 columnas (idx, en, fa)")
                continue
            try:
                idx = int(cols[0].strip())
            except ValueError:
                problems.append(f"línea {lineno}: índice inválido {cols[0]!r}")
                continue
            if not 0 <= idx < len(strings):
                problems.append(f"línea {lineno}: índice {idx} fuera de rango 0..{len(strings) - 1}")
                continue
            es, en, fa = strings[idx], cols[1].strip(), cols[2].strip()
            if not en or not fa:
                problems.append(f"línea {lineno}: traducción vacía para {es!r}")
                continue
            table[es] = {"en": en, "fa": fa}
            touched += 1
    if problems:
        for problem in problems:
            print(f"ERROR: {problem}", file=sys.stderr)
        return 1
    save_tsv(strings, table)
    print(f"aplicadas {touched} traducciones desde {os.path.basename(path)}")
    return 0


# ---------------------------------------------------------------- aplicar al JSON
def apply_translations(rows, table=None, *, strict: bool = True) -> list[str]:
    """Escribe las traducciones en las filas (en memoria) y devuelve los errores."""
    table = load_tsv() if table is None else table
    errors: list[str] = []

    def translate(text: str, lang: str, where: str) -> str:
        entry = table.get(text) or {}
        value = (entry.get(lang) or "").strip()
        if not value:
            errors.append(f"{where}: falta la traducción al {('inglés' if lang == 'en' else 'farsi')} de: {text}")
        return value

    for row in rows:
        row["text_en"] = translate(row["text"], "en", f"párrafo {row['id']} texto")
        row["text_fa"] = translate(row["text"], "fa", f"párrafo {row['id']} texto")
        for number, question in enumerate(row["questions"], 1):
            where = f"párrafo {row['id']} pregunta {number}"
            question["question_en"] = translate(question["question"], "en", f"{where} enunciado")
            question["question_fa"] = translate(question["question"], "fa", f"{where} enunciado")
            question["options_en"] = [translate(o, "en", f"{where} opción") for o in question["options"]]
            question["options_fa"] = [translate(o, "fa", f"{where} opción") for o in question["options"]]

    errors.extend(alignment_errors(rows))
    if errors and strict:
        raise SystemExit(
            "ERROR: las traducciones de lectura están incompletas o desalineadas:\n  - "
            + "\n  - ".join(errors[:20])
            + (f"\n  ... (+{len(errors) - 20} más)" if len(errors) > 20 else "")
            + f"\n\nCompleta {os.path.relpath(TSV_PATH, ROOT)} "
            "(python3 scripts/reading_translations.py sync && ... fill chunk.tsv) "
            "o usa --allow-missing-traducciones."
        )
    return errors


def fold(text: str) -> str:
    """Minúsculas, sin acentos ni puntuación, para comparar fragmentos."""
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^0-9a-zñ\u0600-\u06ff ]+", " ", text).replace(" ", "")


def alignment_errors(rows) -> list[str]:
    """La respuesta correcta, traducida, debe seguir siendo un fragmento del texto.

    En español la opción correcta es siempre un trozo literal del párrafo; si la
    traducción del enunciado y la del párrafo se escriben con palabras distintas,
    el estudiante ya no puede localizar la respuesta en el texto.
    """
    errors = []
    for row in rows:
        for language in ("en", "fa"):
            source = fold(row.get(f"text_{language}") or "")
            if not source:
                continue
            for number, question in enumerate(row["questions"], 1):
                option = (question.get(f"options_{language}") or [])[question["correct"]]
                if fold(option) not in source:
                    errors.append(
                        f"párrafo {row['id']} pregunta {number} ({language}): la respuesta "
                        f"«{option}» no aparece en el texto traducido"
                    )
    return errors


def cmd_apply() -> int:
    rows = load_rows()
    apply_translations(rows)
    with open(READING_PATH, "w", encoding="utf-8") as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    questions = sum(len(row["questions"]) for row in rows)
    print(f"OK -> {os.path.relpath(READING_PATH, ROOT)}: {len(rows)} párrafos y {questions} preguntas con traducción al inglés y al farsi")
    return 0


# ---------------------------------------------------------------- control de calidad
def content_words(text: str, stops: set[str]) -> set[str]:
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    words = re.findall(r"[a-z0-9\u0600-\u06ff]{3,}", text)
    return {w for w in words if w not in stops}


def cmd_qa() -> int:
    """Avisos de calidad: traducciones vacías, duplicadas o que no comparten nada con el original."""
    table = load_tsv()
    strings = canonical(load_rows())
    warnings = []

    for text in strings:
        entry = table.get(text) or {}
        en, fa = entry.get("en", ""), entry.get("fa", "")
        if not en or not fa:
            continue
        # Una palabra suelta se traduce con dos o tres letras ("escasa" -> "scarce"),
        # así que la longitud solo es sospechosa en frases largas.
        if len(text.split()) > 3 and (len(set(en)) < 4 or len(set(fa)) < 4):
            warnings.append(f"traducción sospechosamente corta: {text!r}")
        # El inglés y el español casi nunca comparten palabras, así que comparar
        # raíces no diría nada útil; lo que sí delata un descuido es la celda que
        # repite el español sin traducirlo.
        # Los topónimos y los cognados ("erosión" -> "erosion") se escriben igual en
        # los dos idiomas; solo una frase entera idélica delata una celda sin traducir.
        if len(text.split()) >= 3:
            if fold(en) == fold(text):
                warnings.append(f"el inglés repite el español sin traducir: {text!r}")
            if fold(fa) == fold(text):
                warnings.append(f"el farsi repite el español sin traducir: {text!r}")
        if re.search(r"[A-Za-z]", fa):
            warnings.append(f"el farsi contiene letras latinas: {text!r} -> {fa!r}")
        if "?" in text and "؟" not in fa:
            warnings.append(f"pregunta sin signo de interrogación persa: {text!r} -> {fa!r}")

    # Una misma traducción no debería usarse para dos frases distintas (salvo cortas).
    by_en: dict[str, set[str]] = {}
    for text in strings:
        en = (table.get(text) or {}).get("en", "")
        if en:
            by_en.setdefault(en, set()).add(text)
    for en, originals in by_en.items():
        if len(originals) > 1:
            warnings.append(f"una misma traducción cubre {len(originals)} frases: {en!r}")

    rows = load_rows()
    for error in alignment_errors(rows):
        warnings.append(error)

    print(f"avisos: {len(warnings)}")
    for warning in warnings[:60]:
        print("  - " + warning)
    if len(warnings) > 60:
        print(f"  ... (+{len(warnings) - 60} más)")
    return 0


def main(argv: list[str]) -> int:
    command = argv[0] if argv else "status"
    if command == "status":
        return cmd_status()
    if command == "sync":
        return cmd_sync()
    if command == "apply":
        return cmd_apply()
    if command == "qa":
        return cmd_qa()
    if command == "fill":
        return cmd_fill(argv[1])
    if command == "show":
        return cmd_show(int(argv[1]), int(argv[2]) if len(argv) > 2 else len(canonical(load_rows())))
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
