// Capturas y video automáticos para enseñar el juego: deja imágenes, un video corto y un INDICE.md.
// Uso: node tools/capturas.mjs dist/juego.html capturas
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { run } from './arnes.mjs';

const [archivo, salida] = process.argv.slice(2);
if (!archivo || !salida) {
  console.error('uso: node tools/capturas.mjs <juego.html> <carpeta>');
  process.exit(2);
}
const out = resolve(salida);
const hechas = [];
const foto = async (t, nombre, que) => {
  await t.shot(`${out}/${nombre}.png`);
  hechas.push({ nombre: `${nombre}.png`, que });
};
const P = 'window.__juego.jugador.cuerpo.pos';

const ok = await run('capturas', archivo, {}, async (t) => {
  await t.sleep(800);
  await foto(t, '1-menu', 'Menú');
  await t.click('btn-jugar');
  await t.waitFor(`!!document.querySelector('[data-testid=hud]')`);
  await t.sleep(1200);
  await t.grabar();
  await foto(t, '2-inicio', 'Empieza la partida');
  await t.holdUntil('w', `${P}[2] < 4`, 20000);
  await t.press(' ');
  await t.holdUntil(['d', 'w'], `${P}[0] > 3`, 20000);
  await t.sleep(600);
  await foto(t, '3-jugando', 'Corriendo hacia las plataformas');
  await t.ev(`window.__juego.jugador.camFija = { pos: [0, 30, 26], mira: [0, 0, -2] }`);
  await t.sleep(800);
  await foto(t, '4-desde-arriba', 'El nivel desde arriba');
  await t.ev(`window.__juego.jugador.camFija = null`);
  await t.sleep(600);
  const video = await t.parar(`${out}/recorrido.mp4`);
  hechas.push({ nombre: 'recorrido.mp4', que: `Video (${video.cuadros} cuadros)` });
});
writeFileSync(
  `${out}/INDICE.md`,
  `# Capturas\n\n${hechas.map((h) => (h.nombre.endsWith('.png') ? `- **${h.que}**\n\n  ![${h.que}](${h.nombre})` : `- [${h.que}](${h.nombre})`)).join('\n')}\n`,
);
console.log(`${hechas.length} archivos en ${out}; ábrelos y míralos antes de enseñarlos`);
process.exit(ok ? 0 : 1);
