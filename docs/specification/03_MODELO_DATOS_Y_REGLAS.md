# DEMP — modelo de datos y reglas de negocio

## 1. Convenciones

- IDs: UUID.
- Fechas/hora: `timestamptz` en UTC; presentar en zona local del usuario.
- Estados: enums controlados, nunca texto libre.
- Borrado de datos personales: anonimización programada tras retención.
- Todas las entidades mutables relevantes tienen `row_version` para sincronización offline.

## 2. Entidades

### `consulates`

Oficinas de la red.

Campos clave:

- `id`
- `code`
- `name`
- `city`
- `is_print_center`
- `is_honorary`
- `active`

### `profiles`

Extiende `auth.users`.

- `user_id`
- `email`
- `display_name`
- `role`: `CONSULATE`, `PRINT_CENTER`, `SUPERADMIN`
- `consulate_id` nullable para perfiles globales
- `active`
- `must_change_password`

### `cases`

Entidad central del trámite.

Campos esenciales:

- `id`
- `cedula`
- `first_names`
- `last_names`
- `birth_date`
- `email` nullable
- `consulate_id`
- `passport_number` nullable
- `status`
- `source`: `MANUAL`, `DOCUMENT_SCAN`, `FILE_IMPORT`, `MADRID_MRZ`
- `created_by`
- `created_at`
- `updated_at`
- `application_at` — fecha/hora del trámite/captura, por defecto igual a creación y corregible por el consulado antes de Madrid
- `processed_at` nullable — primera lectura exitosa en Madrid
- `ready_at` nullable
- `delivered_at` nullable
- `closed_at` nullable
- `anonymized_at` nullable
- `row_version`
- `normalized_name` — clave de comparación, no de presentación
- `destination_is_provisional` — verdadero solo cuando Madrid tuvo que asignar provisionalmente el consulado de enfoque
- `merged_into_case_id` nullable — apunta al registro canónico cuando este registro fue absorbido durante conciliación

Regla de negocio: una misma cédula no debe tener dos trámites legítimos activos simultáneamente. Sin embargo, **no** se impondrá un índice único rígido en base de datos sobre cédula activa, porque Madrid debe poder crear temporalmente un registro `MADRID_MRZ` cuando existen datos previos erróneos. La creación ordinaria del consulado sí debe bloquear duplicados mediante una RPC/regla transaccional. Los duplicados temporales se resuelven mediante conciliación.

### `priority_requests`

- `id`
- `case_id`
- `requested_by`
- `request_reason`
- `status`: `REQUESTED`, `ACCEPTED`, `REJECTED`
- `decided_by`
- `decision_reason` obligatorio si REJECTED
- timestamps

Puede existir más de una solicitud histórica, aunque solo una activa a la vez.

### `scan_sessions`

- `id`
- `focus_consulate_id` nullable
- `started_by`
- `started_at`
- `ended_at`
- `device_label` opcional

### `passport_scans`

Registro técnico mínimo de lecturas; no guarda MRZ ni imagen.

- `id`
- `session_id`
- `case_id`
- `result`: `MATCHED`, `AUTO_CREATED`, `DUPLICATE_SCAN`, `ROUTED_OTHER_CONSULATE`, `REVIEW_REQUIRED`, `FAILED`
- `captured_at`
- `created_by`

### `shipments`

- `id`
- `shipment_code`
- `consulate_id`
- `status`: `OPEN`, `PREPARED`, `SHIPPED`, `RECEIVED`
- `carrier` nullable
- `tracking_number` nullable
- `created_by`
- `prepared_by`
- `shipped_by`
- `received_by`
- timestamps correspondientes
- `row_version`

### `shipment_items`

- `shipment_id`
- `case_id`
- `receipt_status`: `PENDING`, `RECEIVED`, `MISSING`
- `receipt_note` nullable y excepcional
- timestamps

Un pasaporte puede aparecer en más de un lote histórico si una excepción real exige reenvío, por lo que no se impone unicidad global de `case_id` en esta tabla. Sí debe impedirse por lógica transaccional que el mismo pasaporte esté simultáneamente en dos lotes activos (`OPEN`, `PREPARED` o `SHIPPED` sin recepción).

### `review_cases`

Para posibles duplicados/conciliaciones.

- `id`
- `primary_case_id`
- `candidate_case_id`
- `reason`
- `score` nullable
- `status`: `PENDING`, `MERGED`, `NOT_SAME`, `DEFERRED`
- `created_at`
- `resolved_by`
- `resolved_at`

### `events`

Solo hitos relevantes, no historial campo por campo.

- `id`
- `case_id`
- `event_type`
- `actor_user_id`
- `created_at`
- `meta` JSONB pequeño y sin PII innecesaria

Eventos típicos:

- `CASE_REGISTERED`
- `PASSPORT_EMITTED`
- `SHIPMENT_PREPARED`
- `SHIPMENT_SHIPPED`
- `READY_FOR_PICKUP`
- `DELIVERED`
- `PRIORITY_ACCEPTED`
- `PRIORITY_REJECTED`

### `notifications`

Cola y log mínimo.

- `id`
- `case_id`
- `type`
- `status`: `PENDING`, `SENT`, `FAILED`, `SKIPPED_QUOTA`
- `attempts`
- `scheduled_at`
- `sent_at`
- `provider_message_id` nullable

No duplicar el email; leerlo desde `cases` al momento de envío.

### `saved_reports`

- `id`
- `owner_user_id`
- `name`
- `scope`
- `config` JSONB
- timestamps

### `metrics_monthly`

Agregados históricos compactos para poder eliminar expedientes detallados después de la retención.

Campos mínimos:

- periodo (mes);
- consulado;
- trámites registrados;
- emitidos;
- entregados;
- altas directas Madrid;
- tiempos agregados de captura→impresión y otros indicadores aprobados.

No contiene PII.

### `app_settings`

Configuraciones pequeñas:

- `retention_days` = 180 por defecto, máximo 365.
- `email_daily_cap`.
- disparadores de notificación activos.
- textos públicos configurables si se decide gestionarlos en DB.

## 3. Máquina de estados del trámite

### Flujo no Madrid

`REGISTRADO`
→ lectura MRZ exitosa
→ `EMITIDO`
→ incluido en lote PREPARED
→ `PREPARADO_ENVIO`
→ lote marcado SHIPPED
→ `ENVIADO`
→ recepción del ítem
→ `DISPONIBLE_RETIRO`
→ entrega
→ `ENTREGADO`

### Flujo Madrid

`REGISTRADO`
→ lectura MRZ exitosa
→ `DISPONIBLE_RETIRO`
→ entrega
→ `ENTREGADO`

El evento de emisión se registra aunque el estado salte directamente a disponible para retiro.

## 4. Reglas de transición

- No se cambia estado mediante dropdown libre.
- Una acción de negocio es la única causa de transición.
- Retrocesos ordinarios de estado están prohibidos.
- `Deshacer` revierte solo la última acción compatible y no puede sobrescribir cambios posteriores de otro usuario.
- Acciones sobre lotes se propagan a sus ítems mediante transacción.

## 5. Reglas de edición

### Consulado

Puede editar campos del trámite si `processed_at IS NULL`.

### Madrid

Puede corregir datos operativos después de `processed_at`.

### Superadministrador

No edita trámites operativos.

## 6. Matching

Orden recomendado:

1. coincidencia exacta cédula + fecha de nacimiento entre casos activos no procesados;
2. si hay una única coincidencia: vincular;
3. si no hay coincidencia exacta: generar candidatos con nombre normalizado, fecha de nacimiento y distancia limitada de cédula;
4. si el candidato es inequívoco según reglas conservadoras, se puede resolver automáticamente únicamente cuando no exista contradicción material;
5. si hay duda, crear `review_case`;
6. si no hay candidato útil, crear caso con source `MADRID_MRZ` y continuar;
7. antes de crear, comprobar `passport_number` exacto para evitar duplicar un pasaporte físico ya leído.

La existencia de una cédula idéntica con fecha de nacimiento distinta se considera contradicción/revisión, no coincidencia automática. Madrid debe poder seguir escaneando sin que una restricción de unicidad bloquee la operación.

No detener el escaneo.

## 7. Normalización

Función de comparación de nombres:

- `trim`;
- uppercase;
- Unicode NFD + eliminación de diacríticos;
- Ñ→N solo para clave normalizada;
- espacios repetidos → uno;
- caracteres MRZ `<` → espacios;
- no modificar el valor de presentación.

## 8. Idempotencia offline

Toda acción sincronizable lleva `action_id` UUID.

Crear una tabla interna o registro de acciones procesadas con retención corta para evitar ejecutar dos veces el mismo comando.

El endpoint de sincronización debe responder por acción:

- `APPLIED`;
- `ALREADY_APPLIED`;
- `CONFLICT`;
- `REJECTED`.

## 9. Lotes

- Solo se añaden pasaportes físicamente disponibles.
- Crear lote no depende de cohortes teóricas.
- Un lote PREPARED puede reabrirse antes de envío.
- SHIPPED no permite cambiar composición.
- Tracking puede añadirse después de SHIPPED.
- RECEIVED marca los items como RECEIVED salvo los que el usuario señale como MISSING.
- Un item MISSING puede posteriormente pasar a RECEIVED sin reabrir todo el lote; en ese momento su caso pasa a DISPONIBLE_RETIRO.
- El estado MISSING debe ser visible de forma pasiva para Madrid y el consulado receptor, sin crear un módulo de incidencias.

## 10. Consulta pública

Nunca exponer tablas por `anon`.

Endpoint único, con respuesta mínima:

```json
{
  "found": true,
  "status": "ENVIADO",
  "status_label": "Enviado al consulado",
  "last_event_at": "2026-10-03T12:00:00Z",
  "next_label": "Disponible para retiro",
  "priority": false
}
```

Cuando no exista o los datos no coincidan, respuesta genérica que no permita distinguir si falló cédula o fecha.

Si existen un trámite activo y uno entregado reciente para la misma cédula/fecha de nacimiento, el endpoint devuelve siempre el activo. Solo devuelve el entregado reciente si no existe trámite activo.

## 11. Retención

Al pasar `ENTREGADO`:

- `closed_at = now()`.

Job diario:

1. si `closed_at < now() - retention_days`, agregar las métricas históricas necesarias en `metrics_monthly`;
2. eliminar el expediente detallado y relaciones dependientes que ya no se necesiten;
3. conservar únicamente agregados no identificables.

No acumular indefinidamente expedientes anonimizados.

## 12. Índices mínimos

- `cases(cedula)`;
- `cases(cedula, birth_date, status)`;
- `cases(passport_number)` único parcial cuando no sea null y el registro no esté fusionado;
- `cases(normalized_name)` o índice adecuado si el spike demuestra que mejora la conciliación;
- `cases(consulate_id, status)`;
- `cases(created_at)`;
- `cases(processed_at)`;
- `cases(passport_number)` parcial cuando no sea null;
- `shipments(consulate_id, status)`;
- `events(case_id, created_at)`;
- `review_cases(status, created_at)`.
