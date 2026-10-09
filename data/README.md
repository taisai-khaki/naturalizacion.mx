# Banco de preguntas

Datos reales extraídos de las aplicaciones de práctica originales
(`NaturalizacionPrepES_BANCO.exe` / `NaturalizacionPrepES_FINAL2.exe`).

## Archivos

| Archivo | Contenido |
| --- | --- |
| `questions.json` | **3,000** preguntas de Historia y Cultura (4 opciones c/u, con categoría, subtema, dificultad, explicación y fuente). |
| `reading_passages.json` | **39** párrafos de los **6** textos de lectura, con **474** preguntas de comprensión. Se genera con `python3 scripts/build_reading.py` desde `data/reading/`. |
| `interview_writing.json` | **10** preguntas de entrevista (con tips) y **5** temas de redacción. |

## Cómo cargar los datos

```bash
npx tsx scripts/seed.ts
```

El script trunca las tablas y vuelve a insertar todo (es idempotente).

## Formato

### `questions.json` (Historia/Cultura)
```json
{
  "id": 1,
  "seccion": "historia_cultura",
  "categoria": "Historia",
  "subtema": "Independencia",
  "dificultad": "media",
  "pregunta": "Selecciona la opcion correcta: Ano de inicio de la Independencia de Mexico",
  "respuesta": "1810",
  "opciones": ["1857", "1821", "1910", "1810"],
  "explicacion": "Respuesta correcta: 1810.",
  "fuente": "SRE - Guia de estudios de naturalizacion..."
}
```

### `reading_passages.json` (Lectura)
Una fila por párrafo: `id` (1–39), `passage_id` (1–6), `passage` (nombre del texto),
`paragraph` (número dentro del texto), `title` (`Párrafo 1 · Leyenda del maíz`), `topic`,
`source_hint`, `text` y `questions[]` con `question`, `options[]` y `correct` (índice).

Fuentes editables: `data/reading/pasajes.txt` (textos) y `data/reading/preguntas_1..6.txt`
(preguntas, formato `@P n.k` / `Q:` / `*` correcta / `-` distractor). Después de editarlas:
`python3 scripts/build_reading.py`.

### `interview_writing.json`
- `interview[]` → `{ question, tip }`
- `writing[]` → temas de redacción
- `writingChecklist[]` y `writingWordRange` → guía para la redacción (80–120 palabras)

> Nota: los bancos originales vienen **sin acentos** (p. ej. "opcion", "Ano").
> Restaurar la ortografía/acentuación está en la lista de mejoras pendientes.
