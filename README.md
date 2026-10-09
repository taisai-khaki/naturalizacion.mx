# 🇲🇽 Naturalización MX — Examen de Ciudadanía

App web para practicar el **examen de naturalización mexicana**, con el banco de
preguntas real extraído de las aplicaciones de escritorio originales
(`NaturalizacionPrepES_*.exe`) y de las **flashcards en imágenes** que aportaste.

## Qué incluye

| Sección | Detalle |
| --- | --- |
| **Simulador Historia/Cultura** | 10 preguntas al azar de un banco limpio de **683**. Apruebas con **8/10**. Las preguntas que ya están en tus flashcards **no vuelven a salir aquí**: se estudian desde Flashcards. |
| **Examen de Lectura** | Un **párrafo** de los 6 textos de lectura, mostrado con **todas** sus preguntas de comprensión (**600** preguntas en **39** párrafos). Apruebas con el **80%** de aciertos (p. ej. 5 de 6, 25 de 31). |
| **Lectura en progreso** | En la pestaña Lectura eliges párrafos (por nombre). Al agregar uno, **todas sus preguntas** pasan a un mazo de **Lectura** en Flashcards. Un párrafo se aprende cuando respondes bien **cada una** de sus preguntas al menos una vez. Progreso lo muestra solo por nombre. |
| **Entrevista y Redacción** | 10 preguntas de entrevista con tips + 5 temas de redacción (80–120 palabras) con checklist. |
| **Flashcards** | Tarjetas de Historia/Cultura; se aprenden con **5 respuestas correctas** y cada tarjeta se repasa **una vez al día** (la que respondes hoy vuelve al día siguiente). Solo entran preguntas que ya respondiste en el simulador o que agregaste desde el banco. |
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

- `questions.json` — banco de Historia/Cultura **limpio y deduplicado**: **683 preguntas**
  (604 del banco original + flashcards, 124 conceptos nuevos revisados del lote OCR de
  2026 y 45 casi-duplicadas eliminadas), todas **con acentos, enunciados en forma de
  pregunta, 4 opciones coherentes y traducción al inglés**. La app obtiene y almacena en
  el navegador la traducción al farsi cuando se activa **FA**.
- `reading_passages.json` — **39 párrafos** de los **6 textos** de lectura ("Leyenda del maíz",
  "Parque Nacional Cañón del Sumidero", "La celebración del día de muertos", "Leyenda del
  Mayab…", "Los volcanes", "La leyenda del Cenote Zací") con **600 preguntas** de opción múltiple.
  Se genera con `scripts/build_reading.py` desde `data/reading/pasajes.txt` (textos) y
  `data/reading/preguntas_1..6.txt` (preguntas), y el script **falla** si el total no es 600.
  **Aún sin traducción** al inglés ni al farsi (los botones EN/FA no muestran la lectura todavía).
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
duplicados y casi-duplicadas) y falla si hay defectos.

### ✅ Deduplicación final (2026-09)

El lote OCR repetía ~45 conceptos que el banco ya cubría con otra redacción (por
ejemplo «¿Cuál es el estado con mayor producción de calzado (zapatos)?» y
«¿Qué estado es el mayor productor de calzado en México?», ambas con respuesta
Guanajuato). `scripts/dedupe_duplicates.py` elimina esas copias (728 → **683**)
y genera `data/dedupe_remap.json` con el mapa `{id_eliminado: id_conservado}`:
el progreso guardado en el navegador se **fusiona** (contador máximo, fechas,
vistos) en lugar de perderse, así el contador de una tarjeta ya no se reparte
entre dos ids y puede llegar a las 5 correctas.

Reglas ajustadas al mismo tiempo:

- Una pregunta que entra a Flashcards **ya no vuelve a salir en el simulador**
  (antes solo se excluían las aprendidas, así que las pendientes se repetían y
  sus contadores nunca avanzaban).
- El simulador ya no toca el horario ni el contador de una tarjeta existente;
  solo crea la tarjeta la primera vez.
- Se restauró el filtro **Todas / En flashcards / Sin agregar** en el Banco y se
  añadió el filtro por **categoría** en Flashcards.

### ✅ Repetición espaciada que sí avanza (2026-09)

Síntoma: algunas preguntas **nunca cambiaban su historial** aunque se respondieran
bien y volvían a salir **todos los días**.

Causa: `migrateFlashcards()` aplicaba una migración en **cada** carga de la página que
ponía `lastReviewedAt = null` en toda tarjeta pendiente con **<= 1 acierto**. La fecha
del último repaso se borraba apenas guardada, `availablePool()` volvía a ofrecer la
tarjeta al día siguiente y Progreso nunca mostraba "Último repaso". Las tarjetas que
crea el simulador nacen con 1 acierto, justo dentro de ese rango.

Corregido en `scripts/standalone.template.html` (regenerar con `npm run bank:build`):

- El desbloqueo corre **una sola vez por versión de datos** (`DATA_VERSION_CHANGED`),
  no en cada carga. Las tarjetas nuevas siguen disponibles de inmediato porque se
  crean con `lastReviewedAt: null`.
- `today()` y `daysSince()` usan el **día local** del usuario en vez de UTC: antes el
  día cambiaba a las 18:00 (UTC-6) y una tarjeta fallada por la tarde volvía a salir a
  las pocas horas en lugar de al día siguiente.
- `saveDB()` ya no falla en silencio: si `localStorage` está lleno o bloqueado (modo
  privado) aparece un aviso en Flashcards. Antes las respuestas correctas se perdían
  sin ninguna señal y la tarjeta repetía al día siguiente.
- La sesión (`nmx_phone`) se guarda al entrar y se borra con "Salir": antes cada
  recarga pedía el número otra vez y escribirlo en otro formato (`+52`, con espacios)
  abría una base vacía.

En la app Next.js (`src/`):

- `POST /api/flashcard` **crea** la tarjeta si no existe en vez de devolver
  `404 Flashcard no encontrada`, que hacía que el acierto no se registrara nunca.
- `Flashcards.tsx` devuelve los botones para reintentar si la petición falla (antes la
  tarjeta quedaba congelada en "Cargando siguiente...").
- `/api/progress` expone `mark` para que "Próximo repaso" muestre el intervalo real
  (1 día si fallaste, `FLASHCARD_MIN_DAYS` si acertaste) en vez de 5 días siempre.

### ✅ Intervalo de repaso: 1 día (2026-09)

`FLASHCARD_MIN_DAYS` bajó de **5 a 1**: una tarjeta respondida hoy (correcta o
incorrecta) vuelve a estar disponible **al día siguiente**. Con 5 aciertos seguidos
sigue marcándose como aprendida, así que ahora una tarjeta se aprende en 5 días de
repaso en lugar de 25.

Cambiado en `src/lib/constants.ts` y en `scripts/standalone.template.html` (más
`index.html` regenerado). Los textos de la UI usan `FLASHCARD_INTERVAL_LABEL` para que
no se lean como "cada 1 días" y sigan siendo correctos si el intervalo vuelve a subir.

Nota: en la app autocontenida el corte es por **día local** (responde hoy → aparece
mañana a cualquier hora). En la app Next.js la comparación es una ventana móvil de 24 h
desde el último repaso.

### 📚 Lectura por párrafos (2026-10)

Los 16 pasajes anteriores se reemplazaron por los 6 textos de lectura, divididos en 39
párrafos. Cada párrafo se muestra con su nombre (`Párrafo 1 · Leyenda del maíz`).

- **Examen:** toma un párrafo al azar y muestra el texto con todas sus preguntas.
  Apruebas con el 80% de aciertos (redondeado hacia arriba).
- **Mazo de Lectura:** en la pestaña Lectura, sección *Lectura en progreso*, agregas
  párrafos; todas sus preguntas entran a Flashcards → *Lectura*. Una pregunta se aprende
  con **una** respuesta correcta; una fallada vuelve al día siguiente.
- **Aprendido:** un párrafo cuenta como aprendido cuando todas sus preguntas están
  respondidas correctamente al menos una vez. Progreso lo lista por nombre.
- **Banco:** la pestaña *Lecturas* muestra cada párrafo con su texto y respuestas, y
  permite agregarlo al mazo.
- El progreso de lectura se guarda en el navegador (`lecParas` y `lecQ` en `localStorage`).
- Alcance: el mazo de Lectura y el examen con el 80% están en la app autocontenida
  (`index.html`). La app Next.js recibe los mismos datos (`npm run db:seed`) y usa el 80%
  en el examen, pero todavía no tiene el mazo de Lectura.
- Las preguntas de lectura se escriben como 600 preguntas sobre el mismo texto, así que
  muchas repiten un dato desde distintos ángulos. Los enunciados no se repiten exactamente.

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
python3 scripts/dedupe_duplicates.py # elimina casi-duplicadas del banco y escribe data/dedupe_remap.json
python3 scripts/validate_bank.py    # audita calidad del banco (sale 1 si hay defectos)
python3 scripts/build_reading.py    # genera reading_passages.json desde data/reading/ (valida 600 preguntas)
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
- Traducir al inglés y al farsi las 600 preguntas y los textos de lectura.
- Llevar el mazo de Lectura a la app Next.js (hoy solo lo tiene la app autocontenida).

## 📄 Licencia

MIT.
