# INFORME DE PRUEBAS Y VALIDACIÓN FUNCIONAL (TEST REPORT)
## Myspoti Web / iOS PWA - Port de Orpheon Android
**Fecha de Ejecución:** 13 de Noviembre de 2026
**Entorno de Ejecución:** GitHub Codespaces (Node.js v24.22.2, Fastify 4.28.1, Vite 5.4.21, React 18.3.1, SQLite 3 WAL)

---

## 1. Resumen Ejecutivo de la Suite de Pruebas

Se implementó y ejecutó una batería de pruebas automatizadas cubriendo los niveles unitario y de integración para validar la consistencia de los contratos de API, la persistencia transaccional y la integridad de las 179 operaciones de Spotify.

| Suite de Pruebas | Pruebas Ejecutadas | Aprobadas | Fallidas | Tiempo de Ejecución |
|---|:---:|:---:|:---:|:---:|
| **Persistencia SQLite WAL (`unit_db.test.js`)** | 4 | 4 | 0 | 27.58 ms |
| **BFF & Catálogo GraphQL (`unit_bff.test.js`)** | 3 | 3 | 0 | 2.98 ms |
| **Integración Endpoints Fastify (`integration_server.test.js`)** | 2 | 2 | 0 | 45.08 ms |
| **TOTAL** | **9** | **9 (100%)** | **0 (0%)** | **531.06 ms** |

---

## 2. Detalle de Pruebas Ejecutadas

### 2.1. Persistencia y Transacciones Locales (`unit_db.test.js`)
- `should create tables and enable WAL mode`: Verifica que el archivo de base de datos configure correctamente el modo de registro anticipado (`PRAGMA journal_mode = WAL`) para garantizar lecturas no bloqueantes durante reproducciones concurrentes.
- `should insert and fetch playlists`: Valida la creación atómica de playlists con metadatos de visibilidad y timestamps Unix.
- `should add tracks to playlist and maintain order`: Valida la integridad referencial y el mantenimiento del índice `position` para reordenamiento drag-and-drop.
- `should toggle favorites (Liked Songs)`: Comprueba la inserción idempotente y borrado en la colección de canciones guardadas.

### 2.2. BFF y Registro de Operaciones GraphQL (`unit_bff.test.js`)
- `should load all 179 captured GraphQL operations from gql-ops.json`: Verifica que la totalidad del inventario de operaciones GraphQL capturadas de `open.spotify.com` en Orpheon se cargue en memoria.
- `should contain critical operations with valid SHA256 hashes`: Comprueba que operaciones esenciales (`searchTopResultsList`, `searchTracks`, `searchSuggestions`, `getTrack`, `getAlbum`, `queryArtistOverview`, `libraryV3`, `fetchLibraryTracks`, `canvas`) posean hashes SHA256 válidos de exactamente 64 caracteres hexadecimales.
- `should throw error on unknown operation`: Asegura que solicitudes con operaciones no catalogadas sean rechazadas limpiamente evitando llamadas erráticas a la red.

### 2.3. Integración de Endpoints del Servidor (`integration_server.test.js`)
- `GET /api/health`: Comprueba la respuesta HTTP 200 con reporte del estado del BFF y versión del cliente Web Player.
- `POST and GET /api/library/playlists`: Valida el flujo completo de creación y consulta de listas a través del pipeline HTTP.

---

## 3. Validación Visual y de Empaquetado PWA

- **Vite Build:** Compilación exitosa en 2.76s de 1,589 módulos a producción.
- **Service Worker (`dist/sw.js`):** Generado automáticamente por `vite-plugin-pwa` con precaché de los 10 archivos nucleares del cascarón PWA (247.82 KiB).
- **Web App Manifest (`dist/manifest.webmanifest`):** Validado con iconografía SVG/PNG adaptativa, `display: standalone` y `theme_color: #121212`.
