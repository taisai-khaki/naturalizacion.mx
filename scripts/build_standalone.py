import json, os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = lambda n: json.load(open(os.path.join(root, "data", n), encoding="utf-8"))

hist = data("questions.json")
passages = data("reading_passages.json")
iw = data("interview_writing.json")

HIST = []
for q in hist:
    HIST.append({
        "id": q["id"],
        "pregunta": q["pregunta"],
        "opciones": q["opciones"],
        "correct": q["opciones"].index(q["respuesta"]),
        "explicacion": q.get("explicacion"),
        "categoria": q.get("categoria"),
        "subtema": q.get("subtema"),
        "dificultad": q.get("dificultad"),
        "pregunta_en": q.get("pregunta_en"),
        "opciones_en": q.get("opciones_en"),
        "explicacion_en": q.get("explicacion_en"),
    })

PASSAGES = []
for p in passages:
    qs = []
    for i, q in enumerate(p["questions"]):
        qs.append({
            "id": 10000 + p["id"] * 100 + i,
            "question": q["question"],
            "options": q["options"],
            "correct": q["options"].index(q["correct"]),
            "question_en": q.get("question_en"),
            "options_en": q.get("options_en"),
        })
    PASSAGES.append({
        "id": p["id"],
        "title": p["title"],
        "topic": p.get("topic"),
        "text": p["text"],
        "text_en": p.get("text_en"),
        "questions": qs,
    })

APP_DATA = {"hist": HIST, "passages": PASSAGES, "iw": iw}

tmpl = open(os.path.join(root, "scripts", "standalone.template.html"), encoding="utf-8").read()
payload = json.dumps(APP_DATA, ensure_ascii=False).replace("</", "<\\/")
html = tmpl.replace("/*__DATA__*/", payload)

# `index.html` en la raíz: GitHub Pages lo sirve directamente como la página
# principal del sitio (Settings → Pages → "Deploy from a branch" → main → /).
out = os.path.join(root, "index.html")
open(out, "w", encoding="utf-8").write(html)

print(f"OK -> {out}  ({len(HIST)} history questions, {len(PASSAGES)} passages, {os.path.getsize(out)/1024:.0f} KB)")
