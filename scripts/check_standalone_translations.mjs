#!/usr/bin/env node
/**
 * Comprueba el `index.html` ya generado (no los JSON de origen), que es lo de
 * verdad publica en GitHub Pages. Se asegura de que la lectura y sus 474
 * preguntas traen inglés y farsi, de que las listas de opciones traducidas
 * siguen alineadas después del barajado del build y de que los botones EN y FA
 * tienen con qué pintar en las tres vistas de Lectura (examen, banco y
 * flashcards).
 *
 * Cómo funciona: saca los dos bloques <script> del HTML (datos + lógica), los
 * ejecuta en un contexto con un DOM de mentira y, dentro del propio closure de
 * la app, evalúa las aserciones. Así se prueba el código real, sin reimplementarlo.
 *
 *   node scripts/check_standalone_translations.mjs   (o npm run check:app)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

/* Las aserciones se evalúan dentro del closure de la app, donde HIST, LEC, tr()
   y compañía son visibles: se escriben como string para inyectarlas ahí. */
const ASSERTIONS = `
/* ---------- comprobaciones de traducciones ---------- */
function __fold(x){return (x||"").normalize("NFKD").toLowerCase().replace(/[\\u0300-\\u036f\\u200c\\u200d]/g,"").replace(/[^a-z0-9\\u0600-\\u06ff ]+/g," ").replace(/\\s+/g," ").trim();}
var __fails=0;
function __chk(cond,label){ if(!cond){ console.log("  FAIL  "+label); __fails++; } }
__chk(LEC.length===39,"el build trae los 39 parrafos de lectura");
__chk(HIST.length>0,"el build trae el banco de historia");
var __p=LEC[0], __q=__p.questions[0];
TRANSLATION="en";
__chk(/translation en/.test(tr(__q.question_en,__q.question_fa)),"EN: tr() pinta el ingles del enunciado");
__chk(/translation en/.test(trOption(__q.options_en,__q.options_fa,2)),"EN: trOption() pinta el ingles de una opcion");
__chk(/translation en/.test(tr(__p.text_en,__p.text_fa)),"EN: tr() pinta el ingles del parrafo");
TRANSLATION="fa";
__chk(/dir="rtl"/.test(tr(__p.text_en,__p.text_fa)),"FA: el parrafo se marca como texto rtl");
__chk(/dir="rtl"/.test(trOption(__q.options_en,__q.options_fa,0)),"FA: las opciones se marcan como texto rtl");
__chk(tr("cadena que no esta en el caché","")!=="","FA: si falta la traduccion se avisa en vez de callar");
TRANSLATION="";
__chk(tr(__q.question_en,__q.question_fa)==="","sin boton activo no se pinta traduccion alguna");
__chk(trOption(__q.options_en,__q.options_fa,0)==="","sin boton activo no se pintan opciones traducidas");
var __nq=0;
LEC.forEach(function(pp){
  __chk(!!pp.text_en&&!!pp.text_fa,"parrafo "+pp.id+": falta el texto en ingles o farsi");
  pp.questions.forEach(function(xx){
    __nq++;
    __chk(!!xx.question_en&&!!xx.question_fa,"parrafo "+pp.id+": enunciado sin traducir");
    __chk(xx.options.length===xx.options_en.length&&xx.options.length===xx.options_fa.length,"parrafo "+pp.id+": las listas de opciones no miden lo mismo");
    xx.options.forEach(function(o,i){
      __chk(!!xx.options_en[i]&&!!xx.options_fa[i],"parrafo "+pp.id+": opcion sin traducir");
      __chk(__fold(xx.options_en[i]).length>1&&__fold(xx.options_fa[i]).length>1,"parrafo "+pp.id+": traduccion de opcion vacia");
      // Los topónimos se copian iguales en los dos idiomas, así que aquí solo se
      // exige que la traducción exista y no esté vacía.
    });
    // La opcion correcta debe leerse dentro del texto traducido en los dos
    // idiomas: es lo que garantiza que la pregunta se responde con la traduccion.
    __chk(__fold(pp.text_en).indexOf(__fold(xx.options_en[xx.correct]))>=0,"parrafo "+pp.id+": la respuesta correcta no aparece en el texto en ingles");
    __chk(__fold(pp.text_fa).indexOf(__fold(xx.options_fa[xx.correct]))>=0,"parrafo "+pp.id+": la respuesta correcta no aparece en el texto en farsi");
    __chk(!/[A-Za-z]/.test(xx.question_fa),"parrafo "+pp.id+": el farsi del enunciado lleva letras latinas");
    __chk(/\\u061f/.test(xx.question_fa),"parrafo "+pp.id+": el farsi del enunciado no termina en ؟");
    var __c=lecCardOf(xx);
    __chk(__c.pregunta_en===xx.question_en&&__c.pregunta_fa===xx.question_fa,"parrafo "+pp.id+": lecCardOf() pierde las traducciones del enunciado");
    __chk(__c.opciones_en.length===4&&__c.opciones_fa.length===4&&__c.opciones_fa[__c.correct]===xx.options_fa[xx.correct],"parrafo "+pp.id+": lecCardOf() desalinea las opciones traducidas");
  });
});
console.log("  preguntas de lectura comprobadas: "+__nq);
window.__CHECK_RESULT__={fails:__fails};
`;


const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (blocks.length < 2) {
  console.error("el HTML no tiene los dos bloques <script> esperados; regenera con `python3 scripts/build_standalone.py`");
  process.exit(1);
}
const [data, logic] = blocks;
if (!logic.includes("function tr(")) {
  console.error("el segundo bloque no parece la lógica de la app");
  process.exit(1);
}

// El DOM falso solo tiene que sobrevivir al arranque de la app: se quita la
// última llamada a render() para no pintar, y se inyectan las aserciones antes
// del cierre del closure.
let code = logic.trimEnd();
const close = "})();";
if (!code.endsWith(close)) {
  console.error("no se encontró el cierre del closure de la app");
  process.exit(1);
}
code = code.slice(0, -close.length).replace("render();\n", "") + ASSERTIONS + "\n" + close;

function makeEl() {
  const el = {
    style: {}, dataset: {}, children: [], innerHTML: "", textContent: "", value: "", className: "",
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, appendChild(c) { this.children.push(c); },
    addEventListener() {}, removeEventListener() {}, focus() {}, click() {}, blur() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    insertAdjacentHTML() {}, scrollIntoView() {},
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
  };
  return el;
}
const store = {};
const byId = {};
const sandbox = {
  console: { log: (...a) => console.log(...a) },
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  },
  document: {
    getElementById: (id) => (byId[id] ||= makeEl()),
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    createElement: () => makeEl(),
    createTextNode: (t) => ({ nodeValue: t }),
    addEventListener() {}, removeEventListener() {},
    body: makeEl(), documentElement: makeEl(), head: makeEl(), title: "",
  },
  addEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  location: { hash: "", pathname: "/index.html", href: "http://localhost/", search: "" },
  confirm: () => true,
  alert() {},
  prompt: () => null,
  // Sin red: la prueba debe aprobarse solo con las traducciones del build.
  fetch: () => Promise.reject(new Error("fetch deshabilitado en la prueba")),
  setTimeout, clearTimeout, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error,
};
sandbox.window = sandbox;

vm.runInNewContext(data + "\n" + code, sandbox, { filename: "index.html" });
if (!sandbox.__CHECK_RESULT__) {
  console.error("las comprobaciones no llegaron al final del script");
  process.exit(1);
}
if (sandbox.__CHECK_RESULT__.fails) {
  console.error(`FAIL: ${sandbox.__CHECK_RESULT__.fails} problema(s) de traducción en index.html`);
  process.exit(1);
}
console.log("OK: la lectura del index.html trae inglés y farsi completos y alineados");


