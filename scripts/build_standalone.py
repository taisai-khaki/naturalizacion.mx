import hashlib
import json
import os
import random
from datetime import date

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = lambda n: json.load(open(os.path.join(root, "data", n), encoding="utf-8"))

hist = data("questions.json")
passages = data("reading_passages.json")
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

PASSAGES = []
for p in passages:
    qs = []
    for i, q in enumerate(p["questions"]):
        new_options, new_correct, new_tran = shuffle_options(
            q["options"],
            q["correct"],
            q.get("options_en"),
            q.get("options_fa"),
        )
        qs.append({
            "id": 10000 + p["id"] * 100 + i,
            "question": q["question"],
            "options": new_options,
            "correct": new_correct,
            "question_en": q.get("question_en"),
            "options_en": new_tran[0],
            "question_fa": q.get("question_fa"),
            "options_fa": new_tran[1],
        })
    PASSAGES.append({
        "id": p["id"],
        "title": p["title"],
        "topic": p.get("topic"),
        "text": p["text"],
        "text_en": p.get("text_en"),
        "text_fa": p.get("text_fa"),
        "questions": qs,
    })

APP_DATA = {"hist": HIST, "passages": PASSAGES, "iw": iw}

# Versión visible del build: fecha + hash corto del contenido. Cambia cada vez
# que cambian los datos, y permite detectar en un teléfono si quedó una copia
# vieja en caché.
digest = hashlib.sha256(
    json.dumps(APP_DATA, ensure_ascii=False, sort_keys=True).encode("utf-8")
).hexdigest()[:10]
VERSION = f"{date.today().isoformat()}-{len(HIST)}q-{digest}"

tmpl = open(os.path.join(root, "scripts", "standalone.template.html"), encoding="utf-8").read()
payload = json.dumps(APP_DATA, ensure_ascii=False).replace("</", "<\\/")
html = tmpl.replace("/*__DATA__*/", payload)
html = html.replace("/*__VERSION__*/", VERSION)

# `index.html` en la raíz: GitHub Pages lo sirve directamente como la página
# principal del sitio (Settings → Pages → "Deploy from a branch" → main → /).
out = os.path.join(root, "index.html")
open(out, "w", encoding="utf-8").write(html)

print(f"OK -> {out}  ({len(HIST)} history questions, {len(PASSAGES)} passages, {os.path.getsize(out)/1024:.0f} KB)")
