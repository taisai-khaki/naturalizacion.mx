#!/usr/bin/env python3
"""Elimina preguntas casi idénticas (duplicadas) del banco.

El banco creció en capas: primero las ~604 preguntas originales y luego un lote
OCR 2026 (ids 605-728) con 124 preguntas, de las cuales ~45 eran en realidad el
MISMO concepto ya cubierto por el banco bueno, redactado de forma distinta.
Ejemplo: «¿Cuál es el estado con mayor producción de calzado (zapatos)?»
(id 364) y «¿Qué estado es el mayor productor de calzado en México?» (id 694)
piden lo mismo y tienen la misma respuesta (Guanajuato).

Eso hacía que una misma pregunta apareciera dos veces en el banco, en el
simulador y en las flashcards, y que el usuario la repitiera una y otra vez
sin que el contador avanzara como esperaba.

Este script:
  1. Agrupa preguntas con la MISMA respuesta normalizada y enunciados lo
     bastante parecidos (misma pregunta redactada distinto).
  2. Conserva una sola versión por concepto (la de mejor calidad).
  3. Escribe data/questions.json (ids sin renumerar — los ids de las
     preguntas conservadas no cambian).
  4. Escribe data/dedupe_remap.json con el mapa {id_eliminado: id_conservado}
     para migrar el progreso guardado en el navegador (y en la base si se
     re-siembra).

Es idempotente/intencional: corre sobre el banco ya deduplicado y no elimina
nada.

Uso:  python3 scripts/dedupe_duplicates.py
"""
import difflib
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, "data", "questions.json")
REMAP_OUT = os.path.join(ROOT, "data", "dedupe_remap.json")

# Pares que el algoritmo automático no alcanza (similitud de enunciado baja)
# pero que son el mismo concepto y deben unificarse: {id_eliminado: id_conservado}.
EXTRA_DUPES = {
    # 53 (charrería 1933) / 708 (deporte nacional 1933) / 599 (deporte nacional)
    599: 53,
    708: 53,
    # Torre Latinoamericana (1956)
    562: 347,
    # Estado con mayor producción de calzado (Guanajuato) — el caso reportado
    694: 364,
    # Autor de la traición contra Madero
    677: 303,
    # Fundador de «El Pensador Mexicano»
    659: 594,
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode("utf-8")
    s = s.lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def tokens(s: str) -> set:
    return set(norm(s).split())


def tokens_jaccard(a: str, b: str) -> float:
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def options_jaccard(a, b) -> float:
    sa = {norm(x) for x in a}
    sb = {norm(x) for x in b}
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def q_sim(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def expl_sim(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def is_duplicate(qa, qb) -> bool:
    """¿qa y qb son el mismo concepto (misma respuesta, misma pregunta)?"""
    if norm(qa.get("respuesta", "")).rstrip(".") != norm(qb.get("respuesta", "")).rstrip("."):
        return False
    qr = q_sim(qa["pregunta"], qb["pregunta"])
    if qr >= 0.75:
        return True
    if qr >= 0.55:
        er = expl_sim(qa.get("explicacion") or "", qb.get("explicacion") or "")
        tj = tokens_jaccard(qa["pregunta"], qb["pregunta"])
        return er >= 0.35 and tj >= 0.45
    return False


def quality(q) -> tuple:
    """Mayor = mejor versión para conservar."""
    resp = str(q.get("respuesta", "")).strip()
    opts = [str(o).strip() for o in q.get("opciones", [])]
    # Texto limpio (sin puntos colgados tipo "Guanajuato.") antes que todo
    clean = 0 if (resp and not resp.endswith(".") and not any(o.endswith(".") for o in opts)) else -2
    has_en = bool(q.get("explicacion_en"))
    explica = norm(q.get("explicacion") or "")
    return (
        clean,
        2 if has_en else 0,
        min(len(explica) / 200.0, 1.0),
        1 if int(q["id"]) < 605 else 0,  # original antes que lote OCR
        -int(q["id"]),  # ante todo lo demás, el id más bajo
    )


def main() -> None:
    bank = json.load(open(BANK, encoding="utf-8"))
    bank = sorted(bank, key=lambda q: int(q["id"]))

    # Unión-find sobre pares duplicados
    parent = {q["id"]: q["id"] for q in bank}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    pairs = []
    for i in range(len(bank)):
        for j in range(i + 1, len(bank)):
            if is_duplicate(bank[i], bank[j]):
                union(bank[i]["id"], bank[j]["id"])
                pairs.append((bank[i]["id"], bank[j]["id"]))

    # Aplicar extras explícitos
    for old, keep in EXTRA_DUPES.items():
        if old in parent and keep in parent and old != keep:
            union(old, keep)
            pairs.append((old, keep))

    groups = {}
    for q in bank:
        groups.setdefault(find(q["id"]), []).append(q)

    remap = {}
    kept_ids = set()
    removed = []
    for root, members in groups.items():
        if len(members) == 1:
            kept_ids.add(members[0]["id"])
            continue
        # Elegir el de mayor calidad
        best = max(members, key=quality)
        kept_ids.add(best["id"])
        for m in members:
            if m["id"] != best["id"]:
                removed.append(m["id"])
                remap[m["id"]] = best["id"]

    out = [q for q in bank if q["id"] in kept_ids]
    json.dump(out, open(BANK, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(
        {str(k): v for k, v in sorted(remap.items())},
        open(REMAP_OUT, "w", encoding="utf-8"),
        ensure_ascii=False,
        indent=2,
    )

    print(f"Preguntas antes: {len(bank)}")
    print(f"Duplicados eliminados: {len(remap)}")
    print(f"Banco ahora: {len(out)}")
    print("\nMapa de ids (progreso antiguo -> nuevo):")
    for old, keep in sorted(remap.items()):
        qold = next(q for q in bank if q["id"] == old)
        qnew = next(q for q in bank if q["id"] == keep)
        print(f"  {old:>4} -> {keep:>4} | {qold['pregunta'][:55]!r}")
        print(f"        conserva: {qnew['pregunta'][:55]!r}")


if __name__ == "__main__":
    main()
