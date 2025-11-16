# ScanTxungoQR - PWA Version

Este proyecto es una migración de la aplicación de escritorio original [ScanTxungoQR](https://github.com/MaciasIT/ScanTxungoQR) a una moderna Progressive Web App (PWA).

La aplicación permite a los usuarios escanear códigos QR con su dispositivo y verifica instantáneamente si la URL contenida es maliciosa utilizando la API de VirusTotal.

**URL de la aplicación en producción:** [https://scantxungoqr-pwa.pages.dev/](https://scantxungoqr-pwa.pages.dev/)

## Arquitectura del Proyecto

Este repositorio contiene un monorepo con dos componentes principales:

1.  `./scantxungoqr-pwa/`: El frontend de la aplicación. Es una PWA construida con React y Vite.
2.  `./scantxungoqr-api/`: El backend seguro. Es una función serverless (Cloudflare Worker) que actúa como un proxy seguro para la API de VirusTotal, protegiendo la API Key.

Cada carpeta contiene su propio `README.md` con instrucciones detalladas para la instalación y el despliegue.

## Cómo Empezar

Para desplegar este proyecto, necesitarás:

- Una cuenta de Cloudflare.
- Tu Account ID de Cloudflare.
- Un API Token de Cloudflare con permisos para `Pages` y `Workers Scripts`.
- Una API Key de VirusTotal.

Sigue las instrucciones en los README de cada subdirectorio para desplegar el backend y luego el frontend.

## Mejoras Futuras (Roadmap)

- [ ] **Informe Detallado de Amenazas:** Mostrar qué motores de seguridad específicos marcaron una URL como maliciosa.
- [ ] **Historial de Escaneos:** Guardar un historial local de las últimas URLs analizadas.
- [ ] **Entrada Manual de URL:** Permitir al usuario pegar una URL para analizarla sin usar un QR.
- [ ] **Mejoras de UX:** Añadir botones para copiar la URL y compartir el resultado del análisis.
- [ ] **Capacidades PWA Mejoradas:** Implementar un Service Worker para un mejor rendimiento offline.
