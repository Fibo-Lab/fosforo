# Fósforo

Prototipos web de **Narthex** (título de trabajo): un juego narrativo para móvil en el que encuentras un teléfono roto y lo usas para colarte en el mundo de las megacorporaciones.

## Probar en el móvil

Escanea el código con la cámara del teléfono (mejor con Chrome en Android):

![QR de la intro](qr-intro.png)

https://mengerspong3.github.io/fosforo/

| Página | Qué es |
| --- | --- |
| [Intro](https://mengerspong3.github.io/fosforo/) | La intro jugable: pantalla rota, nickname, huella del pie, code_cam, silueta y libreta |
| [Laboratorio](https://mengerspong3.github.io/fosforo/lab.html) | Banco de pruebas de efectos: niveles de reparación, sonidos y versiones de NarthexOS |
| [code_cam](https://mengerspong3.github.io/fosforo/codecam.html) | El filtro ASCII de la cámara, suelto |

Atajos de la intro para probar una escena concreta: `#home`, `#nick`, `#toe`, `#perm`, `#cam`, `#notes`.

## En local

```bash
python3 -m http.server 8090
```

y abre `http://localhost:8090`. Para probar la cámara desde el móvil en la misma wifi hace falta HTTPS: `./servir.sh` (certificado autofirmado).
