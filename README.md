# Fósforo

Prototipos web de **Narthex** (título de trabajo): un juego narrativo para móvil en el que encuentras un teléfono roto y lo usas para colarte en el mundo de las megacorporaciones.

Esto es el prototipo web. El juego de verdad se hace en Unity, en el repo privado `mengerspong3/narthex`. En local van juntos: `Narthex/prototipo/` (este repo) y `Narthex/juego/` (Unity).

## Probar en el móvil

Escanea el código con la cámara del teléfono (mejor con Chrome en Android):

![QR de la intro](qr-intro.png)

https://mengerspong3.github.io/fosforo/

| Página | Qué es |
| --- | --- |
| [Intro](https://mengerspong3.github.io/fosforo/) | La intro jugable: pantalla rota, nickname, huella del pie, code_cam, silueta y libreta |
| [Laboratorio](https://mengerspong3.github.io/fosforo/lab.html) | Banco de pruebas de efectos: niveles de reparación, sonidos y versiones de NarthexOS |
| [Puzzles](https://mengerspong3.github.io/fosforo/puzzles.html) | Banco de pruebas de los puzzles de la mini misión, con saltos y diagnóstico en vivo |
| [code_cam](https://mengerspong3.github.io/fosforo/codecam.html) | El filtro ASCII de la cámara, suelto |

Atajos de la intro para probar una escena concreta: `#home`, `#nick`, `#toe`, `#perm`, `#cam`, `#notes`, `#mision` (escritorio con el Correo listo), `#hades` (con 40 óbolos).

El motor del móvil (versiones de NarthexOS, daños, sonido) está en `narthex.js` y `narthex.css`, compartido por la intro y el laboratorio.

## En local

```bash
python3 -m http.server 8090
```

y abre `http://localhost:8090`. Para probar la cámara desde el móvil en la misma wifi hace falta HTTPS: `./servir.sh` (certificado autofirmado).
