# Banco de preguntas

Datos reales extraídos de las aplicaciones de práctica originales
(`NaturalizacionPrepES_BANCO.exe` / `NaturalizacionPrepES_FINAL2.exe`).

## Archivos

| Archivo | Contenido |
| --- | --- |
| `questions.json` | **3,000** preguntas de Historia y Cultura (4 opciones c/u, con categoría, subtema, dificultad, explicación y fuente). |
| `reading_passages.json` | **39** párrafos de los **6** textos de lectura, con **474** preguntas de comprensión y sus traducciones al inglés y al farsi. Se genera con `python3 scripts/build_reading.py` desde `data/reading/`. |
| `reading/traducciones.tsv` | Las traducciones de lectura, **una fila por frase única** (2,246): `es`, `en`, `fa`. Fuente de verdad de `text_en`/`text_fa` y de las traducciones de cada pregunta. |
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

Cada párrafo lleva además `text_en` y `text_fa`, y cada pregunta `question_en`,
`question_fa`, `options_en[]` y `options_fa[]` (mismo orden y longitud que `options`).

Fuentes editables: `data/reading/pasajes.txt` (textos) y `data/reading/preguntas_1..6.txt`
(preguntas, formato `@P n.k` / `Q:` / `*` correcta / `-` distractor). Después de editarlas:
`python3 scripts/build_reading.py` — que también aplica `reading/traducciones.tsv` y
**falla** si a alguna frase le falta traducción (`--allow-missing-traducciones` para
trabajar a medias).

#### `reading/traducciones.tsv`

Una fila por frase, en el **orden canónico** que produce el script: el texto de cada
párrafo y, por cada pregunta, su enunciado seguido de sus cuatro opciones, sin repetir
las frases que ya aparecieron (por eso 474 preguntas y 1,896 huecos de opción se
quedan en 2,246 filas). Columnas separadas por tabulador, y la primera línea
es el comentario `# es`, `en`, `fa`.

- La opción correcta traducida debe ser un **fragmento literal** del párrafo traducido,
  en español, en inglés y en farsi: así la pregunta se puede responder con solo la
  traducción. Se compara sin mayúsculas, sin acentos y sin ZWNJ (U+200C).
- El farsi usa ZWNJ, `،` `؛` y `؟`, y los números como en el original.

```bash
python3 scripts/reading_translations.py status      # cuántas filas faltan y en qué índices
python3 scripts/reading_translations.py show 500 540 # ver filas (500 inclusive, 540 exclusive)
python3 scripts/reading_translations.py fill filas.tsv # aplicar un lote (idx<TAB>en<TAB>fa)
python3 scripts/reading_translations.py qa          # huecos, farsi con letras latinas, desalineaciones
```

Si cambias un texto o una pregunta, `python3 scripts/reading_translations.py sync`
reordena el TSV conservando las traducciones de las frases que sigan igual.

### `interview_writing.json`
- `interview[]` → `{ question, tip }`
- `writing[]` → temas de redacción
- `writingChecklist[]` y `writingWordRange` → guía para la redacción (80–120 palabras)

> Nota: los bancos originales vienen **sin acentos** (p. ej. "opcion", "Ano").
> Restaurar la ortografía/acentuación está en la lista de mejoras pendientes.
