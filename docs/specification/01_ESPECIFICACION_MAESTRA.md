# DEMP — especificación maestra funcional

## 1. Alcance

DEMP es una aplicación web progresiva (PWA), mobile-first y funcional también en ordenador. Su alcance inicial es el seguimiento de pasaportes emitidos por las oficinas ecuatorianas en España:

- Madrid, además Centro de Impresión.
- Barcelona.
- Valencia.
- Murcia.
- Palma de Mallorca.
- Málaga.
- Bilbao.
- Tenerife.

DEMP no sustituye a SEDIP. SEDIP continúa gestionando la captura biométrica, fotografía, firma, emisión, controles biométricos finales, activación y demás actos propios del pasaporte.

La arquitectura debe permitir incorporar en el futuro otros documentos, especialmente cédulas de identidad, sin reconstruir el sistema.

## 2. Principios de producto

- Mobile-first, con experiencia cercana a una app nativa.
- Mínimo número de clics y pantallas.
- Acciones repetitivas disponibles por lote.
- Corrección directa en la misma pantalla.
- Guardado automático.
- Opción de deshacer hasta la siguiente acción incompatible.
- El trabajo interno ordinario no debe detenerse por una caída temporal de internet.
- DEMP almacena solo los datos necesarios.
- No guarda fotografías de documentos ni la cadena MRZ completa.
- No construye auditorías pesadas ni duplica funciones ya cubiertas por SEDIP.
- Cuando una opción técnica menor no esté especificada, se elige la alternativa más simple, gratuita o de coste mínimo, segura y mantenible.

## 3. Escala de diseño

- 10 a 20 usuarios internos como máximo.
- Hasta aproximadamente 12.000 trámites mensuales.
- Conservación identificable por defecto: 6 meses desde la entrega.
- Posibilidad de ampliar la conservación hasta 1 año si posteriormente existe una necesidad institucional o jurídica.

## 4. Roles

### 4.1. Consulado

Cada usuario está asociado a una oficina. Puede:

- registrar trámites;
- cargar registros desde archivo;
- buscar sus trámites;
- corregirlos mientras Madrid no los haya procesado;
- solicitar prioridad indicando motivo;
- ver información de envíos que le correspondan;
- confirmar recepción de lotes;
- marcar pasaportes como entregados;
- generar reportes únicamente de su consulado.

El punto de bloqueo de edición del consulado es la primera lectura/vinculación exitosa de la MRZ en Madrid.

### 4.2. Centro de Impresión de Madrid

Madrid puede operar sobre todos los trámites y tiene capacidad de corrección operativa después de la lectura MRZ. Sus tres accesos principales deben ser:

- Iniciar lectura.
- Preparar envíos.
- Prioritarios.

Funciones secundarias, como casos para revisar, reportes o cohortes antiguas, no deben recargar la pantalla inicial.

### 4.3. Superadministrador

No participa en la operación diaria. Puede:

- crear, activar y desactivar usuarios;
- asignar usuarios a una oficina;
- administrar consulados;
- modificar parámetros generales;
- consultar información y reportes globales.

No corrige trámites ordinarios.

## 5. Autenticación

- Correo electrónico y contraseña propios de DEMP.
- No integración con Microsoft 365.
- Sin segundo factor en la primera versión.
- El superadministrador crea o restablece usuarios.
- Debe poder forzarse el cambio de contraseña inicial.

## 6. Registro inicial

La pantalla ofrece tres opciones:

1. `Escanear documento`.
2. `Ingresar manualmente`.
3. `Cargar archivo`.

Campos mínimos del trámite:

- cédula;
- nombres;
- apellidos;
- fecha de nacimiento;
- correo electrónico opcional.

El sistema añade automáticamente:

- identificador interno UUID;
- oficina;
- usuario;
- fecha y hora de creación;
- fecha/hora del trámite (`application_at`), por defecto igual al momento de registro;
- origen del registro.

`application_at` permite medir cohortes y tiempo captura→impresión. Normalmente no se pide al funcionario: se completa solo. Puede corregirse antes de que Madrid procese el trámite si una carga con archivo corresponde a una fecha anterior.

### 6.1. Escanear documento

El funcionario elige `Cédula` o `Pasaporte anterior`.

Para cédula:

- preferir MRZ cuando el modelo disponga de ella;
- si no existe o no se puede leer, usar OCR del anverso;
- si falla, permitir corrección/ingreso manual en la misma pantalla.

Para pasaporte anterior:

- usar MRZ.

La imagen es temporal y se descarta inmediatamente después del procesamiento.

### 6.2. Ingreso manual

Formulario mínimo con los cinco campos indicados. Guardado automático al completar.

### 6.3. Cargar archivo

Importación de Excel/CSV con los mismos campos mínimos. El sistema:

- muestra todas las filas en pantalla;
- señala errores;
- permite corregirlos directamente;
- consolida los registros solo después de la validación.

No debe obligar a descargar, corregir y volver a subir el archivo.

## 7. Prioridad

El consulado puede solicitar prioridad únicamente si escribe un motivo.

Madrid ve la solicitud en `Prioritarios` y puede:

- aceptar;
- rechazar.

El rechazo exige motivo, que se comunica al consulado. Si se acepta, la prioridad acompaña al trámite durante el resto del flujo sin separar el pasaporte de las listas o lotes normales.

El ciudadano solo ve la indicación `Trámite en gestión prioritaria` una vez que Madrid la haya aceptado. No ve los motivos.

## 8. Lectura de pasaportes emitidos en Madrid

La lectura ocurre una sola vez, después del control de calidad del pasaporte físico.

La pantalla funciona en modo continuo:

1. cámara abierta;
2. se presenta el pasaporte;
3. se lee la MRZ;
4. se extraen los datos;
5. DEMP busca la coincidencia;
6. si es correcta, registra automáticamente;
7. muestra confirmación visual clara y sonido breve;
8. queda inmediatamente preparado para el siguiente pasaporte.

No hay botón de confirmación para lecturas correctas.

Datos que se conservan del pasaporte emitido:

- cédula/número personal;
- nombres;
- apellidos;
- fecha de nacimiento;
- número de pasaporte/libretín.

No se conservan por defecto nacionalidad, sexo, tipo de documento, fecha de caducidad ni la imagen.

## 9. Matching y conciliación

La vinculación automática se considera segura cuando coinciden:

- cédula;
- fecha de nacimiento.

El nombre se normaliza para comparación, pero no determina por sí solo la unión. La normalización para comparación convierte a mayúsculas, elimina tildes y caracteres de formato y trata Ñ como N únicamente para comparar.

### 9.1. Sin coincidencia exacta

La lectura no se detiene.

DEMP debe:

1. buscar automáticamente candidatos probables con los datos extraídos;
2. si no puede resolver de forma segura, crear un registro funcional desde la MRZ;
3. permitir continuar con el siguiente pasaporte;
4. intentar la conciliación posteriormente.

### 9.2. Casos para revisar

Solo coincidencias dudosas. Pantalla simple con:

- `Es la misma persona`;
- `No corresponde`;
- `Revisar después`.

La cola nunca bloquea lectura, lotes o envíos.

### 9.3. Cohortes

DEMP puede detectar registros antiguos que siguen sin correspondencia mientras Madrid ya procesa fechas posteriores. Se agrupan por consulado y fecha de registro para ayudar a detectar errores o duplicados. No bloquean la operación.

## 10. Sesiones de lectura y clasificación

Una sesión de lectura no es un lote.

Madrid puede iniciar una sesión con un consulado de enfoque. Si una lectura coincide con un trámite de otra oficina:

- DEMP muestra un aviso visible;
- registra el pasaporte;
- no lo añade al grupo equivocado;
- lo clasifica en la bandeja de su consulado real.

Si no existe registro previo, la lectura no se detiene. Se crea el registro desde MRZ. Cuando la sesión tiene un consulado de enfoque seleccionado, ese consulado se usa como destino provisional y el alta queda marcada expresamente como `destino provisional` hasta que la conciliación confirme o corrija la oficina. Este mecanismo no debe bloquear el lote, pero tampoco debe presentar una asignación provisional como dato definitivo.

## 11. Bandejas de impresos pendientes de envío

Cada consulado distinto de Madrid tiene una bandeja derivada de pasaportes ya emitidos y todavía no incluidos en un envío.

La bandeja muestra solo lo necesario:

- nombre;
- cédula;
- fecha de lectura/confirmación en Madrid;
- marca de prioridad cuando aplique.

Se puede seleccionar uno, varios o todos.

## 12. Lotes y envíos

El lote representa lo que físicamente se introduce en una valija/envío.

Estados mínimos del lote:

- `ABIERTO`;
- `PREPARADO`;
- `ENVIADO`;
- `RECIBIDO`.

Mientras está abierto puede modificarse. Al pasar a preparado, su composición queda congelada. Antes del envío puede reabrirse excepcionalmente con confirmación. Una vez enviado, la composición no se cambia.

El número de seguimiento es opcional. El lote puede marcarse como enviado sin tracking. En ese caso el consulado ve `Enviado — número de seguimiento pendiente`. Madrid puede completarlo después.

El transportista puede ser un campo opcional, no obligatorio.

## 13. Recepción

El consulado receptor ve sus lotes con:

- identificador;
- fecha de salida;
- cantidad;
- tracking cuando exista.

El flujo normal es un solo botón: `Confirmar recepción`.

Al recibir:

- los pasaportes del lote pasan a `Disponible para retiro`;
- no se reescanean.

Excepción mínima: si falta físicamente un pasaporte, se marca ese ítem como faltante. El resto se recibe normalmente. No existe un módulo general de incidencias.

El faltante queda visible como una señal pasiva para Madrid y el consulado receptor, sin abrir un flujo adicional. Si posteriormente aparece el pasaporte, puede marcarse como recibido desde el mismo lote y pasa entonces a `Disponible para retiro`.

## 14. Entrega

SEDIP realiza biometría, activación y controles de entrega.

En DEMP el funcionario:

1. localiza el trámite por cédula, nombre o número de pasaporte;
2. marca `Entregado`.

No se escanea nuevamente. Se registra automáticamente fecha, hora y usuario.

## 15. Estados internos del trámite

Estados mínimos:

- `REGISTRADO`;
- `EMITIDO`;
- `PREPARADO_ENVIO`;
- `ENVIADO`;
- `DISPONIBLE_RETIRO`;
- `ENTREGADO`.

Las transiciones se producen por acciones reales; no existe un selector libre de estado.

Madrid como oficina de entrega salta las etapas de envío: lectura MRZ exitosa → `DISPONIBLE_RETIRO`.

## 16. Consulta pública

Pantalla institucional, agradable y muy simple.

Entrada:

- cédula;
- fecha de nacimiento.

No usa código ni QR.

Salida:

- estado público actual;
- fecha del último movimiento relevante;
- siguiente etapa prevista;
- badge de prioridad si fue aceptada.

No muestra nombre, número de pasaporte, correo ni observaciones internas.

La representación será gráfica: etapas cumplidas, etapa actual resaltada y siguiente etapa atenuada. Solo la etapa actual muestra fecha.

Mensajes públicos sugeridos, configurables:

- `REGISTRADO`: **Registro completado.** Su trámite fue registrado correctamente. El siguiente paso es la emisión de su pasaporte. Todavía no está disponible para retiro.
- `EMITIDO`: **Pasaporte emitido.** Su pasaporte fue gestionado correctamente en el Centro de Impresión. El siguiente paso es preparar su envío al consulado. Todavía no está disponible para retiro.
- `PREPARADO_ENVIO`: **Preparado para envío.** Su pasaporte está preparado para ser enviado a su consulado. Todavía no está disponible para retiro.
- `ENVIADO`: **Enviado al consulado.** Su pasaporte fue enviado a su consulado. Todavía no está disponible para retiro.
- `DISPONIBLE_RETIRO`: **Disponible para retiro.** Su pasaporte ya puede ser retirado en el consulado correspondiente.
- `ENTREGADO`: **Pasaporte entregado.** El pasaporte fue entregado el [fecha].

Para Madrid se omiten los pasos de envío.

## 17. Notificaciones

El correo del ciudadano es opcional.

La consulta web es el mecanismo principal. El correo es complementario y está condicionado al nivel gratuito del proveedor.

Los disparadores son configurables. Por defecto debe priorizarse `Disponible para retiro`. Si el volumen y el plan gratuito lo permiten, pueden activarse otros.

Los correos no deben incluir datos personales innecesarios; deben invitar a consultar el portal.

## 18. Reportes

Cada consulado ve solo sus datos. Madrid y superadministrador pueden generar reportes globales.

Generador flexible con:

- filtros;
- selección de columnas;
- exportación a Excel;
- configuraciones guardables.

PDF es opcional y solo se implementa si resulta trivial. No es requisito del MVP.

Métricas útiles sin trabajo manual adicional:

- tiempo registro → lectura en Madrid;
- tiempos por consulado y periodo;
- cantidad de registros creados directamente en Madrid;
- distribución por estado;
- producción y envíos por periodo.

## 19. Corrección, guardado y deshacer

- El consulado corrige antes de la primera lectura MRZ de Madrid.
- Madrid corrige después de ese punto.
- Edición directa en pantalla.
- Guardado automático.
- Confirmación visual discreta.
- `Deshacer` disponible hasta la siguiente acción incompatible.
- Acciones masivas muestran confirmación previa y también permiten deshacer.
- Si otro usuario ya modificó un registro, no se sobrescribe al deshacer.
- Reaperturas o deshacer de estados logísticos se permiten solo mientras no exista una acción física/posterior incompatible; por ejemplo, un lote enviado no puede volver a editar su composición.

## 20. Offline

La pérdida temporal de internet no debe detener el trabajo interno ordinario.

La PWA debe poder mantener localmente, cuando sea posible:

- creación de registros;
- lecturas;
- cambios operativos;
- marcación de entregas.

Las acciones se sincronizan automáticamente al volver la conexión. Si existe conflicto real con un cambio remoto, no se sobrescribe silenciosamente.

La caché offline debe contener solo los datos imprescindibles para la tarea actual, excluir correo cuando no sea necesario, purgarse al cerrar sesión y eliminar registros locales sincronizados que ya no sean necesarios.

La consulta pública requiere conexión.

## 21. Retención

- El trámite entregado permanece identificable 6 meses por defecto.
- Parámetro configurable hasta un máximo operativo de 365 días.
- Después se eliminan o anonimizan PII y se conservan únicamente datos estadísticos no identificables cuando sean útiles.
