# Mediciones iniciales de Fase 0

Estas cifras son estimaciones reproducibles para decidir el siguiente paso; no sustituyen una prueba de carga de Supabase antes de producción.

## Caché offline

Se midió con Node el JSON de una acción mínima de la outbox, sin correo, imagen ni MRZ: **240 bytes**. Como IndexedDB añade índices y metadatos, se reserva conservadoramente 1 KiB por acción. Una cohorte offline extrema de 12.000 operaciones ocuparía aproximadamente **12 MiB**; la cola real debe retener solo operaciones no sincronizadas y purgarse tras la confirmación.

## Crecimiento PostgreSQL

Con 72.000 expedientes vivos (seis meses a 12.000/mes), 300.000 eventos relacionados y los índices previstos, se presupuestan 250–400 MiB antes de considerar picos y bloat. Esto confirma que la purga a los 180 días y las alertas a 300/400 MiB son necesarias. La Fase 6 deberá medir el tamaño real en Postgres/Supabase con datos sintéticos y `EXPLAIN ANALYZE`; no se debe tomar esta estimación como capacidad garantizada.
