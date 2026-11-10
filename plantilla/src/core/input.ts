// Entrada unificada: teclado, ratón y táctil escriben aquí; el juego solo lee `input`.
export const input = {
  /** movimiento −1..1 relativo a la cámara: mx derecha, mz atrás (W = −1) */
  mx: 0,
  mz: 0,
  correr: false,
  /** giro de cámara acumulado desde el último cuadro (píxeles) */
  giroX: 0,
  giroY: 0,
  /** palanca táctil */
  palanca: { x: 0, z: 0 },
  saltoPedido: false,
  /** true una sola vez por pulsación */
  tomarSalto() {
    const v = this.saltoPedido;
    this.saltoPedido = false;
    return v;
  },
};

const teclas = new Set<string>();
function actualizar() {
  const d = (a: string[], b: string[]) => (a.some((k) => teclas.has(k)) ? 1 : 0) - (b.some((k) => teclas.has(k)) ? 1 : 0);
  input.mx = d(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']) + input.palanca.x;
  input.mz = d(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']) + input.palanca.z;
  const l = Math.hypot(input.mx, input.mz);
  if (l > 1) {
    input.mx /= l;
    input.mz /= l;
  }
  input.correr = teclas.has('ShiftLeft') || teclas.has('ShiftRight') || Math.hypot(input.palanca.x, input.palanca.z) > 0.9;
}

export function moverPalanca(x: number, z: number) {
  input.palanca.x = x;
  input.palanca.z = z;
  actualizar();
}

let enlazado = false;
export function enlazarEntrada() {
  if (enlazado) return;
  enlazado = true;
  addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) input.saltoPedido = true;
    teclas.add(e.code);
    actualizar();
  });
  addEventListener('keyup', (e) => {
    teclas.delete(e.code);
    actualizar();
  });
  addEventListener('blur', () => {
    teclas.clear();
    actualizar();
  });
}

/** Arrastrar sobre el lienzo gira la cámara (ratón o un dedo). */
export function enlazarGiro(el: HTMLElement) {
  let ultimo: { x: number; y: number; id: number } | null = null;
  el.addEventListener('pointerdown', (e) => {
    ultimo = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  addEventListener('pointermove', (e) => {
    if (!ultimo || e.pointerId !== ultimo.id) return;
    input.giroX += e.clientX - ultimo.x;
    input.giroY += e.clientY - ultimo.y;
    ultimo = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  addEventListener('pointerup', (e) => {
    if (ultimo?.id === e.pointerId) ultimo = null;
  });
}
