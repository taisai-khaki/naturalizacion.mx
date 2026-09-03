# 🇲🇽 Naturalización MX — Examen de Ciudadanía

App web para practicar el **examen de naturalización mexicana**, con el banco de
preguntas real extraído de las aplicaciones de escritorio originales
(`NaturalizacionPrepES_*.exe`) y de las **flashcards en imágenes** que aportaste.

## Qué incluye

| Sección | Detalle |
| --- | --- |
| **Simulador Historia/Cultura** | 10 preguntas al azar de un banco limpio de **728**. Apruebas con **8/10**. |
| **Examen de Lectura** | Un pasaje completo + **6** preguntas de comprensión (banco de **16** lecturas). Apruebas con **5/6**. |
| **Entrevista y Redacción** | 10 preguntas de entrevista con tips + 5 temas de redacción (80–120 palabras) con checklist. |
| **Flashcards** | Tarjetas de Historia/Cultura; se aprenden con **5 respuestas correctas**. Solo entran preguntas que ya respondiste en el simulador o que agregaste desde el banco. |
| **Banco completo** | Busca y navega todas las preguntas, lecturas y temas de conversación, y **añade cualquier pregunta del banco a tus flashcards** con un botón. |
| **Progreso** | Dominadas, intentos de examen, archivadas y en repetición. |

- Progreso guardado por **número de teléfono** (sin contraseñas).
- Las preguntas del **simulador entran solas a Flashcards**; desde el **Banco** puedes
  añadir opcionalmente cualquier otra pregunta con el botón **"Agregar a flashcards"**.
  **Ninguna otra pregunta aparece en Flashcards**: las tarjetas de origen desconocido
  (por ejemplo, de versiones anteriores) se descartan automáticamente al cargar la app.
- Una pregunta se considera **dominada** al acertarla en **5 sesiones distintas**.
- Estado **"¡Listo!"** cuando apruebas simulador y lectura.
- Botones **EN** y **FA** para ver las traducciones al **inglés** o **farsi/persa** de cada texto, pregunta y opción. El farsi se muestra de derecha a izquierda y se guarda en el navegador después de cargarlo por primera vez.

## Datos

Todo en `data/`:

- `questions.json` — banco de Historia/Cultura **limpio y deduplicado**: **728 preguntas**
  (604 del banco original + flashcards, y 124 conceptos nuevos revisados del lote OCR de
  2026), todas **con acentos, enunciados en forma de pregunta, 4 opciones coherentes y
  traducción al inglés**. La app obtiene y almacena en el navegador la traducción al farsi
  cuando se activa **FA**.
- `reading_passages.json` — **16 pasajes** con 6 preguntas cada uno (**96**), todos con
  acentos y **traducción al inglés** (texto + preguntas + opciones), además de la
  traducción al farsi bajo demanda.
- `interview_writing.json` — entrevista + redacción.
- `questions_from_images.json` — las **576 preguntas únicas** extraídas por OCR de tus
  imágenes.

### ✅ Limpieza del banco original

El `questions.json` extraído de los `.exe` tenía 3,000 preguntas pero **solo 33
conceptos únicos** (cada uno repetido ~90 veces con distinta redacción). Se
**deduplicó a los 33 conceptos**, reescritos con acentos correctos y traducidos al
inglés (`scripts/dedupe_original.py`). Junto con las 514 redactadas de tus flashcards,
el banco quedó en **547 preguntas únicas y de calidad**.

### ✅ Preguntas de las flashcards — completas

Las **576 preguntas** de tus imágenes quedaron cubiertas: **571 redactadas** (con
respuesta + opciones + inglés) e incorporadas al banco; las pocas restantes eran
tarjetas duplicadas o con texto ilegible que se reformularon. Ver
`pending-questions/README.md` para el detalle de la redacción.

### ✅ Reparación del lote OCR de 2026 (Cuestionarios)

El lote de 231 preguntas añadido por OCR de capturas (`data/IMG_0453-0540.png`) venía
dañado: palabras pegadas por el OCR (`Teotihuacán,EstadodeMexico`), acentos perdidos,
respuestas cortadas a media palabra, enunciados que no eran preguntas y **opciones
distractoras tomadas al azar de todo el banco** (una persona como opción de una fecha).
Se corrigió a mano en `data/questions_added_clean.json` y se reincorporó con
`scripts/repair_added.py`: de los 231 renglones, 74 eran conceptos que el banco bueno ya
cubría y el resto quedó en **124 preguntas nuevas limpias** (enunciado con «¿?», acentos,
respuesta completa, 3 distractores del mismo tipo que la respuesta y traducción al
inglés). El banco total quedó en **728**.

Para que no vuelva a ocurrir, `scripts/validate_bank.py` audita el banco (palabras
pegadas, opciones sin la respuesta correcta, duplicadas, traducciones faltantes,
duplicados) y falla si hay defectos.

## 🌐 App en GitHub Pages (un solo archivo)

`index.html` es una **app autocontenida**: funciona sin servidor y sin base de datos
(guarda el progreso de cada persona en `localStorage` del navegador). La primera carga
de cada traducción al farsi requiere conexión; después también queda guardada en
`localStorage`. Se genera a partir de los datos de `data/` con:

```bash
python3 scripts/build_standalone.py
```

Para publicarla como página de GitHub **del mismo repo**:

1. Empuja/mergea `index.html` a `main`.
2. En GitHub → **Settings → Pages → Build and deployment**:
   - *Source* = **Deploy from a branch**.
   - *Branch* = **main** · *Folder* = **/ (root)**.
3. Guarda. En unos segundos la app queda en:
   `https://<tu-usuario>.github.io/naturalizacion.mx/`

No requiere workflow ni compilación: GitHub sirve `index.html` tal cual.

## Stack

- **Next.js 16** (App Router) + **React 19** + **Tailwind CSS 4** + **TypeScript**
- **Drizzle ORM** + **PostgreSQL**
  - Local/preview: **PGlite** (PostgreSQL embebido, sin servidor) — `.pglite/`
  - Producción: `DATABASE_URL` (Neon, Supabase, Vercel Postgres…)

## 🖥️ Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000. El script `predev` migra y siembra la base automáticamente.

Scripts útiles:

```bash
npm run db:migrate   # aplica migraciones (drizzle/)
npm run db:seed      # siembra el banco (idempotente; --force recarga)
npm run db:setup     # migrate + seed
npm run typecheck    # verificación de tipos
python3 scripts/merge_added.py      # añade las preguntas de scripts/qa_batch*.py
python3 scripts/dedupe_original.py  # deduplica el banco original (33 conceptos)
python3 scripts/repair_added.py     # reconstruye el lote OCR 2026 corregido (idempotente)
python3 scripts/validate_bank.py    # audita calidad del banco (sale 1 si hay defectos)
python3 scripts/complete_passages.py # completa/acentúa las 16 lecturas
python3 scripts/add_farsi_translations.py # traduce al farsi los campos nuevos o faltantes
python3 scripts/build_standalone.py # regenera index.html
```

## 🚀 Desplegar en producción (Vercel + Neon)

1. Crea una base Postgres en [Neon](https://neon.tech) y copia el connection string.
2. Importa el repo en [Vercel](https://vercel.com).
3. Define `DATABASE_URL` con el connection string.
4. Corre `npm run db:migrate` y `npm run db:seed` apuntando a Neon.

Con `DATABASE_URL` definido se usa PostgreSQL real vía `pg`; sin él, PGlite local.

## 📝 Pendientes (roadmap)

- Revisar 2–3 preguntas dependientes del tiempo (p. ej. titular de la SRE, personaje
  del billete de 100 pesos) si quieres mantenerlas actualizadas.

## 📄 Licencia

MIT.
