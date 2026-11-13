# REGISTRO DE PROGRESO DE PORTABILIDAD (PORT PROGRESS)
## Myspoti Web / iOS PWA
**Referencia Fuente de Verdad:** `kota-zo/Orpheon` (Commit: `70f323c5e5c3c21305b3177eb681e84ba02ce872`)
**Última Actualización:** 13 de Noviembre de 2026

---

## 1. Bitácora de Etapas y Estado Global

| Fase | Tarea / Hito | Estado | Evidencias y Artefactos |
|:---:|---|:---:|---|
| **Fase 1** | Auditoría Completa de la Implementación vs Android | **COMPLETADA** | `docs/PORT_PARITY_MATRIX.md` (79 features catalogadas) |
| **Fase 2** | Estudio de Viabilidad Técnica y Retos (A, B, C, D) | **COMPLETADA** | `docs/TECHNICAL_FEASIBILITY.md`, `docs/KNOWN_LIMITATIONS.md` |
| **Fase 3** | Diseño y Especificación de la Arquitectura Modular | **COMPLETADA** | `docs/WEB_ARCHITECTURE.md` (10 capas desacopladas) |
| **Fase 4** | Setup del BFF (Fastify) y Port de las 179 Ops GQL | **EN PROGRESO** | `src/server/*`, proxy de endpoints, SQLite WAL |
| **Fase 5** | Port de Interfaz UI/UX (Classic, Immersive, AMOLED) | **EN PROGRESO** | `src/client/*`, Vite + React + Tailwind + Mesh Shader |
| **Fase 6** | Motor de Audio, Media Session API y Soporte iOS PWA | **EN PROGRESO** | `src/client/audio/*`, persistent `<audio>`, manifest, SW |
| **Fase 7** | Pruebas Unitarias, Integración y Validación E2E | **PENDIENTE** | `docs/TEST_REPORT.md`, suite de tests Playwright / Vitest |
| **Fase 8** | QA Final, Documentación de Despliegue y Limpieza | **PENDIENTE** | `docs/IMPLEMENTATION_REPORT.md`, README final |

---

## 2. Decisiones Técnicas Clave Adoptadas

1. **Resolución del Reto A (Integración con Spotify):**
   - **Decisión:** Se implementa la **Opción 1: Backend-For-Frontend (BFF)**.
   - **Justificación:** Prioriza al máximo el funcionamiento original de la aplicación, permitiendo que usuarios con cuentas Free o Premium disfruten de la app sin forzar la adquisición obligatoria de Spotify Premium (que requiere el SDK oficial Web Playback).
   - **Mecanismo:** El BFF en Node.js/Fastify actúa como intermediario seguro para sortear las políticas de CORS del navegador, gestionando tokens, headers de cliente y transmitiendo las 179 operaciones GraphQL originales.

2. **Resolución del Reto B (Audio en Fondo en iOS Safari):**
   - **Decisión:** Elemento `<audio>` HTML5 persistente montado en la raíz del DOM + W3C Media Session API completa.
   - **Justificación:** Previene la suspensión agresiva del hilo de audio cuando el usuario bloquea su iPhone o cambia de aplicación.

3. **Resolución del Reto C (Extensiones):**
   - **Decisión:** Web Worker Sandbox con mensajería IPC estructurada.
   - **Justificación:** Garantiza paridad semántica con el contrato de extensiones (`AudioSource`, `LyricsSource`, `DownloadSource`) sin violar la seguridad del navegador ni requerir un entorno JVM nativo.

4. **Resolución del Reto D (UI Classic & Immersive):**
   - **Decisión:** Implementación dual con Tailwind CSS para el modo Classic y WebGL/Canvas Shader para el gradiente dinámico de malla (*dynamic mesh gradient*) reactivo a los colores de la carátula en modo Immersive.

---

## 3. Próximos Pasos Inmediatos
- Configurar el entorno de build y dependencias en `/workspaces/myspoti-web` (Fastify en backend, React/Vite en frontend).
- Importar y conectar el catálogo de operaciones GraphQL `gql-ops.json` en el BFF.
- Integrar el reproductor y las pantallas de navegación esenciales.
