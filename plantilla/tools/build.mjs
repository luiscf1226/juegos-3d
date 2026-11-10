// Compila el juego a un solo archivo HTML, sin nada que descargar salvo Google Fonts.
// Uso: node tools/build.mjs [--out <carpeta>]
//   <out>/juego.html     página completa: se abre con doble clic o se manda por WhatsApp
//   <out>/artifact.html  lo mismo sin <html>/<head>/<body>, para publicar como Artifact de Claude
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const out = resolve(oi >= 0 ? args[oi + 1] : join(raiz, 'dist'));
const titulo = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')).titulo ?? 'Juego';
const tmp = join(out, `.build-${process.pid}`);
mkdirSync(out, { recursive: true });
execFileSync(join(raiz, 'node_modules/.bin/vite'), ['build', '--outDir', tmp, '--emptyOutDir', '--logLevel', 'warn'], {
  cwd: raiz,
  stdio: 'inherit',
});
const archivos = readdirSync(join(tmp, 'assets'));
const leer = (ext) =>
  archivos
    .filter((f) => f.endsWith(ext))
    .map((f) => readFileSync(join(tmp, 'assets', f), 'utf8'))
    .join('\n');
const js = leer('.js').replace(/<\/script/gi, '<\\/script');
const css = leer('.css');
// las mismas fuentes que index.html
const fuentes = [...readFileSync(join(raiz, 'index.html'), 'utf8').matchAll(/<link [^>]*fonts\.(googleapis|gstatic)[^>]*>/g)]
  .map((m) => m[0])
  .join('');
const cuerpo = `<div id="root"></div>\n<script type="module">${js}</script>`;
writeFileSync(join(out, 'artifact.html'), `<title>${titulo}</title>\n${fuentes}\n<style>${css}</style>\n${cuerpo}\n`);
const pagina = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"><title>${titulo}</title>${fuentes}<style>${css}</style></head><body>${cuerpo}</body></html>\n`;
writeFileSync(join(out, 'juego.html'), pagina);
rmSync(tmp, { recursive: true, force: true });
const mb = pagina.length / 1024 / 1024;
console.log(`ok: ${mb.toFixed(2)} MB → ${join(out, 'juego.html')} y artifact.html`);
if (mb > 15) console.log('OJO: un Artifact admite hasta 16 MB; quita texturas grandes o datos incrustados.');
