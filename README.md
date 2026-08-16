# 🇲🇽 Naturalización MX — Examen de Ciudadanía

App web para practicar el **examen de naturalización mexicana**. Port a web de las
aplicaciones de escritorio originales (`NaturalizacionPrepES_*.exe`), con el
**banco de preguntas real** extraído de ellas.

## Qué incluye

| Sección | Detalle |
| --- | --- |
| **Simulador Historia/Cultura** | 10 preguntas al azar de un banco de **3,000**. Apruebas con **8/10**. |
| **Examen de Lectura** | Un pasaje completo + **6** preguntas de comprensión (banco de **16** lecturas). Apruebas con **5/6**. |
| **Entrevista y Redacción** | 10 preguntas de entrevista con tips + 5 temas de redacción (80–120 palabras) con checklist. |
| **Flashcards** | Tarjetas de Historia/Cultura; se archivan con **3 "fácil" consecutivos**. Meta diaria de 30. |
| **Banco completo** | Busca y navega todas las preguntas, lecturas y temas de conversación. |
| **Progreso** | Dominadas, intentos de examen, meta diaria, archivadas y en repetición. |

- Progreso guardado por **número de teléfono** (sin contraseñas).
- Una pregunta se considera **dominada** al acertarla en **5 sesiones distintas**.
- Estado **"¡Listo!"** cuando apruebas simulador y lectura.

## Datos

Todo en `data/` (extraído de los `.exe`):

- `questions.json` — 3,000 preguntas de Historia/Cultura (con categoría, subtema, dificultad, explicación y fuente).
- `reading_passages.json` — 16 pasajes con 6 preguntas cada uno (96 preguntas).
- `interview_writing.json` — entrevista + redacción.
- `raw/` — copias sin modificar de los JSON originales.

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

Abre http://localhost:3000. El script `predev` migra y siembra la base
automáticamente la primera vez (usa `npm run db:seed -- --force` para recargar
los datos).

Scripts útiles:

```bash
npm run db:migrate   # aplica migraciones (drizzle/)
npm run db:seed      # siembra el banco de preguntas (idempotente)
npm run db:setup     # migrate + seed
npm run typecheck    # verificación de tipos
```

## 🚀 Desplegar en producción (Vercel + Neon)

1. Crea una base Postgres en [Neon](https://neon.tech) y copia el connection string.
2. Importa el repo en [Vercel](https://vercel.com).
3. Define la variable de entorno `DATABASE_URL` con el connection string.
4. En Vercel, los pasos de build ejecutan las migraciones automáticamente; si no,
   corre `npm run db:migrate` y `npm run db:seed` apuntando a Neon.

Cuando `DATABASE_URL` está definido, la app usa PostgreSQL real vía `pg`;
sin él, usa PGlite local. El schema Drizzle es idéntico en ambos casos.

## 📝 Pendientes / mejoras (roadmap)

- **Restaurar acentos** en el banco (los `.exe` originales vienen sin tildes: "opcion", "Ano").
- **Deduplicar** los ~33 conceptos que aparecen con 8 redacciones distintas (~2,769 únicos).
- Ajustar tiempos de examen y pesos de dificultad por subtema.
- Autenticación por OTP en vez de solo teléfono.

## 📄 Licencia

MIT.
