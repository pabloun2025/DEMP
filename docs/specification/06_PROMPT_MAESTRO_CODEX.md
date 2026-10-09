# Prompt maestro para Codex — DEMP

Quiero que construyas el proyecto DEMP («¿Dónde está mi pasaporte?») a partir de los documentos adjuntos a esta sesión.

Antes de modificar o crear código, lee íntegramente y en este orden:

1. `00_README_START_HERE.md`
2. `01_ESPECIFICACION_MAESTRA.md`
3. `02_ARQUITECTURA_Y_SEGURIDAD.md`
4. `03_MODELO_DATOS_Y_REGLAS.md`
5. `04_CRITERIOS_ACEPTACION_Y_PRUEBAS.md`
6. `05_PLAN_IMPLEMENTACION.md`
7. `schema.sql`

Trata esos archivos como la fuente de verdad del proyecto. No inventes funcionalidades, estados, datos, roles ni flujos que no estén especificados. Si hay una decisión menor no definida, elige la alternativa más simple, barata, segura y mantenible. Pregunta únicamente si una ambigüedad cambia materialmente el comportamiento, la seguridad, el coste o el modelo de datos.

## Objetivo

Entregar una PWA mobile-first para la red consular ecuatoriana en España que:

- permita registrar trámites de pasaporte con el mínimo trabajo;
- ayude al Centro de Impresión de Madrid a leer y clasificar pasaportes mediante MRZ, sin detener el flujo físico;
- gestione prioridades, bandejas, lotes, envío, recepción y entrega;
- permita al ciudadano consultar únicamente el estado usando cédula + fecha de nacimiento;
- continúe el trabajo interno durante cortes temporales de internet mediante una outbox offline;
- evite almacenar imágenes de documentos o datos que no sean necesarios;
- permanezca dentro de servicios gratuitos o coste mínimo y no dependa de un servidor administrado manualmente.

## Restricciones innegociables

1. Simplicidad operativa por encima de funcionalidad decorativa.
2. No duplicar funciones de SEDIP.
3. No almacenar fotos de cédulas/pasaportes ni MRZ cruda.
4. No exponer service-role keys o secretos en frontend.
5. RLS obligatoria en tablas operativas.
6. Public query solo por función server-side y respuesta mínima.
7. No microservicios.
8. No dependencias de pago como requisito de funcionamiento.
9. Mobile-first, pero usable en escritorio.
10. Todo flujo repetitivo debe permitir operación por lote cuando tenga sentido.
11. No bloquear la lectura continua de Madrid por conciliaciones dudosas.
12. Si una función puede resolverse en la misma pantalla, no crear una pantalla adicional.
13. No imponer una restricción SQL de unicidad de cédula que impida a Madrid crear temporalmente un `MADRID_MRZ` para conciliar un registro previo erróneo; la duplicidad ordinaria del consulado se controla mediante lógica transaccional.
14. No conservar indefinidamente expedientes anonimizados: agregar métricas y purgar detalle al vencer retención.

## Stack de referencia

Usa salvo impedimento real:

- React + TypeScript + Vite.
- PWA con Workbox/vite-plugin-pwa.
- CSS simple y responsive; evita un sistema visual pesado.
- Supabase Postgres + Auth + RLS + Edge Functions/RPC.
- Dexie/IndexedDB para outbox y caché mínima offline.
- Cloudflare Pages para frontend.
- Cloudflare Turnstile para consulta pública.
- Brevo para correo opcional.

Para OCR/MRZ, realiza primero un spike. Prioriza OCR local en el navegador con biblioteca open-source, parsing ICAO Doc 9303 y validación de check digits. Mantén siempre fallback manual. En móvil usa por defecto la cámara trasera y evita relecturas repetidas del mismo documento. En cédulas verifica explícitamente cuál campo MRZ es el NUI/cédula cuando también exista número físico/serial de documento.

## Forma de trabajo

Sigue estrictamente `05_PLAN_IMPLEMENTACION.md`.

Empieza por la Fase 0. No intentes implementar toda la aplicación en un único cambio.

En cada fase:

1. escribe un plan corto;
2. implementa;
3. ejecuta lint, typecheck y tests;
4. crea/actualiza migraciones;
5. prueba criterios de aceptación aplicables;
6. revisa que no haya PII en logs ni imágenes persistidas;
7. deja el proyecto ejecutable;
8. actualiza `README_DEV.md` con instrucciones exactas;
9. resume qué quedó terminado y qué falta de la fase.

No avances a la siguiente fase si los criterios esenciales de la actual fallan.

## UX

La interfaz debe parecer una herramienta de trabajo, no un ERP pesado.

- botones grandes en móvil;
- textos cortos;
- feedback inmediato;
- auto-save;
- deshacer hasta la siguiente acción incompatible;
- selección múltiple;
- estados vacíos útiles;
- ninguna tabla debe obligar a scroll horizontal en móvil: convertir filas en tarjetas/columnas responsivas cuando corresponda.

La vista de Madrid debe tener como accesos principales únicamente:

- Iniciar lectura.
- Preparar envíos.
- Prioritarios.

No llenes el dashboard con métricas.

## Seguridad

- Implementa RLS antes de conectar pantallas reales.
- Crea tests negativos de acceso entre consulados.
- Public query no usa acceso `anon` directo a tablas.
- Turnstile se valida server-side.
- Sanitiza exportaciones Excel/CSV contra formula injection.
- No registres cédula/fecha de nacimiento en logs de errores del endpoint público.
- Añade CSP y cabeceras indicadas en arquitectura antes del piloto.

## Offline

Diseña el offline desde el comienzo, no como parche final:

- `action_id` idempotente;
- `row_version`;
- outbox Dexie;
- sync automático;
- conflictos explícitos;
- no guardar imágenes;
- purgar PII cacheada al cerrar sesión y minimizar el conjunto offline.

Sin embargo, en Fase 0 basta demostrar el patrón con una operación mínima antes de extenderlo.

## Datos de prueba

Usa datos sintéticos. No incluyas imágenes reales ni información real de ciudadanos en el repositorio. Crea fixtures sintéticos para:

- varios consulados;
- prioridades;
- matching exacto;
- cédula con un dígito erróneo;
- nombre con Ñ/tildes frente a MRZ normalizada;
- alta desde Madrid;
- lotes con/sin tracking;
- faltante en recepción;
- conflicto offline.

## Primera tarea

Ejecuta únicamente la Fase 0 del plan:

- crea la estructura del proyecto;
- configura tooling;
- prepara Supabase/migraciones;
- implementa PWA mínima;
- implementa spike de MRZ en cámara con fallback por imagen local de prueba;
- incluye prueba específica de NUI de cédula, cámara trasera y anti-relectura;
- implementa una outbox mínima IndexedDB con una acción demo idempotente;
- documenta variables de entorno y comandos;
- ejecuta tests.

Al terminar, presenta resultados objetivos de los dos spikes (MRZ y offline) y no declares que una lectura MRZ es fiable si no se ha probado realmente.
