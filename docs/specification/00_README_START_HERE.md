# DEMP — paquete maestro para Codex

Versión: 1.1  
Fecha: 3 de octubre de 2026

## Finalidad

Este paquete contiene la especificación funcional y técnica consolidada y revisada críticamente del proyecto DEMP («¿Dónde está mi pasaporte?») para construir una PWA de seguimiento y gestión operativa de pasaportes ecuatorianos, inicialmente para la red consular del Ecuador en España.

DEMP tiene dos objetivos inseparables:

1. Permitir al ciudadano consultar de forma simple si su pasaporte está todavía en gestión, ha sido emitido, enviado o está disponible para retiro.
2. Dar a los consulados y al Centro de Impresión de Madrid una herramienta mínima de trazabilidad y organización de registros, prioridades, pasaportes impresos, lotes, envíos, recepción y entrega, sin duplicar las funciones de SEDIP.

## Regla principal del proyecto

La simplicidad es un requisito funcional. Si una solución añade pasos, pantallas, campos o trabajo manual sin una utilidad clara, debe descartarse. La aplicación fallará como producto si los funcionarios la perciben como «una tarea más».

## Orden recomendado de lectura para Codex

1. `01_ESPECIFICACION_MAESTRA.md`
2. `02_ARQUITECTURA_Y_SEGURIDAD.md`
3. `03_MODELO_DATOS_Y_REGLAS.md`
4. `04_CRITERIOS_ACEPTACION_Y_PRUEBAS.md`
5. `05_PLAN_IMPLEMENTACION.md`
6. `06_PROMPT_MAESTRO_CODEX.md`
7. `schema.sql`
8. `08_REVISION_CRITICA_v1.1.md`

## Cómo usar este paquete

Para una sesión nueva de Codex, subir todos los archivos del paquete y pegar el contenido de `06_PROMPT_MAESTRO_CODEX.md` como instrucción inicial.

El prompt maestro ordena trabajar por fases. No debe intentarse resolver todo con una única pantalla o un único commit. Cada fase debe quedar funcional y probada antes de continuar.

## Fuentes de verdad

Estos documentos prevalecen sobre conversaciones anteriores. Cuando existan contradicciones internas, el siguiente orden de precedencia resuelve el conflicto:

1. `01_ESPECIFICACION_MAESTRA.md` para comportamiento funcional.
2. `03_MODELO_DATOS_Y_REGLAS.md` para reglas de negocio y persistencia.
3. `02_ARQUITECTURA_Y_SEGURIDAD.md` para tecnología y seguridad.
4. `04_CRITERIOS_ACEPTACION_Y_PRUEBAS.md` para determinar cuándo una función está terminada.

Codex no debe inventar funcionalidades, campos, roles o flujos que no consten en estos documentos. Si encuentra una ambigüedad no material, debe elegir la alternativa más simple. Solo debe pedir una decisión cuando la ambigüedad cambie de forma sustantiva el flujo, la seguridad o el coste.

## Material de prueba

No incluir documentos reales de ciudadanos en el repositorio. Para pruebas se utilizarán datos sintéticos o imágenes expresamente anonimizadas. Los ejemplos reales de pasaportes y cédulas compartidos durante la fase de diseño no forman parte de este paquete.

## Cambios de la revisión 1.1

La versión 1.1 corrige riesgos detectados al revisar el paquete como si fuera a implementarse de inmediato: convivencia temporal de duplicados creados en Madrid durante conciliación, retención que podría hacer crecer indefinidamente la base de datos, identificación correcta de NUI/cédula en modelos de cédula con MRZ, control de escaneo repetido, tratamiento de faltantes que aparecen después, selección del trámite vigente en la consulta pública, caché offline de PII y pruebas de volumen más realistas.
