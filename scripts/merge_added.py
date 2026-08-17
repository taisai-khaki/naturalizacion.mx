import json, importlib.util, os, re, unicodedata

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_q(path):
    spec = importlib.util.spec_from_file_location("qa", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.Q

added = []
for f in ["qa_batch1.py", "qa_batch2.py", "qa_batch3.py", "qa_batch4.py",
          "qa_batch5.py", "qa_batch6.py", "qa_batch7.py", "qa_batch8.py"]:
    p = os.path.join(root, "scripts", f)
    if os.path.exists(p):
        added.extend(load_q(p))

CAT_MAP = {"Historia": "Historia", "Cultura": "Cultura", "Civica": "Civica",
           "Geografia": "Geografia", "Ciencia y deportes": "Cultura",
           "Artes": "Cultura", "Gastronomia": "Cultura"}

def norm(s):
    s = s.lower(); s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("ñ","n"); s = re.sub(r"[^a-z0-9 ]+"," ",s)
    return re.sub(r"\s+"," ",s).strip()

bank = json.load(open(os.path.join(root, "data", "questions.json"), encoding="utf-8"))
existing = {norm(q["pregunta"]) for q in bank}
next_id = max(q["id"] for q in bank) + 1

n_added = 0
for a in added:
    if norm(a["pregunta"]) in existing:
        continue
    if a["respuesta"] not in a["opciones"]:
        print("SKIP (respuesta no en opciones):", a["pregunta"])
        continue
    bank.append({
        "id": next_id, "seccion": "historia_cultura",
        "categoria": CAT_MAP.get(a["categoria"], "Cultura"),
        "subtema": a["subtema"], "dificultad": "media",
        "pregunta": a["pregunta"], "respuesta": a["respuesta"],
        "opciones": a["opciones"], "explicacion": a.get("explicacion", ""),
        "fuente": "Imágenes del usuario (flashcards del examen de naturalización)",
        "pregunta_en": a.get("pregunta_en"), "opciones_en": a.get("opciones_en"),
        "explicacion_en": a.get("explicacion_en"),
    })
    existing.add(norm(a["pregunta"]))
    next_id += 1
    n_added += 1

json.dump(bank, open(os.path.join(root, "data", "questions.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print(f"Merged {n_added} new questions. Bank total now: {len(bank)}")
