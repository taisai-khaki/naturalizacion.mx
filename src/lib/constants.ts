// Configuración del examen (misma que la app de escritorio original)
export const SIMULADOR_TOTAL = 10; // preguntas del simulador de Historia/Cultura
export const SIMULADOR_PASS = 8; // se aprueba con 8 de 10
// Lectura: el examen toma un párrafo y TODAS sus preguntas. Se aprueba con el 80%
// (redondeado hacia arriba: 6 de 6 -> 5, 31 -> 25).
export const LECTURA_PASS_RATIO = 0.8;
export function lecturaPassBar(totalQuestions: number): number {
  return Math.ceil(LECTURA_PASS_RATIO * totalQuestions);
}

// Límites de tiempo
export const SIMULADOR_SECONDS = 10 * 60; // 10 minutos
export const LECTURA_SECONDS = 20 * 60; // 20 minutos

// Flashcards: respuestas correctas necesarias para aprender una pregunta
export const FLASHCARD_LEARN_COUNT = 5;
// Días mínimos entre repasos de una misma pregunta en flashcards.
// Con 1, una tarjeta respondida hoy vuelve a estar disponible al día siguiente
// (antes eran 5 días).
export const FLASHCARD_MIN_DAYS = 1;
// Textos para la UI, derivados del intervalo: así no se lee "cada 1 días" ni
// "vuelve al día siguiente y una fallada, al día siguiente", y siguen siendo
// correctos si el intervalo vuelve a subir.
export const FLASHCARD_INTERVAL_LABEL =
  FLASHCARD_MIN_DAYS <= 1 ? "al día siguiente" : `cada ${FLASHCARD_MIN_DAYS} días`;
export const FLASHCARD_ONCE_PER_LABEL =
  FLASHCARD_MIN_DAYS <= 1 ? "una vez al día" : `una vez cada ${FLASHCARD_MIN_DAYS} días`;
export const FLASHCARD_SCHEDULE_TEXT =
  FLASHCARD_MIN_DAYS <= 1
    ? "una tarjeta respondida hoy vuelve al día siguiente"
    : `una tarjeta acertada vuelve cada ${FLASHCARD_MIN_DAYS} días y una fallada, al día siguiente`;
