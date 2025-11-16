# Frontend - ScanTxungoQR PWA

Esta carpeta contiene el código fuente de la Progressive Web App (PWA) construida con React y Vite.

## Stack Tecnológico

- **Framework:** React con Vite
- **Librería de UI:** Material-UI (MUI)
- **Escáner QR:** @yudiel/react-qr-scanner

## Requisitos

- Node.js y npm
- Wrangler CLI (`npm install -g wrangler`)

## Instalación

1.  Navega a este directorio:
    ```bash
    cd scantxungoqr-pwa
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
    Esto instalará React, MUI y todas las demás dependencias necesarias listadas en `package.json`.

## Ejecución en Desarrollo

Para iniciar el servidor de desarrollo local, ejecuta:

```bash
npm run dev
```

Esto iniciará la aplicación, generalmente en `http://localhost:5173`.

## Despliegue en Cloudflare Pages

Para desplegar la aplicación, sigue estos pasos:

1.  **Compila el proyecto:**
    ```bash
    npm run build
    ```
    Esto creará un directorio `dist` con los archivos estáticos de la aplicación.

2.  **Despliega con Wrangler:**
    Asegúrate de tener tus variables de entorno `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` configuradas.
    ```bash
    wrangler pages deploy dist --project-name=scantxungoqr-pwa
    ```

Esto subirá tu aplicación a Cloudflare Pages y te proporcionará una URL pública.
