# Myspoti Web / iOS PWA
> Port de alta fidelidad de **Orpheon Android** a una Progressive Web App (PWA) universal con arquitectura Backend-For-Frontend (BFF).

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-cyan.svg)](https://react.dev)
[![PWA Ready](https://img.shields.io/badge/PWA-iOS%20%7C%20Android%20%7C%20Desktop-purple.svg)](https://web.dev/progressive-web-apps/)

---

## 🌟 Características Principales

- **Fidelidad Absoluta al Código Fuente:** Mapeo 1:1 de los contratos Kotlin y componentes Compose de `kota-zo/Orpheon`.
- **BFF Proxy Oficial de Spotify:** Proxy local en Node.js/Fastify con las **179 operaciones GraphQL originales** de Spotify (`gql-ops.json`) y resolución de CORS sin forzar cuentas Premium obligatorias.
- **Trimodalidad Visual Compose:**
  - **Classic:** Estilo sobrio oscuro (#121212) oficial de Spotify.
  - **Immersive:** Gradientes de malla dinámicos (*dynamic mesh gradient*) reactivos a los colores de la carátula activa.
  - **AMOLED:** Fondo negro absoluto (#000000) para pantallas OLED.
- **Audio Persistente y Soporte iOS en Background:**
  - Integración completa con W3C Media Session API para controles en pantalla de bloqueo, Centro de Control y Dynamic Island.
- **Letras Sincronizadas:** Visualizador tipo karaoke milimétricamente sincronizado línea por línea mediante `color-lyrics/v2`.
- **Ecualizador Gráfico de 5 Bandas:** Procesamiento Web Audio API en tiempo real con presets (Bass Boost, Vocal, Acústico, Electrónica, Plano).
- **Biblioteca y Persistencia Local:** Base de datos SQLite en modo WAL para playlists, historial y canciones favoritas.
- **PWA Instalable:** Service Worker offline, Web App Manifest y adaptación ergonómica para safe areas de iOS (notch / dynamic island).

---

## 📁 Documentación de Ingeniería

Todos los entregables de auditoría, viabilidad y arquitectura se encuentran en la carpeta [`docs/`](docs/):
- [`docs/PORT_PARITY_MATRIX.md`](docs/PORT_PARITY_MATRIX.md): Matriz de paridad exhaustiva con 79 funcionalidades inventariadas.
- [`docs/TECHNICAL_FEASIBILITY.md`](docs/TECHNICAL_FEASIBILITY.md): Estudio de viabilidad técnica y resolución de los 4 grandes retos (A, B, C, D).
- [`docs/WEB_ARCHITECTURE.md`](docs/WEB_ARCHITECTURE.md): Diseño de las 10 capas modulares desacopladas.
- [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md): Declaración transparente de restricciones de la plataforma navegador.
- [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md): Informe de pruebas unitarias y de integración (100% aprobadas).
- [`docs/IMPLEMENTATION_REPORT.md`](docs/IMPLEMENTATION_REPORT.md): Informe final de implementación y despliegue.
- [`docs/PORT_PROGRESS.md`](docs/PORT_PROGRESS.md): Registro de continuidad y decisiones técnicas.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar la suite de pruebas
```bash
npm test
```

### 3. Compilar el cliente PWA
```bash
npm run build
```

### 4. Iniciar el servidor
```bash
npm start
```

Visita `http://localhost:3000` en tu navegador.

---

## 📜 Licencia
Este proyecto es una obra derivada de [Orpheon](https://github.com/kota-zo/Orpheon) y se distribuye bajo los términos de la **GNU General Public License v3.0 (GPL-3.0)**.
