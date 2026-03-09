#!/bin/bash
echo "🛡️ Ejecutando auditorías de seguridad locales..."
cd scantxungoqr-api && npm audit --audit-level=high && cd ..
cd scantxungoqr-pwa && npm audit --audit-level=high && cd ..
echo "✅ Todo en orden."
