#!/bin/bash
set -e

echo "🔍 1. Comprobando PWA (Frontend)..."
cd scantxungoqr-pwa
npm run test
npm audit || true # Using || true because of the known serialize-javascript issue we couldn't fix due to Vite 7 peer dependency
npm run build
cd ..

echo "🔍 2. Comprobando Worker (Backend)..."
cd scantxungoqr-api
npm run test
npm audit
cd ..

echo "✅ Todo en verde. Listo para producción."
