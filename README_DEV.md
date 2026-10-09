# DEMP — Fase 0

Prototipo estricto de los dos riesgos: lectura MRZ local y cola offline idempotente. No implementa autenticación, registros reales ni flujos de Fase 1 en adelante.

## Ejecutar

```bash
npm install --cache /tmp/demp-npm-cache
npm run dev:cloud
```

Use la vista previa web de Codex para abrir el servidor en el puerto 4173. No abra `index.html` ni `dist/index.html` mediante `file://`: Vite debe servir la aplicación por HTTP. Para usar cámara en un móvil, la URL debe servirse por HTTPS. El navegador solicita cámara trasera cuando está disponible. La prueba sintética no usa imagen ni datos reales.

## Verificar

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

La pantalla demuestra lectura TD3 con dígitos de control, anti-relectura, cola Dexie/IndexedDB, reintento idempotente y conflicto de versión. La sincronización se conecta a un mock local hasta configurar Supabase en una fase posterior.

## Vista previa temporal

Al subir cambios a `main`, GitHub Actions construye el sitio para GitHub Pages. La URL se publica en el resultado del workflow **Deploy temporary preview**. Esta vista es solo para pruebas de Fase 0.

No añada secretos al repositorio. Copie `.env.example` a un archivo `.env.local` solo cuando se configure Supabase.
