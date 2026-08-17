# 🇲🇽 Naturalización MX — Examen de Ciudadanía

App web para practicar el **examen de naturalización mexicana**, con el banco de
preguntas real extraído de las aplicaciones de escritorio originales
(`NaturalizacionPrepES_*.exe`) y de las **flashcards en imágenes** que aportaste.

## Qué incluye

| Sección | Detalle |
| --- | --- |
| **Simulador Historia/Cultura** | 10 preguntas al azar de un banco limpio de **604**. Apruebas con **8/10**. |
| **Examen de Lectura** | Un pasaje completo + **6** preguntas de comprensión (banco de **16** lecturas). Apruebas con **5/6**. |
| **Entrevista y Redacción** | 10 preguntas de entrevista con tips + 5 temas de redacción (80–120 palabras) con checklist. |
| **Flashcards** | Tarjetas de Historia/Cultura; se archivan con **3 "fácil" consecutivos**. Meta diaria de 30. |
| **Banco completo** | Busca y navega todas las preguntas, lecturas y temas de conversación. |
| **Progreso** | Dominadas, intentos de examen, meta diaria, archivadas y en repetición. |

- Progreso guardado por **número de teléfono** (sin contraseñas).
- Una pregunta se considera **dominada** al acertarla en **5 sesiones distintas**.
- Estado **"¡Listo!"** cuando apruebas simulador y lectura.
- Botón **EN** para ver la **traducción al inglés** de cada texto/pregunta/opción.

## Datos

Todo en `data/`:

- `questions.json` — banco de Historia/Cultura **limpio y deduplicado**: 604 preguntas
  (33 conceptos únicos del banco original + 571 redactadas de tus flashcards), todas
  **con acentos y traducción al inglés**.
- `reading_passages.json` — **16 pasajes** con 6 preguntas cada uno (**96**), todos con
  acentos y **traducción al inglés** (texto + preguntas + opciones).
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

## 🌐 App en GitHub Pages (un solo archivo)

`public/full.html` es una **app autocontenida**: funciona sin servidor y sin base de
datos (guarda el progreso de cada persona en `localStorage` del navegador). Se genera con:

```bash
python3 scripts/build_standalone.py
```

Para publicarla como página de GitHub **del mismo repo**:

1. Empuja/mergea la rama a `main`.
2. En GitHub → **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.
3. El workflow `.github/workflows/deploy-pages.yml` compila `public/full.html` y lo
   despliega automáticamente en cada push.

La app queda en: `https://<tu-usuario>.github.io/naturalizacion.mx/`

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
python3 scripts/complete_passages.py # completa/acentúa las 16 lecturas
python3 scripts/build_standalone.py # regenera public/full.html
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
