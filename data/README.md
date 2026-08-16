# Banco de preguntas

Datos reales extraídos de las aplicaciones de práctica originales
(`NaturalizacionPrepES_BANCO.exe` / `NaturalizacionPrepES_FINAL2.exe`).

## Archivos

| Archivo | Contenido |
| --- | --- |
| `questions.json` | **3,000** preguntas de Historia y Cultura (4 opciones c/u, con categoría, subtema, dificultad, explicación y fuente). |
| `reading_passages.json` | **16** pasajes de lectura con **6** preguntas cada uno (**96** preguntas de comprensión). |
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
Cada pasaje trae `title`, `topic`, `source_hint`, `text` y `questions[]`
con `question`, `options[]` y `correct`.

### `interview_writing.json`
- `interview[]` → `{ question, tip }`
- `writing[]` → temas de redacción
- `writingChecklist[]` y `writingWordRange` → guía para la redacción (80–120 palabras)

> Nota: los bancos originales vienen **sin acentos** (p. ej. "opcion", "Ano").
> Restaurar la ortografía/acentuación está en la lista de mejoras pendientes.
