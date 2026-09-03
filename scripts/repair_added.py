#!/usr/bin/env python3
"""Repara el lote de 231 preguntas añadidas por OCR (ids 605-835).

El lote original venía de capturas de "Cuestionarios" (data/IMG_0453-0540.png)
pero el OCR produjo: palabras pegadas ("Teotihuacán,EstadodeMexico"), acentos
perdidos, respuestas truncadas a media palabra, enunciados que no eran
preguntas ("Quintana Roo?") y opciones distractoras tomadas al azar de TODO el
banco (una persona como opción de una fecha, etc.).

Este script:
  1. Elimina las entradas con fuente "Cuestionarios" del banco.
  2. Re-incorpora la versión revisada y corregida a mano que vive en
     data/questions_added_clean.json (deduplicada, con acentos, enunciados en
     forma de pregunta, respuestas completas, 3 distractores del MISMO tipo que
     la respuesta y traducción al inglés alineada).
  3. Renormaliza categorías en todo el banco (Cívica / Geografía con acento).
  4. Reasigna ids consecutivos y escribe data/questions.json.

Es idempotente: correrlo dos veces deja el mismo banco.
"""
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, "data", "questions.json")
CLEAN = os.path.join(ROOT, "data", "questions_added_clean.json")

CAT_NORM = {
    "Civica": "Cívica",
    "Cívica": "Cívica",
    "Geografia": "Geografía",
    "Geografía": "Geografía",
    "Historia": "Historia",
    "Cultura": "Cultura",
}

ADDED_SOURCE = (
    "Extraído de capturas Cuestionarios (data/IMG_0453-0540.png) — "
    "OCR RapidOCR, revisado y corregido a mano"
)

# Fuente EXACTA del lote OCR dañado (solo ese se elimina; el reparado se conserva).
DAMAGED_SOURCE = (
    "Extraído de capturas Cuestionarios (data/IMG_0453-0540.png) — OCR RapidOCR"
)


def norm(s: str) -> str:
    s = s.lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def main() -> None:
    bank = json.load(open(BANK, encoding="utf-8"))
    clean = json.load(open(CLEAN, encoding="utf-8"))

    # 1) Quitar el lote OCR dañado y cualquier lote reparado previo, para
    #    reconstruir de forma idempotente.
    kept = [
        q
        for q in bank
        if (q.get("fuente") or "") not in (DAMAGED_SOURCE, ADDED_SOURCE)
    ]
    removed = len(bank) - len(kept)

    # Renormalizar categorías de lo conservado.
    for q in kept:
        q["categoria"] = CAT_NORM.get(q.get("categoria", ""), q.get("categoria"))

    # Conceptos que el banco bueno ya cubre: no los duplicamos.
    existing = {norm(q["pregunta"]) for q in kept}

    # 2) Reconstruir el lote corregido con ids nuevos.
    next_id = max(q["id"] for q in kept) + 1
    added = []
    skipped = 0
    for c in clean:
        if norm(c["q"]) in existing:
            skipped += 1
            continue
        opciones = [c["a"]] + [d[0] for d in c["d"]]
        opciones_en = [c["aen"]] + [d[1] for d in c["d"]]
        assert len(opciones) == 4, f"opciones != 4 en {c['q']}"
        assert len(set(opciones)) == 4, f"opciones duplicadas en {c['q']}"
        assert "?" in c["q"] or c["q"].rstrip().endswith(":"), f"enunciado sin '?' en {c['q']}"
        added.append(
            {
                "id": next_id,
                "seccion": "historia_cultura",
                "categoria": CAT_NORM[c["cat"]],
                "subtema": c["sub"],
                "dificultad": "media",
                "pregunta": c["q"],
                "respuesta": c["a"],
                "opciones": opciones,
                "explicacion": c["e"],
                "fuente": ADDED_SOURCE,
                "pregunta_en": c["qen"],
                "opciones_en": opciones_en,
                "explicacion_en": c["een"],
            }
        )
        existing.add(norm(c["q"]))
        next_id += 1

    out = kept + added
    json.dump(out, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # Resumen de verificación.
    merged_words = [
        q["id"]
        for q in out
        if re.search(r"[a-záéíóúüñ][A-ZÁÉÍÓÚÜÑ]", q["pregunta"])
    ]
    print(f"Eliminadas (OCR dañado): {removed}")
    print(f"Omitidas (concepto ya cubierto por el banco bueno): {skipped}")
    print(f"Re-incorporadas (corregidas): {len(added)}")
    print(f"Total del banco ahora: {len(out)}")
    print(f"Palabras pegadas restantes en preguntas: {len(merged_words)}")


if __name__ == "__main__":
    main()
