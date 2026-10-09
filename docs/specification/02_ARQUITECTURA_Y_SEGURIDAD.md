# DEMP — arquitectura técnica y seguridad

## 1. Decisión de arquitectura

Arquitectura de referencia seleccionada por simplicidad, coste y mantenibilidad:

- Frontend/PWA: React + TypeScript + Vite.
- Hosting de frontend: Cloudflare Pages.
- PWA/service worker: `vite-plugin-pwa` / Workbox.
- Offline local: IndexedDB mediante Dexie.
- Backend gestionado: Supabase.
- Base de datos: PostgreSQL de Supabase.
- Autenticación interna: Supabase Auth con correo/contraseña.
- Funciones sensibles: Supabase Edge Functions / RPC PostgreSQL.
- Protección consulta pública: Cloudflare Turnstile, validado en servidor.
- Notificaciones: Brevo como proveedor inicial de correo transaccional.
- Backups externos antes de producción: `pg_dump` programado y cifrado a almacenamiento privado; Cloudflare R2 es la opción preferida por su nivel gratuito.

No se montará servidor propio ni se introducirán microservicios.

## 2. Motivo de la elección

Supabase ofrece en un mismo servicio Postgres, autenticación, API, RLS y Edge Functions. Para DEMP, el modelo relacional encaja mejor que un almacén documental porque hay relaciones naturales entre trámites, usuarios, prioridades, sesiones, lotes y reportes.

Cloudflare Pages aloja el frontend estático sin coste por solicitudes de assets. Turnstile protege la consulta pública sin coste y sin un CAPTCHA intrusivo permanente.

La PWA mantiene la interfaz y una cola local en IndexedDB para que las caídas temporales de red no paralicen al funcionario.

## 3. Límites actuales relevantes y estrategia

### Supabase Free

Verificado en octubre de 2026:

- 500 MB de base de datos por proyecto.
- 50.000 usuarios activos mensuales.
- 5 GB de egress no cacheado + 5 GB cacheado según la métrica de la plataforma.
- 500.000 invocaciones de Edge Functions.

Para DEMP el límite que requiere vigilancia es principalmente la base de datos. Con 12.000 trámites/mes y retención identificable de seis meses, el diseño debe mantenerse compacto y purgar/anonimizar registros cerrados de forma automática.

Objetivos operativos:

- alerta interna al superar 300 MB;
- alerta crítica al superar 400 MB;
- nunca permitir que la base alcance 500 MB sin una acción de limpieza o migración.

La aplicación debe incluir una consulta de salud/uso visible al superadministrador.

### Cloudflare Pages / Workers

- Assets estáticos de Pages: gratuitos e ilimitados.
- El plan gratuito de Workers contempla 100.000 solicitudes/día si se utilizan funciones de Cloudflare.

DEMP debe mantener la mayor parte del tráfico estático en Pages y usar Supabase para datos.

### Cloudflare Turnstile

- Plan gratuito.
- Retos/verificaciones ilimitados para la escala de DEMP.

### Brevo

- Plan gratuito: 300 emails/día.

Por ello el correo no es parte crítica del flujo. Se usa una cola con un límite diario configurable. `Disponible para retiro` tiene prioridad sobre cualquier otro aviso. Si se alcanza la cuota, la consulta web continúa siendo la fuente de verdad.

### Cloudflare R2

Nivel gratuito actual:

- 10 GB-mes de almacenamiento estándar;
- 1 millón de operaciones clase A/mes;
- 10 millones de operaciones clase B/mes;
- egress gratuito.

Es suficiente para mantener un conjunto pequeño de backups cifrados rotativos.

## 4. Coste esperado

Objetivo inicial:

- Cloudflare Pages: 0 EUR.
- Supabase Free: 0 EUR.
- Turnstile: 0 EUR.
- Brevo Free: 0 EUR.
- R2 dentro del nivel gratuito: 0 EUR.
- Dominio: único gasto previsto relevante, normalmente dentro del presupuesto total de 100 EUR.

No debe activarse automáticamente ningún plan de pago.

Si algún límite gratuito se aproxima, DEMP debe mostrar una advertencia antes de que el servicio se degrade. La decisión de pagar o migrar se toma de forma explícita.

## 5. PWA y offline

### 5.1. App shell

El service worker cachea:

- HTML principal;
- JS/CSS versionados;
- iconos;
- assets necesarios;
- modelos OCR/MRZ necesarios cuando sea viable por tamaño y licencia.

### 5.2. IndexedDB

Dexie administra como mínimo:

- `outbox`: acciones aún no sincronizadas;
- `cached_cases`: subconjunto estrictamente necesario para la sesión/consulado;
- `cached_settings`;
- `sync_meta`.

No se persisten imágenes de documentos en IndexedDB.

La caché de PII se limita al mínimo necesario para la operación offline activa. Debe:

- quedar restringida al usuario/consulado actual;
- excluir email y datos no necesarios para matching;
- eliminar acciones ya sincronizadas cuando no deban conservarse;
- purgar `cached_cases` al cerrar sesión;
- aplicar una caducidad corta a datos cacheados;
- no reutilizar caché de un usuario para otro en el mismo dispositivo.

### 5.3. Outbox

Cada acción offline contiene:

- `action_id` UUID idempotente;
- tipo de acción;
- payload mínimo;
- `entity_id` si existe;
- versión conocida del registro;
- timestamp local;
- usuario.

Al recuperar internet se envían en orden. El servidor registra `action_id` para que un reintento no duplique operaciones.

### 5.4. Conflictos

Cada entidad mutable relevante incluye `row_version`.

Si el servidor tiene una versión distinta a la que conocía el dispositivo:

- no sobrescribir;
- poner el elemento en `conflicto de sincronización`;
- mostrar comparación mínima;
- permitir al usuario autorizado resolver.

## 6. MRZ y OCR

### 6.1. Pasaporte

Reconocimiento en el cliente para no enviar imágenes a servidores.

Enfoque recomendado:

- abrir por defecto la cámara trasera (`environment`) en móvil, con opción de cambiar de cámara;
- capturar frames de cámara;
- detectar/recortar la zona inferior MRZ;
- preprocesar contraste, escala de grises y perspectiva si es necesario;
- OCR local con Tesseract.js/WASM u otra biblioteca open-source equivalente;
- parsear MRZ conforme a ICAO Doc 9303;
- validar dígitos de control antes de aceptar la lectura;
- aplicar `debounce/cooldown` tras una lectura correcta para que el mismo pasaporte no dispare confirmaciones repetidas mientras sigue frente a la cámara; rearmar la lectura cuando el documento se retire o aparezca una MRZ distinta.

La biblioteca concreta puede cambiar si la prueba de concepto demuestra que otra opción open-source funciona mejor en iOS/Android.

### 6.2. Cédula

- Si existe MRZ, misma estrategia.
- Si no existe, OCR del anverso.
- Si OCR falla, completar/corregir manualmente.
- La prueba de concepto debe verificar expresamente qué campo de la MRZ corresponde a la cédula/NUI en cada modelo soportado. En modelos recientes puede coexistir un número físico/de documento con el NUI; DEMP debe guardar el NUI/cédula del ciudadano, no confundirlo con el serial o número del soporte.

### 6.3. Regla de privacidad

No guardar:

- foto capturada;
- frames;
- cadena MRZ completa.

Solo persistir los campos funcionales necesarios.

## 7. Autenticación y autorización

### 7.1. Auth

Supabase Auth, email/password.

El superadministrador crea usuarios mediante una Edge Function protegida que utiliza la API administrativa de Supabase. La clave `service_role` nunca llega al navegador.

### 7.2. RLS

Todas las tablas operativas deben tener Row Level Security.

Política general:

- Consulado: SELECT de sus trámites/lotes; UPDATE de sus trámites solo antes de `processed_at`/lectura Madrid; INSERT para sus nuevos registros.
- Madrid: SELECT global y permisos operativos globales.
- Superadministrador: SELECT global para reportes; no edición operativa ordinaria de trámites.
- Anónimo: cero acceso directo a tablas operativas.

La consulta pública solo funciona mediante una Edge Function.

### 7.3. Consulta pública

La función pública recibe:

- cédula;
- fecha de nacimiento;
- token Turnstile.

El servidor:

1. valida Turnstile (modo gestionado/frictionless siempre que sea posible);
2. normaliza inputs;
3. consulta primero el trámite activo; solo si no existe uno activo, busca el trámite entregado más reciente aún dentro de retención;
4. devuelve únicamente estado público, fecha del último hito, siguiente paso y prioridad aceptada.

La función debe aplicar limitación básica de abuso sin almacenar PII en logs. La protección no debe introducir un CAPTCHA visible en cada consulta si Turnstile puede resolverla de forma no interactiva.

Nunca devuelve PII adicional.

El mensaje de inexistencia o error debe ser genérico.

No registrar en logs el cuerpo con cédula/fecha de nacimiento.

## 8. Contraseñas

- Longitud mínima razonable (12 caracteres recomendados).
- Supabase almacena hashes; DEMP nunca almacena contraseñas en tablas propias.
- Superadministrador puede establecer contraseña temporal.
- Primer acceso con contraseña temporal obliga a cambio.
- Limitación de intentos y bloqueo temporal según capacidades de Auth.

## 9. Retención y anonimización

Un job diario con `pg_cron` debe buscar trámites `ENTREGADO` cuya fecha supere el parámetro `retention_days` (180 por defecto, máximo 365).

Antes de eliminar detalle, consolidar las métricas necesarias en una tabla agregada por periodo/consulado.

Después de la consolidación, eliminar el expediente detallado y sus datos personales/relaciones que ya no sean necesarios. No conservar indefinidamente filas de casos y eventos meramente anonimizadas, porque el límite de 500 MB del plan gratuito se alcanzaría con el tiempo.

Las métricas históricas de largo plazo deben vivir en tablas agregadas pequeñas, no en expedientes individuales.

## 10. Backups

Supabase Free no incluye backups automáticos descargables. Antes de producción debe implementarse un backup externo automatizado.

Diseño recomendado:

- GitHub Actions diario o cada 48 horas;
- ejecutar `pg_dump` de esquema + datos;
- comprimir;
- cifrar con una clave guardada como secret;
- subir a bucket R2 privado;
- conservar una ventana rotativa (por ejemplo 14 copias);
- documentar restauración.

No guardar dumps sin cifrar en repositorios ni artefactos públicos.

## 11. Cabeceras y seguridad web

Configurar como mínimo:

- HTTPS obligatorio;
- CSP restrictiva compatible con Supabase/Turnstile;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy` restrictiva;
- `Permissions-Policy` limitando cámara solo donde se necesita;
- no cachear respuestas con PII;
- protección CSRF cuando aplique;
- sanitización de exportaciones CSV/Excel para evitar formula injection.

## 12. Exportaciones

En Excel/CSV, cualquier valor que comience con `=`, `+`, `-` o `@` y provenga de datos del usuario debe escaparse para evitar inyección de fórmulas.

## 13. Observabilidad mínima

No construir plataforma compleja de logs.

Registrar:

- errores de aplicación;
- fallos de sincronización;
- fallos de correo;
- tamaño de base de datos;
- volumen básico de Edge Functions;
- excepciones de lectura/OCR sin imágenes.

No incluir PII en mensajes de error o logs salvo necesidad técnica estricta.

## 14. Fuentes oficiales verificadas (octubre de 2026)

- Supabase pricing: https://supabase.com/pricing
- Supabase billing/quotas: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase database size: https://supabase.com/docs/guides/platform/database-size
- Supabase backups: https://supabase.com/docs/guides/platform/backups
- Cloudflare Pages pricing: https://developers.cloudflare.com/pages/functions/pricing/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Turnstile plans: https://developers.cloudflare.com/turnstile/plans/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Brevo Free limits: https://help.brevo.com/hc/es/articles/208580669-FAQ-Cu%C3%A1les-son-los-l%C3%ADmites-del-plan-Gratis

## 15. Riesgos técnicos que deben probarse antes de cerrar el stack

Además del spike general de MRZ y offline, la Fase 0 debe verificar: (a) lectura del NUI correcto en los modelos de cédula soportados; (b) rendimiento de OCR/MRZ en cámara trasera de iPhone y Android; (c) ausencia de relecturas repetidas del mismo documento; (d) tamaño real de una cohorte offline de Madrid; y (e) estimación de crecimiento de PostgreSQL con 72.000 expedientes vivos más eventos/índices.
