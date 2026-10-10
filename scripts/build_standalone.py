import hashlib
import json
import os
import random
from datetime import date

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = lambda n: json.load(open(os.path.join(root, "data", n), encoding="utf-8"))

hist = data("questions.json")
lectura = data("reading_passages.json")  # una fila por párrafo (ver scripts/build_reading.py)
iw = data("interview_writing.json")


def shuffle_options(options, correct_text, *translation_lists):
    """Shuffle options (and any aligned translations) and return the new
    index of the correct answer. Keeps all language arrays in sync."""
    original_idx = options.index(correct_text)
    permutation = list(range(len(options)))
    random.shuffle(permutation)
    new_options = [options[i] for i in permutation]
    new_lists = []
    for lst in translation_lists:
        new_lists.append([lst[i] for i in permutation] if lst is not None else None)
    return new_options, permutation.index(original_idx), new_lists


HIST = []
for q in hist:
    new_options, new_correct, new_tran = shuffle_options(
        q["opciones"],
        q["respuesta"],
        q.get("opciones_en"),
        q.get("opciones_fa"),
    )
    HIST.append({
        "id": q["id"],
        "pregunta": q["pregunta"],
        "opciones": new_options,
        "correct": new_correct,
        "explicacion": q.get("explicacion"),
        "categoria": q.get("categoria"),
        "subtema": q.get("subtema"),
        "dificultad": q.get("dificultad"),
        "pregunta_en": q.get("pregunta_en"),
        "opciones_en": new_tran[0],
        "explicacion_en": q.get("explicacion_en"),
        "pregunta_fa": q.get("pregunta_fa"),
        "opciones_fa": new_tran[1],
        "explicacion_fa": q.get("explicacion_fa"),
    })

# Lectura: una entrada por párrafo. Ids de pregunta 50000 + id_párrafo*100 + i,
# separados del banco de Historia (ids 1..728).
LECTURA = []
for p in lectura:
    qs = []
    for i, q in enumerate(p["questions"]):
        assert i < 100, "más de 100 preguntas en un párrafo"
        # Las traducciones viajan en el mismo orden que las opciones: se pasan a
        # shuffle_options para que las permuten juntas y "opciones_en[3]" siga
        # siendo la traducción de "options[3]" después de barajar.
        en, fa = q.get("options_en") or [], q.get("options_fa") or []
        if not en or not fa:
            raise SystemExit(
                f'el párrafo {p["id"]} pregunta {i + 1} no tiene traducciones: '
                "ejecuta primero python3 scripts/build_reading.py"
            )
        assert len(en) == len(fa) == len(q["options"]), (
            f'párrafo {p["id"]} pregunta {i + 1}: las traducciones de las opciones '
            f"deben tener {len(q['options'])} elementos"
        )
        new_options, new_correct, (new_en, new_fa) = shuffle_options(
            q["options"],
            q["options"][q["correct"]],
            en,
            fa,
        )
        qs.append({
            "id": 50000 + p["id"] * 100 + i,
            "question": q["question"],
            "options": new_options,
            "correct": new_correct,
            "question_en": q["question_en"],
            "question_fa": q["question_fa"],
            "options_en": new_en,
            "options_fa": new_fa,
        })
    LECTURA.append({
        "id": p["id"],
        "passage_id": p["passage_id"],
        "passage": p["passage"],
        "paragraph": p["paragraph"],
        "title": p["title"],
        "topic": p.get("topic"),
        "text": p["text"],
        "text_en": p["text_en"],
        "text_fa": p["text_fa"],
        "questions": qs,
    })

APP_DATA = {"hist": HIST, "lectura": LECTURA, "iw": iw}

# Versión visible del build: fecha + hash corto del contenido. Cambia cada vez
# que cambian los datos, y permite detectar en un teléfono si quedó una copia
# vieja en caché.
digest = hashlib.sha256(
    json.dumps(APP_DATA, ensure_ascii=False, sort_keys=True).encode("utf-8")
).hexdigest()[:10]
VERSION = f"{date.today().isoformat()}-{len(HIST)}q-{sum(len(p['questions']) for p in LECTURA)}l-{digest}"

tmpl = open(os.path.join(root, "scripts", "standalone.template.html"), encoding="utf-8").read()
payload = json.dumps(APP_DATA, ensure_ascii=False).replace("</", "<\\/")
html = tmpl.replace("/*__DATA__*/", payload)
html = html.replace("/*__VERSION__*/", VERSION)

# Mapa de ids eliminados por la deduplicación -> id conservado. Al cambiar la
# versión de datos, el progreso guardado bajo el id viejo se reasigna al nuevo
# (las tarjetas duplicadas se fusionan conservando el mejor contador), en vez
# de purgar el progreso de usuarios existentes.
remap_path = os.path.join(root, "data", "dedupe_remap.json")
remap = json.load(open(remap_path, encoding="utf-8")) if os.path.exists(remap_path) else {}
html = html.replace("/*__FC_REMAP__*/", json.dumps(remap, ensure_ascii=False))

# `index.html` en la raíz: GitHub Pages lo sirve directamente como la página
# principal del sitio (Settings → Pages → "Deploy from a branch" → main → /).
out = os.path.join(root, "index.html")
open(out, "w", encoding="utf-8").write(html)

print(f"OK -> {out}  ({len(HIST)} history questions, {len(LECTURA)} reading paragraphs, {sum(len(p['questions']) for p in LECTURA)} reading questions, {os.path.getsize(out)/1024:.0f} KB)")
