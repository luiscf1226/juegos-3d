# Pruebas que juegan solas

`tools/arnes.mjs` abre el HTML compilado en Chromium sin ventana, por el protocolo de DevTools y sin Playwright ni
Puppeteer, y lo maneja como un jugador.

```js
import { run } from './arnes.mjs';
const ok = await run('mi-mecanica', 'dist/juego.html', { hash: '#prueba' }, async (t) => {
  await t.click('btn-jugar');                                   // clic por data-testid (o toque si touch: true)
  await t.waitFor(`!!document.querySelector('[data-testid=hud]')`);
  await t.holdUntil('w', 'window.__juego.jugador.cuerpo.pos[2] < 5');   // mantener W hasta avanzar
  await t.press(' ');                                           // saltar
  await t.ev('window.__juego.jugador.teletransportar(4, 0.6, 2)');
  await t.waitFor('window.__juego.store.getState().monedas === 1');
  await t.shot('capturas/mi-mecanica.png');                     // y después ABRIRLA
});
process.exit(ok ? 0 : 1);
```

`run` imprime `PASA` o `FALLA`. Si falla, guarda una captura del momento. La prueba también falla si hubo
excepciones, `console.error` o **peticiones de red** que no sean Google Fonts.

## Reglas

- **Contrato de `data-testid`:** los botones y los paneles llevan su `data-testid`, y no se renombran sin cambiar las
  pruebas.
- **Puerta de depuración:** `window.__juego = { store, jugador, mundo, input, gl }`. Las pruebas leen el estado y se
  teletransportan por ahí.
- **Juega de verdad:** camina y salta con teclas al menos una vez. Para tomar cosas o llegar lejos, teletranspórtate,
  y llega hasta la pantalla final, tanto ganando como perdiendo.
- **Espera por lo que pasa, no por tiempo:** `waitFor` y `holdUntil`, nunca «mantén W 900 ms». Sin GPU el juego va
  a 5–20 cuadros por segundo y lo que tarda 1 s con GPU tarda 10.
- **Ojo con efectos de lado:** si te teletransportas para revisar otra cosa, puedes tomar una moneda sin querer.
  Comprueba que el contador esté donde esperas.
- **Celular:** `{ width: 390, height: 844, touch: true }` emula pantalla táctil; revisa que aparezcan los controles.
- **Rendimiento:** `t.calls()` da llamadas de dibujo y triángulos; `t.fps()` da los cuadros por segundo.
- **Video:** `await t.grabar()` … `await t.parar('x.mp4')` (necesita `ffmpeg`).
- **Si una prueba falla**, mira primero si ya fallaba antes de tu cambio.

## Sin GPU (CI)

```bash
JUEGO_GPU=0 JUEGO_LENTO=6 node tools/prueba.mjs dist/juego.html
```

`JUEGO_GPU=0` dibuja con SwiftShader, y `JUEGO_LENTO=N` multiplica por N el tiempo máximo de cada espera.
`CHROME_BIN` elige el navegador.

Revisión automática en GitHub Actions (`.github/workflows/revision.yml`). Es la misma receta que corre en Mundo
Catrucho; con esta plantilla tal cual todavía no se ha corrido en GitHub:

```yaml
name: Revisión
on: [push, pull_request]
jobs:
  revision:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: sudo apt-get update && sudo apt-get install -y ffmpeg
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm build
      - run: node tools/prueba.mjs dist/juego.html capturas/prueba
        env: { JUEGO_GPU: '0', JUEGO_LENTO: '6', CHROME_BIN: google-chrome }
      - run: node tools/capturas.mjs dist/juego.html capturas
        env: { JUEGO_GPU: '0', JUEGO_LENTO: '6', CHROME_BIN: google-chrome }
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: capturas, path: capturas }
```

El runner de GitHub no trae `ffmpeg`, así que hay que instalarlo para el video. Y no tiene GPU, por eso van las dos
variables.
