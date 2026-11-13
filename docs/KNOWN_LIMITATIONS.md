# LIMITACIONES TÉCNICAS CONOCIDAS (KNOWN LIMITATIONS)
## Port de Orpheon Android a Web PWA (Myspoti Web)
**Fecha:** Noviembre 2026
**Política:** Transparencia técnica absoluta (Regla 4 y 9: No simular compatibilidad ni ocultar limitaciones)

---

## 1. Introducción

El traslado de una aplicación nativa Android (con acceso a privilegios de sistema operativo, NDK, servicios en segundo plano y hardware criptográfico) hacia una **Progressive Web App (PWA)** ejecutada dentro del sandbox de seguridad de los navegadores web modernos conlleva ciertas barreras inherentes a la plataforma web.

En apego estricto a las **10 Reglas Innegociables**, este documento declara de manera exhaustiva las limitaciones que no pueden ser eliminadas sin vulnerar el modelo de seguridad del navegador o recurrir a atajos ilegítimos.

---

## 2. Inventario de Limitaciones por Subsistema

### 2.1. Protección de Contenido y DRM (Widevine L1 vs L3)
* **Comportamiento en Android:** La aplicación original puede acceder a los niveles de seguridad hardware **Widevine L1**, permitiendo la decodificación de flujos de audio/video protegidos en hardware seguro (TEE) con tasas de bits de alta fidelidad.
* **Comportamiento en Navegadores Web:** Los navegadores comerciales (Chrome, Safari, Firefox, Edge) operan bajo **Widevine L3** (software CDM) o FairPlay en Safari.
* **Impacto en Myspoti Web:** La calidad máxima de audio para streams encriptados se limita a la tasa permitida por el Web Player oficial de Spotify (160 kbps para cuentas Free, hasta 256/320 kbps para Premium), sin decodificación por hardware de nivel militar.

### 2.2. Audio en Segundo Plano y Notificaciones en Pantalla de Bloqueo
* **Comportamiento en Android:** Orpheon registra un `ForegroundService` con `MediaSessionService` que el sistema operativo Android nunca suspende, garantizando controles enriquecidos, barra de búsqueda en la notificación y reproducción perpetua.
* **Comportamiento en iOS Safari y PWA:**
  - Safari suspende agresivamente los procesos JavaScript en background tras unos instantes de bloqueo.
  - Aunque se solventa manteniendo el stream `<audio>` activo y utilizando la W3C Media Session API, si el sistema operativo iOS experimenta presión extrema de memoria RAM, el hilo de audio del navegador puede ser reciclado por el kernel de iOS.
  - La barra de búsqueda interactiva en la pantalla de bloqueo de iOS depende de que el sistema operativo decida habilitar el slider para el elemento web.

### 2.3. Autoplay y Políticas de Interacción del Usuario
* **Comportamiento en Android:** La app nativa puede iniciar reproducción automáticamente al abrirse o al conectarse un dispositivo Bluetooth.
* **Comportamiento en la Web:** Todos los navegadores modernos aplican una estricta **Autoplay Policy**. El primer inicio de audio requiere obligatoriamente una interacción táctil o un clic del usuario (`User Gesture`). El reproductor no puede comenzar a emitir sonido de forma totalmente autónoma sin este permiso previo.

### 2.4. Almacenamiento Offline y Cuotas de Caché
* **Comportamiento en Android:** La app puede escribir directamente en el sistema de archivos del dispositivo (`getExternalFilesDir`), sin límite arbitrario de almacenamiento más allá del espacio físico disponible en el disco o tarjeta SD.
* **Comportamiento en la Web:** El almacenamiento persistente (a través de `CacheStorage`, `IndexedDB` y Origin Private File System) está sujeto a las **cuotas de almacenamiento del navegador** (generalmente un porcentaje del espacio libre del disco). En Safari de iOS, las PWAs instaladas pueden sufrir desalojo de caché si el usuario no las abre durante un periodo prolongado (política de 7 días de ITP para webs no instaladas, mitigada parcialmente en modo standalone).

### 2.5. Ecosistemas de Hardware Externo (WearOS y Android Auto)
* **Comportamiento en Android:** El repositorio incluye submódulos nativos `base/wear` (aplicación para smartwatches Wear OS) y soporte para plantillas de medios de Android Auto.
* **Comportamiento en la Web:** Las PWAs no tienen acceso a las APIs nativas de Android Auto ni a la instalación en relojes WearOS como aplicaciones autónomas. Estas capacidades quedan marcadas como **Exclusivas de SO Nativo** y no aplicables a un cliente web estándar.

### 2.6. Ejecución de Extensiones Compiladas (DEX / JVM)
* **Comportamiento en Android:** Las extensiones empaquetadas en bytecode DEX son cargadas dinámicamente en la máquina virtual ART de Android.
* **Comportamiento en la Web:** No es posible ejecutar bytecode DEX en un navegador. Las extensiones en Myspoti Web deben ser escritas en JavaScript / TypeScript o compiladas a WebAssembly (WASM), ejecutándose en un sandbox seguro de Web Worker.

---

## 3. Matriz de Paridad y Resumen de Estado

| Capacidad | Android Nativo | Myspoti Web PWA | Estado de Paridad |
|---|---|---|:---:|
| **Control de Reproducción y Colas** | 100% | 100% (Vía BFF + Audio Engine) | **Paridad Total** |
| **Búsqueda y 179 GraphQL Ops** | 100% | 100% (Vía BFF Proxy) | **Paridad Total** |
| **Biblioteca, Carpetas y Playlists** | 100% | 100% (Vía BFF + SQLite) | **Paridad Total** |
| **Letras Sincronizadas y Dinámica** | 100% | 100% (Vía SpClient) | **Paridad Total** |
| **UI Compose Classic & Immersive** | 100% | 100% (Tailwind + WebGL Mesh) | **Paridad Total** |
| **Modo AMOLED y Safe Areas iOS** | 100% | 100% (CSS env(safe-area)) | **Paridad Total** |
| **Audio Background en iOS Safari** | Nativo ilimitado | Mitigado vía HTML5 + MediaSession | **Adaptado** |
| **Extensiones de Terceros** | JVM DEX nativo | Web Worker Sandbox / WASM | **Adaptado** |
| **Descargas Offline Ilimitadas** | Acceso a Disco | Sujeto a Cuota de Navegador | **Limitación SO** |
| **Widevine L1 Hardware** | Hardware TEE | Widevine L3 Software Web | **Limitación SO** |
| **Android Auto / WearOS** | Apps nativas | No disponible en PWA estándar | **No Aplicable** |
