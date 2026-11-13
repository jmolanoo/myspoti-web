# INFORME DE IMPLEMENTACIÓN Y DESPLIEGUE (IMPLEMENTATION REPORT)
## Myspoti Web / iOS PWA - Port de Orpheon Android
**Autor:** Antigravity AI Assistant & Engineering Team
**Repositorio Oficial:** `jmolanoo/myspoti-web`
**Codespace de Desarrollo:** `myspoti-web-jr47v4r969g4fp7jq`
**Licencia:** GNU General Public License v3.0 (GPL-3.0)

---

## 1. Alcance de lo Implementado

Se completó la migración integral de la arquitectura y componentes de Orpheon Android hacia una aplicación web moderna instalable como PWA con arquitectura BFF (Backend-For-Frontend).

### 1.1. Backend Proxy / BFF (`src/server/`)
1. **Servidor Fastify:**
   - Alta eficiencia y bajo consumo de memoria RAM (<50MB).
   - Soporte CORS, Rate Limiting y servidor de archivos estáticos PWA.
2. **Servicio BFF de Spotify (`SpotifyBffService.js`):**
   - Incorpora las **179 operaciones GraphQL originales** de Orpheon (`gql-ops.json`) con sus hashes SHA256 verificados y esquemas de variables (`gql-variables.json`).
   - Mapeo transparente hacia los servicios `spclient.wg.spotify.com`:
     - Letras sincronizadas (`color-lyrics/v2`).
     - Videos en bucle Canvas (`canvas`).
     - Metadatos de catálogo y álbumes (`getAlbum`, `getTrack`, `queryArtistOverview`).
     - Sugerencias y búsquedas (`searchTopResultsList`, `searchTracks`, `searchSuggestions`).
3. **Persistencia SQLite WAL (`db.js`):**
   - Motor SQLite de alto rendimiento con Write-Ahead Logging para almacenamiento local de playlists, canciones que te gustan, historial y configuración.

### 1.2. Frontend PWA (`src/client/`)
1. **Trimodalidad Estética y Fidelidad Jetpack Compose:**
   - **Modo Classic:** Interfaz sobria en gris oscuro (#121212) con jerarquía idéntica al reproductor oficial.
   - **Modo Immersive:** Gradiente dinámico de malla (*dynamic mesh gradient*) animado y reactivo a la paleta de colores de la carátula activa (`ImmersiveMeshBackground.jsx`), reproduciendo el comportamiento de `ImmersiveTheme.kt`.
   - **Modo AMOLED:** Fondos 100% negros (#000000) para pantallas OLED.
2. **Reproductor y Controles de Medios (`PlayerBar.jsx`):**
   - Mini-player anclado y vista de reproductor expandido a pantalla completa.
   - Controles de reproducción: Play/Pause, Next/Prev, Seek con scrubber, Shuffle, Repeat (Off/All/One), Volumen y Like reactivo.
   - Sleep Timer (temporizador de apagado de 5 a 60 minutos con desvanecimiento).
3. **Letras Sincronizadas (`LyricsModal.jsx`):**
   - Karaoke interactivo sincronizado línea por línea con autodesplazamiento al compás del audio.
4. **Ecualizador Gráfico de 5 Bandas (`EqualizerModal.jsx`):**
   - Grafo Web Audio API con nodos BiquadFilter (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz) y presets de fábrica (Bass Boost, Acústica, Electrónica, Vocal, Plano).
5. **Vistas de Pantalla Completas:**
   - `HomeScreen`: Recomendaciones, carruseles y escuchados recientemente.
   - `SearchScreen`: Búsqueda instantánea con autocompletado y categorías de navegación.
   - `LibraryScreen`: Colección de canciones favoritas, playlists creadas y gestión de listas.
   - `ExtensionsScreen`: Catálogo de extensiones modulares en sandbox.
   - `SettingsScreen`: Configuración de temas, calidad y privacidad.

---

## 2. Guía de Ejecución y Despliegue

### Requisitos Previos
- Node.js versión 20.x, 22.x o 24.x.
- npm versión 10.x o superior.

### Instalación de Dependencias
```bash
npm install
```

### Ejecutar Pruebas Automatizadas
```bash
npm test
```

### Compilar para Producción
```bash
npm run build
```

### Iniciar el Servidor de Producción (BFF + PWA)
```bash
npm start
```
El servidor arrancará en `http://0.0.0.0:3000`.

---

## 3. Instrucciones de Instalación como PWA en Dispositivos

### En iOS (iPhone / iPad - Safari)
1. Abre Safari y navega a la URL donde esté alojada la aplicación (ej. `https://myspoti.tudominio.com`).
2. Toca el botón de **Compartir** (icono cuadrado con flecha hacia arriba en la barra inferior).
3. Desplázate hacia abajo y selecciona **"Agregar a pantalla de inicio"** (o *"Add to Home Screen"*).
4. Confirma el nombre "Myspoti" y toca **"Agregar"**.
5. Abre la aplicación desde el icono en la pantalla de inicio para disfrutar de la experiencia en pantalla completa sin barra de navegación del navegador y con soporte de audio en segundo plano.

### En Android (Chrome)
1. Abre Chrome y accede a la URL de Myspoti.
2. Toca el menú de tres puntos en la esquina superior derecha.
3. Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
4. Sigue la confirmación emergente.

### En Windows / macOS / Linux (Chrome o Edge)
1. Haz clic en el icono de instalación que aparece en la parte derecha de la barra de direcciones del navegador (*"Instalar Myspoti"*).
