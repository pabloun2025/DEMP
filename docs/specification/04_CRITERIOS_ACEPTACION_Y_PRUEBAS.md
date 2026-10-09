# DEMP — criterios de aceptación y plan de pruebas

## 1. Definición de terminado

Una función no se considera terminada porque «se vea». Debe:

- funcionar en móvil y escritorio;
- respetar el rol del usuario;
- manejar error y estado vacío;
- no filtrar PII;
- tener pruebas relevantes;
- funcionar tras recargar;
- considerar offline si corresponde;
- no añadir pasos innecesarios.

## 2. Autenticación

### AC-AUTH-01

Dado un usuario activo con correo/contraseña correctos, puede iniciar sesión y entra directamente a su pantalla operativa.

### AC-AUTH-02

Un usuario inactivo no puede entrar aunque las credenciales sean correctas.

### AC-AUTH-03

Un usuario de un consulado no puede leer ni modificar registros de otro consulado mediante UI ni llamadas directas a API.

### AC-AUTH-04

El superadministrador puede crear/desactivar usuarios, pero no dispone de controles de edición operativa de trámites.

## 3. Registro individual

### AC-REG-01

`Escanear documento`, `Ingresar manualmente` y `Cargar archivo` son visibles desde la misma área de registro.

### AC-REG-02

Ingreso manual con cédula, nombres, apellidos y fecha de nacimiento crea el trámite con estado REGISTRADO y sin más pasos.

### AC-REG-03

Email vacío es válido.

### AC-REG-04

Si existe otro trámite activo de la misma cédula, DEMP avisa y no crea un duplicado ordinario.

### AC-REG-05

Una edición válida se guarda automáticamente y permite `Deshacer` hasta la siguiente acción incompatible.

### AC-REG-06

La creación ordinaria desde un consulado bloquea un segundo trámite activo de la misma cédula, pero una alta técnica `MADRID_MRZ` puede coexistir temporalmente cuando el registro previo contiene datos contradictorios; ese caso queda para conciliación y no frena el escaneo.

## 4. Escaneo de cédula/pasaporte anterior

### AC-DOC-01

La imagen capturada no aparece en Storage, IndexedDB ni base de datos después de extraer datos.

### AC-DOC-02

Pasaporte anterior con MRZ válida rellena cédula, nombres, apellidos y fecha de nacimiento.

### AC-DOC-03

Cédula con MRZ usa MRZ como primera opción.

### AC-DOC-04

Si no hay MRZ o falla, el usuario puede usar OCR del anverso y corregir los campos en la misma pantalla.

### AC-DOC-05

Un fallo de OCR nunca impide usar ingreso manual.

### AC-DOC-06

En cada modelo de cédula soportado, DEMP identifica como cédula el NUI/número personal correcto y no confunde ese valor con el número físico/serial del documento cuando ambos existen.

## 5. Archivo de carga

### AC-IMP-01

Un archivo con filas válidas e inválidas se muestra completo; los errores quedan resaltados.

### AC-IMP-02

El usuario corrige filas directamente en pantalla.

### AC-IMP-03

No se consolidan filas inválidas sin corrección.

### AC-IMP-04

Se puede confirmar un conjunto grande sin abrir fila por fila.

## 6. Prioridades

### AC-PRI-01

No se puede solicitar prioridad sin motivo.

### AC-PRI-02

Madrid ve la solicitud inmediatamente en Prioritarios.

### AC-PRI-03

No se puede rechazar sin motivo.

### AC-PRI-04

Una prioridad aceptada se muestra como badge dentro de las listas normales y no crea una lista logística independiente.

### AC-PRI-05

La consulta pública solo muestra `Trámite en gestión prioritaria` después de aceptación.

## 7. Lectura continua Madrid

### AC-MRZ-01

La cámara permanece activa entre pasaportes.

### AC-MRZ-02

Una lectura válida que coincide por cédula + fecha de nacimiento se registra sin pulsar confirmación.

### AC-MRZ-03

Se muestra feedback visual y, si está habilitado, acústico.

### AC-MRZ-04

La imagen y MRZ cruda no se persisten.

### AC-MRZ-05

Un pasaporte ya leído no genera un segundo caso.

### AC-MRZ-06

Si el caso pertenece a otro consulado que el consulado de enfoque, DEMP lo registra y lo envía a la bandeja correcta, mostrando aviso.

### AC-MRZ-07

Si no existe registro previo, DEMP crea un caso source MADRID_MRZ y permite continuar inmediatamente.

### AC-MRZ-08

Un error o caso para revisión no bloquea el siguiente escaneo.

### AC-MRZ-09

En móvil se abre por defecto la cámara trasera cuando el navegador lo permite.

### AC-MRZ-10

Después de una lectura correcta, mantener el mismo pasaporte frente a la cámara no produce múltiples confirmaciones ni múltiples acciones; la lectura se rearma al retirar el documento o detectar una MRZ distinta.

## 8. Conciliación

### AC-REV-01

Casos dudosos aparecen en `Casos para revisar` sin afectar estado de lotes.

### AC-REV-02

La pantalla muestra solo información necesaria para decidir y tres acciones: misma persona, no corresponde, revisar después.

### AC-REV-03

Fusionar no elimina trazabilidad básica de que hubo conciliación.

## 9. Lotes

### AC-LOT-01

La bandeja por consulado contiene únicamente pasaportes emitidos que no están en un lote enviado/activo correspondiente.

### AC-LOT-02

Selección múltiple y seleccionar todos funcionan.

### AC-LOT-03

Al preparar un lote se muestra cuántos pasaportes serán afectados.

### AC-LOT-04

Un lote PREPARED no cambia de composición sin reapertura explícita.

### AC-LOT-05

Un lote SHIPPED nunca cambia de composición.

### AC-LOT-06

Se puede marcar SHIPPED sin tracking.

### AC-LOT-07

Añadir tracking después actualiza inmediatamente la vista del consulado receptor.

## 10. Recepción

### AC-REC-01

`Confirmar recepción` marca en una acción todos los items como recibidos y los casos como DISPONIBLE_RETIRO.

### AC-REC-02

Antes de confirmar se pueden marcar uno o más items como MISSING; estos permanecen ENVIADO y no bloquean el resto.

### AC-REC-03

No existe un reescaneo obligatorio en destino.

### AC-REC-04

Un ítem marcado MISSING puede marcarse posteriormente como recibido sin reabrir ni alterar la composición del lote; el caso pasa entonces a DISPONIBLE_RETIRO.

## 11. Entrega

### AC-ENT-01

Buscar por cédula, nombre o pasaporte encuentra un caso del consulado.

### AC-ENT-02

Marcar entregado requiere una confirmación breve cuando se aplica en lote.

### AC-ENT-03

La operación registra fecha/usuario y pasa a ENTREGADO.

### AC-ENT-04

DEMP no solicita biometría ni firma.

## 12. Consulta pública

### AC-PUB-01

Solo requiere cédula y fecha de nacimiento.

### AC-PUB-02

No devuelve nombres, email ni número de pasaporte.

### AC-PUB-03

El error de búsqueda es genérico.

### AC-PUB-04

Turnstile se valida en servidor y una llamada directa sin token válido se rechaza.

### AC-PUB-05

La vista muestra estado actual, fecha del último hito y siguiente paso; solo el estado actual lleva fecha.

### AC-PUB-06

Madrid omite pasos de envío.

### AC-PUB-07

Si la misma persona tiene un trámite activo y otro entregado aún dentro de retención, la consulta devuelve el trámite activo; el entregado solo se devuelve cuando no existe uno activo.

## 13. Offline

### AC-OFF-01

Con sesión ya autenticada y red desconectada, el funcionario puede crear un registro y este aparece como pendiente de sincronización.

### AC-OFF-02

Al recuperar red, el registro se sincroniza una sola vez.

### AC-OFF-03

Reintentar una acción con el mismo action_id no duplica el efecto.

### AC-OFF-04

Si row_version cambió en servidor, DEMP no sobrescribe y muestra conflicto.

### AC-OFF-05

La UI distingue claramente offline/sincronizando/sincronizado sin bloquear el trabajo.

### AC-OFF-06

Al cerrar sesión se purga la caché local de casos/PII del usuario. Acciones ya sincronizadas y no necesarias se eliminan de la outbox/caché.

### AC-OFF-07

Si Madrid está offline y aparece un pasaporte de un consulado cuyos datos no están cacheados, la lectura se conserva sin pérdida y la clasificación definitiva se completa al recuperar conexión; no se inventa silenciosamente un destino definitivo.

## 14. Retención

### AC-RET-01

Un caso entregado hace más de `retention_days` se agrega estadísticamente y se elimina del almacenamiento detallado por el job programado.

### AC-RET-02

Después de la purga no puede recuperarse PII ni el expediente detallado desde la app o endpoints públicos.

### AC-RET-03

Las métricas agregadas siguen disponibles sin identificación personal.

## 15. Reportes

### AC-REP-01

Un consulado no puede incluir datos de otro consulado en su exportación.

### AC-REP-02

Madrid y superadministrador pueden filtrar globalmente.

### AC-REP-03

Excel exporta las columnas seleccionadas.

### AC-REP-04

Los valores potencialmente peligrosos para fórmulas se escapan.

### AC-REP-05

Una configuración guardada se puede volver a ejecutar con datos actuales.

## 16. Compatibilidad mínima

Probar como mínimo:

- iPhone/Safari actual.
- Android/Chrome actual.
- Chrome/Edge de escritorio.
- Safari de macOS.

## 17. Pruebas de volumen

Antes de producción:

- importar al menos 1.000 trámites sintéticos en una prueba;
- simular al menos 75.000 casos vivos y un volumen proporcional de eventos/lotes (objetivo orientativo: 300.000+ filas relacionadas) para aproximar seis meses de operación máxima;
- comprobar que búsquedas por cédula y bandejas por estado usan índices y responden con fluidez;
- probar 50 consultas públicas concurrentes sin PII en errores;
- probar una sesión continua de al menos 100 lecturas simuladas sin crecimiento de memoria evidente en el navegador.

## 18. Pruebas de seguridad

- RLS negativo entre consulados.
- Endpoint público sin Turnstile.
- Intentos de enumeración.
- XSS en nombres/importación.
- CSV/Excel formula injection.
- Service role ausente del bundle frontend.
- Imágenes no persistidas.
- Logs sin cédulas/fechas de nacimiento en texto plano cuando no sean imprescindibles.
