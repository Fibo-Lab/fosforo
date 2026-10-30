#!/usr/bin/env bash
# Sirve el prototipo por HTTPS en la red local para probarlo en el móvil.
# El certificado es autofirmado: el móvil mostrará un aviso que hay que aceptar.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8443}"
IP="$(hostname -I | awk '{print $1}')"

if [ ! -f cert.pem ]; then
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout key.pem -out cert.pem -subj "/CN=codecam" \
    -addext "subjectAltName=IP:${IP},DNS:localhost" 2>/dev/null
fi

echo "Abre en el móvil (misma wifi): https://${IP}:${PORT}"
python3 - "$PORT" <<'EOF'
import http.server, ssl, sys
port = int(sys.argv[1])
srv = http.server.HTTPServer(("0.0.0.0", port), http.server.SimpleHTTPRequestHandler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain("cert.pem", "key.pem")
srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
srv.serve_forever()
EOF
