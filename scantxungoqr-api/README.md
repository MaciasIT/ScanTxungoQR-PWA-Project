# Backend - ScanTxungoQR API

Esta carpeta contiene el código fuente del backend, que es una función serverless (Cloudflare Worker). Su propósito es actuar como un proxy seguro entre la PWA y la API de VirusTotal.

## Requisitos

- Wrangler CLI (`npm install -g wrangler`)

## Despliegue en Cloudflare Workers

El despliegue se realiza en dos pasos:

1.  **Desplegar el Worker:**
    Navega a este directorio y ejecuta el comando de despliegue. Asegúrate de tener tus variables de entorno `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` configuradas.
    ```bash
    cd scantxungoqr-api
    wrangler deploy
    ```
    Esto subirá el worker y te dará una URL (ej: `https://scantxungoqr-api.your-account.workers.dev`).

2.  **Vincular el Secreto de VirusTotal:**
    El worker necesita tu clave de la API de VirusTotal para funcionar. Víncula el secreto de forma segura con el siguiente comando. Wrangler te pedirá que introduzcas el valor de tu clave.
    ```bash
    wrangler secret put VIRUSTOTAL_API_KEY
    ```

Una vez completados estos pasos, el backend estará online y listo para recibir peticiones desde el frontend.
