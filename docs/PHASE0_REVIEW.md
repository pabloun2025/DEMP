# Revisión técnica y alcance de Fase 0

No se detectó una contradicción técnica material entre la especificación vigente y el README original: este último no contenía requisitos técnicos.

Riesgos y límites que siguen abiertos:

- La MRZ TD3 de un pasaporte puede incluir un número personal opcional, pero ICAO no garantiza que sea la cédula ecuatoriana. El prototipo lo extrae como `personalNumber`; no debe etiquetarse como cédula sin validar muestras anonimizadas de los documentos y modelos admitidos.
- El paquete exige validar el NUI de cada modelo de cédula, pero no aporta muestras sintéticas con la asignación de campos de esos modelos. Esa validación queda bloqueada hasta disponer de fixtures anonimizados o la definición oficial de cada formato.
- La cámara y OCR se implementan como spike local con Tesseract.js y preferencia `environment`. La viabilidad en iPhone/Safari y Android/Chrome requiere prueba física; no puede afirmarse desde CI.
- La Fase 0 incluye migración y variables de Supabase, pero usa un servidor local simulado para demostrar idempotencia y conflicto, tal como permite el encargo. No conecta a Supabase ni requiere secretos.
