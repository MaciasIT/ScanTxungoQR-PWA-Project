# ScanTxungoQR - PWA Anti-Phishing 🛡️

**ScanTxungoQR** es una Progressive Web App (PWA) diseñada para protegerte del *Quishing* (Phishing a través de códigos QR). Analiza cualquier URL escaneada utilizando la potencia de **VirusTotal** para detectar amenazas antes de que accedas a sitios peligrosos.

🌐 **Demo en Vivo**: [https://main.scantxungoqr-pwa.pages.dev](https://main.scantxungoqr-pwa.pages.dev)  
⚡ **API Endpoint**: `https://scantxungoqr-api.michelmacias-it.workers.dev`

---

## 🚀 Características

### Frontend (PWA)
*   **Escáner QR Integrado**: Detección rápida y fiable con interfaz de "láser".
*   **Análisis de Imagen**: Sube capturas de pantalla de QRs desde tu galería.
*   **Entrada Manual**: Escribe o pega URLs sospechosas directamente.
*   **Historial Local**: Guarda tus últimos 20 escaneos en el dispositivo (sin tracking en servidor).
*   **Cyber UI**: Diseño moderno "Glassmorphism" con modo oscuro, animaciones fluidas y feedback háptico.
*   **Compartir**: Comparte los informes de seguridad con otras apps.

### Backend (Cloudflare Workers)
*   **Integración VirusTotal API v3**: Consulta +70 motores de antivirus.
*   **Cloudflare KV Caching**:
    *   Almacena resultados por 24 horas para respuestas instantáneas (`X-Cache: HIT`).
    *   Reduce el consumo de cuota de la API.
*   **Rate Limiting**:
    *   Protección contra abusos basada en IP (Límite: 10 peticiones/minuto).
*   **Seguridad**: Normalización de URLs y headers de seguridad.

---

## 🛠️ Stack Tecnológico

**Frontend**:
*   React 18 + Vite
*   Material UI (MUI) v6 - Con personalización de tema avanzada.
*   `framer-motion` - Para animaciones y transiciones.
*   `@yudiel/react-qr-scanner` & `jsqr` - Motores de escaneo.

**Backend**:
*   Cloudflare Workers (Serverless JavaScript).
*   Cloudflare KV (Key-Value Storage).
*   VirusTotal API.

---

## 💻 Instalación y Desarrollo

### Prerrequisitos
*   Node.js & npm
*   Una cuenta de Cloudflare (para desplegar Workers/Pages).
*   API Key de VirusTotal.

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/ScanTxungoQR-PWA.git
cd ScanTxungoQR-PWA
```

### 2. Frontend (PWA)
```bash
cd scantxungoqr-pwa
npm install
npm run dev
```

### 3. Backend (Worker)
Configura tu API Key en `.dev.vars`:
```toml
VIRUSTOTAL_API_KEY="tu_api_key_aqui"
```

Inicia el desarrollo local con soporte para KV simulado:
```bash
cd scantxungoqr-api
npm install
npx wrangler dev
```

---

## 📦 Despliegue

### Backend
```bash
cd scantxungoqr-api
npx wrangler deploy
```
*Asegúrate de configurar el secreto en producción:*
```bash
npx wrangler secret put VIRUSTOTAL_API_KEY
```

### Frontend
```bash
cd scantxungoqr-pwa
npm run build
npx wrangler pages deploy dist --project-name scantxungoqr-pwa
```

---

## 🔒 Privacidad y Seguridad
*   **Datos de Usuario**: No almacenamos logs de IP ni historial de navegación en nuestros servidores. El historial de escaneos reside únicamente en el `localStorage` de tu navegador.
*   **Análisis**: Las URLs se envían a VirusTotal para su análisis. Consulta la [Política de Privacidad de VirusTotal](https://support.virustotal.com/hc/en-us/articles/115002168385-Privacy-Policy) para más detalles.

---

Desarrollado con ❤️ por **Macias IT**.
