# DEMP — revisión crítica del paquete v1.0 y correcciones incorporadas en v1.1

## Resultado

El paquete v1.0 era suficientemente sólido para iniciar diseño, pero contenía varios puntos que podían producir errores reales durante implementación. La versión 1.1 corrige esos puntos sin ampliar el alcance funcional ni burocratizar DEMP.

## Correcciones críticas

### 1. Duplicados temporales de cédula durante conciliación

El esquema v1.0 imponía una unicidad SQL de cédula activa. Eso contradice el requisito operativo de Madrid: si la MRZ no encuentra el registro correcto porque el consulado digitó mal un dato, Madrid debe poder crear un registro funcional y seguir escaneando.

v1.1 elimina esa unicidad rígida. La creación ordinaria del consulado sigue bloqueando duplicados mediante una RPC, pero Madrid puede crear temporalmente un `MADRID_MRZ` para conciliación.

### 2. Crecimiento indefinido de la base

v1.0 proponía anonimizar expedientes después de seis meses pero conservarlos. Con hasta 12.000 trámites mensuales, esa estrategia acabaría agotando los 500 MB del nivel gratuito de Supabase.

v1.1 agrega primero métricas históricas compactas y después elimina el expediente detallado vencido. La historia de largo plazo queda en agregados, no en filas individuales.

### 3. Cédula/NUI en MRZ

Algunos modelos de cédula pueden incluir simultáneamente un número de documento/soporte y el NUI del ciudadano. v1.1 exige que la Fase 0 demuestre que el parser toma el NUI/cédula correcto en cada modelo soportado.

### 4. Escaneo continuo real

Se añadió apertura preferente de cámara trasera y control anti-relectura para evitar que un mismo pasaporte genere varias confirmaciones mientras permanece frente a la cámara.

### 5. Faltantes en recepción

Un pasaporte marcado como faltante puede aparecer después. v1.1 permite marcarlo recibido posteriormente desde el mismo lote, sin crear un módulo de incidencias ni reabrir toda la recepción.

### 6. Consulta pública con trámite anterior y nuevo

Una persona puede haber recibido un pasaporte y, dentro de los seis meses de retención, iniciar otro trámite. v1.1 define que la consulta pública devuelve siempre el trámite activo; solo devuelve el entregado reciente si no existe uno activo.

### 7. PII en modo offline

v1.1 restringe la caché local al mínimo, exige purga al cerrar sesión y elimina datos ya sincronizados cuando no sean necesarios.

### 8. Fecha real de captura para cohortes

Se añadió `application_at`, normalmente automática, para que la métrica captura→impresión y las cohortes no dependan de la hora de importación del archivo.

### 9. Lotes activos simultáneos

Se explicitó que un pasaporte no puede estar al mismo tiempo en dos lotes activos, aunque pueda aparecer en más de un lote histórico por reenvíos excepcionales.

## Puntos que se mantienen deliberadamente simples

- No módulo general de incidencias.
- No integración con SEDIP.
- No 2FA en v1.
- No auditoría campo por campo.
- No almacenamiento de imágenes/MRZ cruda.
- No dashboards complejos.
- Correo complementario y condicionado al nivel gratuito.
- Superadministrador fuera de la operación diaria.

## Conclusión

Con estas correcciones, el paquete está en condiciones de pasar a Codex para la Fase 0 sin decisiones funcionales pendientes relevantes. Los dos riesgos principales siguen siendo empíricos: calidad de lectura MRZ/OCR en móviles reales y comportamiento offline/sincronización. Por eso permanecen como gates antes de continuar con el resto de la construcción.
