# DEMP — plan de implementación por fases

## Regla de ejecución

No construir todo de una vez. Cada fase debe dejar el repositorio ejecutable, probado y documentado. No avanzar si los criterios de aceptación de la fase no pasan.

## Fase 0 — bootstrap y decisiones verificables

Objetivo: repositorio listo y dos riesgos técnicos probados.

Entregables:

- React + TypeScript + Vite.
- PWA básica instalable.
- Supabase local/configuración remota por variables de entorno.
- estructura de migraciones.
- CI básico lint + typecheck + tests.
- spike MRZ de cámara en móvil con datos sintéticos/anónimos.
- comprobar específicamente el NUI correcto en MRZ de los modelos de cédula soportados.
- comprobar cámara trasera y anti-relectura del mismo documento.
- spike offline: crear acción en IndexedDB, desconectar, reconectar, sincronizar idempotentemente.
- medir tamaño aproximado de caché para una cohorte realista y crecimiento estimado de PostgreSQL.

Gate:

- demostrar que MRZ es viable en al menos un iPhone y un Android; si no lo es, mantener flujo manual como fallback y documentar alternativa.
- demostrar outbox offline sin duplicados.

## Fase 1 — autenticación, roles y registro consular

- Auth email/password.
- profiles/roles/RLS.
- superadministración de usuarios/consulados.
- pantalla principal consulado.
- registro manual.
- escaneo de documento inicial.
- carga con archivo.
- búsqueda/edición auto-save/deshacer.
- solicitud de prioridad.

## Fase 2 — Centro de Impresión Madrid

- pantalla Madrid simplificada.
- Prioritarios: aceptar/rechazar.
- sesiones de lectura continua.
- MRZ pasaporte.
- matching.
- alta MADRID_MRZ sin detener escaneo.
- ruteo de pasaporte de otro consulado.
- cola Casos para revisar.
- cohortes como vista secundaria.

## Fase 3 — bandejas, lotes y recepción

- bandejas por consulado.
- selección múltiple.
- crear/preparar/reabrir lote.
- marcar enviado.
- tracking opcional posterior.
- vista de lotes entrantes en consulado.
- recepción completa y faltantes excepcionales.
- transición a disponible para retiro.

## Fase 4 — consulta pública y entrega

- portal público institucional.
- Turnstile server-side.
- endpoint mínimo.
- timeline adaptada Madrid/no Madrid.
- badge prioridad.
- marcar entregado.
- visualización histórica entregado con fecha.

## Fase 5 — offline completo y sincronización

Extender outbox a operaciones acordadas:

- registro;
- lectura;
- entrega;
- cambios operativos compatibles.

- row_version.
- conflictos.
- feedback de sincronización.
- pruebas de pérdida/reconexión.

## Fase 6 — reportes, notificaciones, retención y backups

- generador de reportes.
- Excel.
- configuraciones guardadas.
- cola Brevo con cap diario.
- trigger principal disponible para retiro.
- pg_cron agregación histórica + purga de expedientes detallados tras retención.
- tabla compacta de métricas históricas.
- health panel tamaño DB.
- backup cifrado a R2.
- documentación de restore.

## Fase 7 — endurecimiento y piloto

- QA mobile real.
- accesibilidad.
- revisión RLS.
- cabeceras CSP.
- performance.
- datos sintéticos.
- piloto con una oficina + Madrid antes de activar toda España.
- corregir fricción detectada en operación real antes de añadir funcionalidades.

## No objetivos del MVP

- integración con SEDIP;
- SMS/WhatsApp;
- firma/biometría en DEMP;
- app nativa App Store/Play Store;
- OCR de la página completa del pasaporte como requisito;
- dashboards complejos;
- gestión general de incidencias;
- PDF de reportes si exige trabajo adicional significativo;
- roles configurables granulares por cada campo.
