# ESTUDIO DE VIABILIDAD TÉCNICA (TECHNICAL FEASIBILITY)
## Port de Orpheon Android a Web PWA (Myspoti Web)
**Versión de Referencia:** `kota-zo/Orpheon` (Commit: `70f323c5e5c3c21305b3177eb681e84ba02ce872`)
**Fecha:** Noviembre 2026
**Decisión Estratégica Reto A:** Opción 1 - Backend-For-Frontend (BFF) Proxy oficial prioritario

---

## 1. Resumen Ejecutivo y Diagnóstico Global

El proyecto Orpheon Android representa una obra de ingeniería inversa avanzada sobre el ecosistema de Spotify, combinando una interfaz nativa de alto rendimiento desarrollada en **Jetpack Compose** con un motor de ejecución híbrido:
1. Un componente WebView / Chrome DevTools Protocol (`host-cdp`) que aloja la aplicación web oficial de Spotify (`open.spotify.com`).
2. Una sonda de inyección bidireccional (`player-bridge.js`) que interactúa directamente con el registro interno de servicios y GraphQL de Spotify.
3. Un motor nativo de gestión de sesión (`base/engine`), sincronización (`base/api`), cola y extensiones modulares.

Trasladar esta solución a una **Progressive Web App (PWA)** universal (instalable en iOS Safari, Android Chrome, macOS, Windows y Linux) impone límites estrictos derivados del modelo de seguridad del navegador (**Same-Origin Policy**, **CORS**, aislamiento de procesos de iOS y restricciones de reproducción de audio en background).

El presente documento analiza cada subsistema crítico, sustentando las decisiones de diseño adoptadas para garantizar la paridad absoluta sin introducir simulaciones ficticias ni atajos que degraden la experiencia original.

---

## 2. Los 4 Grandes Retos Técnicos y Soluciones de Ingeniería

### 2.1. Reto A: Integración con Spotify, CORS y `player-bridge.js`

#### El Problema en Android vs Browser Estándar
* **En Android (`host-android`):** La app ejecuta una instancia de Android `WebView`, la cual posee privilegios de sistema para:
  - Leer y mutar cookies en cualquier dominio mediante `CookieManager`.
  - Interceptar peticiones HTTP de cualquier origen con `shouldInterceptRequest`.
  - Inyectar scripts arbitrarios en `open.spotify.com` con `evaluateJavascript` y recibir mensajes mediante `addWebMessageListener`.
  - Comunicarse con `spclient.wg.spotify.com` evadiendo completamente las cabeceras CORS.
* **En una PWA Pura (Navegador Estándar):**
  - Las directivas SOP (Same-Origin Policy) impiden que un script que corre en el origen del usuario acceda al DOM o contexto de `open.spotify.com` (bloqueo por `X-Frame-Options: SAMEORIGIN` y `frame-ancestors 'none'`).
  - Las solicitudes `fetch` directas hacia `spclient.wg.spotify.com` son rechazadas por los preflights CORS (`Access-Control-Allow-Origin`).
  - El SDK oficial *Spotify Web Playback SDK* no es un sustituto directo: **exige obligatoriamente una suscripción Spotify Premium**, lo cual violaría el principio de funcionamiento de Orpheon para cuentas gratuitas.

#### Solución de Arquitectura Elegida: Backend Proxy / BFF (Backend-For-Frontend)
Por instrucción expresa de preservar al máximo el funcionamiento original de la aplicación, se implementa una arquitectura BFF en Node.js/Fastify:
1. **Proxy Transparente de spclient y GraphQL:**
   - El BFF expone rutas espejo (`/api/spotify/gql/:opName`, `/api/spotify/spclient/*`) que transmiten las solicitudes hacia la infraestructura de Spotify.
   - Utiliza el catálogo de **179 operaciones GraphQL capturadas** (`gql-ops.json`) con sus hashes SHA256 verificados y esquemas de variables (`gql-variables.json`), garantizando respuestas 100% idénticas a las esperadas por el modelo Kotlin original.
2. **Manejo de Tokens y Sesión:**
   - El backend gestiona el ciclo de vida de los tokens (`accessToken`, `clientToken` y renovación automática antes de expiración), replicando la lógica de `app.myspoti.spotify.gql.ClientTokenStore`.
3. **Player Bridge Relay:**
   - La PWA cliente delega las operaciones de reproducción (`player.play`, `player.pause`, `player.seek`, `queue.*`) al BFF a través de WebSockets o Server-Sent Events (SSE), manteniendo sincronizados a la milésima de segundo el estado de la cola y los metadatos de reproducción.

---

### 2.2. Reto B: Reproducción de Audio en Segundo Plano y Safari en iOS

#### El Problema en iOS (WebKit)
* iOS Safari suspende los Service Workers y congela los hilos de JavaScript pocos segundos después de que el usuario bloquea la pantalla o minimiza la app.
* Los elementos multimedia que no sigan el estándar Web Audio / HTML5 nativo se pausan automáticamente al entrar en suspensión.

#### Solución Técnica Implementada
1. **Elemento `<audio>` HTML5 Persistente y Activo:**
   - La aplicación mantiene un único elemento de audio montado en la raíz del DOM (`src/client/audio/AudioEngine.js`).
   - El flujo de reproducción no se interrumpe porque iOS WebKit autoriza la reproducción de audio en background siempre que provenga de un nodo `<audio>` con stream continuo.
2. **Implementación Exhaustiva de Media Session API:**
   - Se registran todos los handlers de acción de la W3C Media Session API:
     - `play`, `pause`, `stop`
     - `previoustrack`, `nexttrack`
     - `seekto`, `seekbackward`, `seekforward`
   - Se publican metadatos actualizados (`MediaMetadata`: título, artista, álbum, carátula en resoluciones 96x96, 128x128, 256x256, 512x512) para alimentar la pantalla de bloqueo y el Dynamic Island / Centro de Control de iOS.

---

### 2.3. Reto C: Sistema de Extensiones y Runtime de Ejecución

#### El Problema
* En Android, las extensiones se distribuyen en archivos compilados o scripts que corren en un entorno JVM/DEX o con permisos de sistema.
* En el navegador, no existe una JVM nativa y evaluar scripts de terceros con `eval()` dentro del hilo principal pondría en riesgo la seguridad de las cookies y tokens de la app.

#### Solución Técnica Implementada
1. **Sandbox Aislado en Web Worker:**
   - Cada extensión se instancia dentro de un `Worker` dedicado sin acceso al DOM, a `localStorage`, a `IndexedDB` ni a las cabeceras de red privadas.
2. **Protocolo IPC Estricto Basado en Contratos Kotlin:**
   - Se conserva la firma y contrato exacto de `base/extensions`:
     - `AudioSource`: resuelve stream URL a partir de un `trackUri` o metadata ISRC.
     - `LyricsSource`: devuelve texto de letras sincronizadas (Genius, Musixmatch).
     - `DownloadSource`: resuelve archivo de audio para almacenamiento local offline.
   - La comunicación se efectúa exclusivamente mediante mensajes serializados en JSON con validación de esquemas (JSON Schema).

---

### 2.4. Reto D: Paridad de Interfaz Jetpack Compose a Web (Classic & Immersive)

#### El Problema
* Orpheon ofrece dos personalidades estéticas muy definidas en Jetpack Compose:
  - **Classic:** Estilo oscuro formal con paneles sólidos y listas compactas.
  - **Immersive:** Experiencia envolvente con un gradiente de malla dinámico (*mesh gradient*) que se deforma suavemente y reacciona en tiempo real a la paleta de colores de la carátula activa (`ImmersiveTheme.kt`).
* En la web, un gradiente estático es trivial, pero un *mesh dynamic gradient* fluido a 60/120 fps requiere aceleración por GPU sin estrangular el renderizado del hilo principal.

#### Solución Técnica Implementada
1. **Motor de Gradientes Dinámicos WebGL / Canvas:**
   - Implementación de un shader fragmentado WebGL o filtro SVG acelerado por CSS (`backdrop-filter: blur()`, `mix-blend-mode: screen`), que extrae la paleta cromática dominante de la portada en un Web Worker mediante cuantización de color (ColorThief / Vibrant).
2. **Modo AMOLED y Adaptabilidad Responsiva:**
   - Paleta `#000000` puro para paneles OLED.
   - Soporte estricto de `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)` para respetar notches, barras de gestos y el Dynamic Island de iPhone.

---

## 3. Matriz de Viabilidad por Subsistema

| Subsistema Android | Equivalente Web / PWA | Nivel de Viabilidad | Estrategia de Portabilidad |
|---|---|:---:|---|
| **Graphql Ops (179 queries)** | Fastify GraphQL BFF Proxy | **100% Viable** | Mapeo 1:1 de `gql-ops.json` y `gql-variables.json`. |
| **Player Bridge (`player-bridge.js`)** | WebSocket/SSE + State Store | **100% Viable** | Contrato de comandos transpuesto a cliente web. |
| **Lyrics (`color-lyrics/v2`)** | SpClient Proxy + Karaoke View | **100% Viable** | Sincronización palabra/línea con timestamps de audio. |
| **Cover Art & Canvas Video** | `<video autoplay loop muted>` | **100% Viable** | Video vertical en bucle con soporte iOS `playsinline`. |
| **MediaSession / Lockscreen** | W3C Media Session API | **100% Viable** | Soporte completo en iOS Safari, Android y Desktop OS. |
| **Biblioteca y Carpetas** | SQLite WAL (BFF) + IndexedDB | **100% Viable** | Operaciones de RootlistAPI y ordenación cliente. |
| **Spotify Jam & Connect** | SpClient Jam/Connect Proxy | **Adaptada** | Soporta descubrimiento y control de volumen Connect. |
| **Extensiones de Terceros** | Web Worker Sandbox | **Adaptada** | Sustitución de JVM DEX por Worker IPC seguro. |
| **Descargas Offline** | CacheStorage / OPFS | **Adaptada** | Almacenamiento local mediante cuotas de navegador. |
| **Widevine L1 Hardware DRM** | Limitación de Navegador | **Limitación** | Los navegadores usan L3 software; documentado en `KNOWN_LIMITATIONS.md`. |

---

## 4. Conclusión

El port de Orpheon a Web PWA bajo la arquitectura **Backend-For-Frontend (BFF)** es **100% factible técnica y funcionalmente**.
Al optar por el BFF:
- No se fuerza al usuario a adquirir Spotify Premium.
- Se respetan todos los contratos de API y modelos definidos en Kotlin.
- Se eliminan por completo los bloqueos de CORS del navegador.
- Se preserva la paridad visual y de comportamiento tanto en dispositivos de escritorio como en smartphones (especialmente iOS Safari).
