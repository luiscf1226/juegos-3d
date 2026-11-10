// Prueba de punta a punta: juega solo una partida para ganar y otra para perder, y revisa errores, red y rendimiento.
// Uso: node tools/prueba.mjs dist/juego.html [carpeta-capturas]      Debe imprimir PASA y salir con 0.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './arnes.mjs';

const [archivo, fotos = join(dirname(fileURLToPath(import.meta.url)), '../capturas/prueba')] = process.argv.slice(2);
if (!archivo) {
  console.error('uso: node tools/prueba.mjs <juego.html> [carpeta-capturas]');
  process.exit(2);
}
const nivel = JSON.parse(readFileSync(new URL('../src/datos/nivel.json', import.meta.url), 'utf8'));
const S = 'window.__juego.store.getState()';
const P = 'window.__juego.jugador.cuerpo.pos';
const afirmar = (ok, msj) => {
  if (!ok) throw new Error(msj);
};

const ok = await run('partida', archivo, { hash: '#prueba' }, async (t) => {
  await t.click('btn-jugar');
  await t.waitFor(`!!document.querySelector('[data-testid=hud]')`, 8000, 'el HUD');
  await t.sleep(600);

  // caminar y saltar de verdad, esperando por lo que pasa y no por tiempo fijo (sin GPU va lento)
  const z0 = await t.ev(`${P}[2]`);
  await t.holdUntil('w', `${P}[2] < ${z0 - 1.5}`, 20000);
  await t.press(' ');
  await t.waitFor(`${P}[1] > 0.5`, 8000, 'que salte');
  await t.waitFor(`window.__juego.jugador.cuerpo.enSuelo`, 8000, 'que caiga');

  // pararse encima de una plataforma: la física la tiene que sostener (en la orilla, lejos de su moneda)
  const pl = nivel.plataformas[0];
  const orilla = pl.pos[0] + pl.tam[0] / 2 - 0.3;
  await t.ev(`window.__juego.jugador.teletransportar(${orilla}, ${pl.pos[1] + pl.tam[1] / 2 + 0.5}, ${pl.pos[2]})`);
  await t.waitFor(`window.__juego.jugador.cuerpo.enSuelo && Math.abs(${P}[1] - ${pl.pos[1] + pl.tam[1] / 2}) < 0.05`, 8000, 'quedar parado en la plataforma');
  await t.shot(`${fotos}/1-jugando.png`);

  const r = await t.calls();
  afirmar(r && r.calls < 350, `demasiadas llamadas de dibujo: ${r?.calls}`);
  console.log(`  llamadas de dibujo: ${r.calls}, triángulos: ${r.triangles}, fps: ${await t.fps()}`);

  // tomar cada moneda yendo a donde está
  afirmar((await t.ev(`${S}.monedas`)) === 0, 'se tomó una moneda sin tocarla');
  for (const [i, m] of nivel.monedas.entries()) {
    await t.ev(`window.__juego.jugador.teletransportar(${m[0]}, ${m[1] - 0.9}, ${m[2]})`);
    await t.waitFor(`${S}.monedas === ${i + 1}`, 8000, `la moneda ${i + 1}`);
  }
  await t.waitFor(`!!document.querySelector('[data-testid=fin][data-gano=true]')`, 8000, 'pantalla de victoria');
  await t.shot(`${fotos}/2-gano.png`);

  // perder: se acaba el tiempo
  await t.click('btn-otra');
  await t.waitFor(`${S}.pantalla === 'jugando' && ${S}.monedas === 0`, 8000, 'partida nueva desde cero');
  await t.ev(`window.__juego.store.setState({ tiempo: 0.3 })`);
  await t.waitFor(`!!document.querySelector('[data-testid=fin][data-gano=false]')`, 8000, 'pantalla de derrota');
  await t.shot(`${fotos}/3-perdio.png`);
  await t.click('btn-menu');
  await t.waitFor(`!!document.querySelector('[data-testid=record]')`, 8000, 'el récord en el menú');
});

const tactil = await run('táctil', archivo, { hash: '#prueba', width: 390, height: 844, touch: true }, async (t) => {
  await t.click('btn-jugar');
  await t.waitFor(`!!document.querySelector('[data-testid=tactil-palanca]')`, 8000, 'la palanca táctil');
  await t.shot(`${fotos}/4-celular.png`);
});
process.exit(ok && tactil ? 0 : 1);
