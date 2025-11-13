# Sistema de Gestión de Inventario - Preparado para Vercel

## Qué cambié
- Moví las credenciales a variables de entorno (`.env.example`).
- Añadí funciones serverless en `/api/products/` (get, add, update, delete) que usan la API REST de Supabase.
- Reemplacé `src/utils/supabase/info.tsx` para leer `import.meta.env` y `process.env` (server).
- Añadí `.gitignore` y `vercel.json`.

## Variables de entorno necesarias (en Vercel -> Settings -> Environment Variables)
- `VITE_SUPABASE_URL` = https://<your-project-id>.supabase.co
- `VITE_SUPABASE_ANON_KEY` = <anon public key>
- `SUPABASE_SERVICE_KEY` = <service_role key>  (solo en producción, server-only)

## Despliegue en Vercel (resumen)
1. Subir repo a GitHub.
2. Conectar el repo en https://vercel.com/new.
3. Configurar las variables de entorno (ver arriba).
4. Build command: `npm run build`
5. Output directory: `build`
6. Desplegar.

## Notas
- No subas `.env` ni claves privadas.
- Si necesitas que las funciones validen autenticación más estricta, lo puedo añadir (JWT/sesiones).
"# sistema-de-inventario"  
