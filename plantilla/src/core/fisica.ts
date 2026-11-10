// Física ligera hecha a mano: un personaje (círculo + altura) contra cajas. Gravedad, salto, pararse encima de cosas
// y subir escalones bajos solo. Para un juego de plataformas o de caminar basta, y no pesa nada.
export type V3 = [number, number, number];
export interface Caja {
  min: V3;
  max: V3;
}
export interface Cuerpo {
  pos: V3;
  vel: V3;
  radio: number;
  alto: number;
  enSuelo: boolean;
}

export const GRAVEDAD = 26;
const ESCALON = 0.36;

export const mundo = {
  cajas: new Set<Caja>(),
  /** altura del suelo; null = no hay suelo (se cae al vacío) */
  suelo: 0 as number | null,
  /** por debajo de esta altura el jugador reaparece */
  caidaY: -20,
  /** el jugador no sale de este radio alrededor del origen */
  limite: 30,
  reiniciar() {
    this.cajas.clear();
    this.suelo = 0;
    this.caidaY = -20;
    this.limite = 30;
  },
};

export const cajaDe = (pos: V3, tam: V3): Caja => ({
  min: [pos[0] - tam[0] / 2, pos[1] - tam[1] / 2, pos[2] - tam[2] / 2],
  max: [pos[0] + tam[0] / 2, pos[1] + tam[1] / 2, pos[2] + tam[2] / 2],
});

const encima = (c: Caja, x: number, z: number, m: number) =>
  x > c.min[0] - m && x < c.max[0] + m && z > c.min[2] - m && z < c.max[2] + m;

/** Empuja el círculo fuera de la caja en el plano XZ. */
function empujar(c: Caja, p: V3, r: number) {
  const cx = Math.max(c.min[0], Math.min(c.max[0], p[0]));
  const cz = Math.max(c.min[2], Math.min(c.max[2], p[2]));
  const dx = p[0] - cx;
  const dz = p[2] - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return;
  if (d2 > 1e-8) {
    const d = Math.sqrt(d2);
    p[0] = cx + (dx / d) * r;
    p[2] = cz + (dz / d) * r;
    return;
  }
  const l = p[0] - c.min[0];
  const rr = c.max[0] - p[0];
  const n = p[2] - c.min[2];
  const f = c.max[2] - p[2];
  const m = Math.min(l, rr, n, f);
  if (m === l) p[0] = c.min[0] - r;
  else if (m === rr) p[0] = c.max[0] + r;
  else if (m === n) p[2] = c.min[2] - r;
  else p[2] = c.max[2] + r;
}

export function paso(b: Cuerpo, dt: number) {
  const p = b.pos;
  b.vel[1] -= GRAVEDAD * dt;
  p[0] += b.vel[0] * dt;
  p[2] += b.vel[2] * dt;
  // paredes: todo lo que está a la altura del cuerpo y no se puede subir de un paso
  for (const c of mundo.cajas) if (c.max[1] > p[1] + ESCALON && c.min[1] < p[1] + b.alto) empujar(c, p, b.radio);
  const d = Math.hypot(p[0], p[2]);
  if (d > mundo.limite) {
    p[0] *= mundo.limite / d;
    p[2] *= mundo.limite / d;
  }
  // piso y techo
  let piso = mundo.suelo ?? Number.NEGATIVE_INFINITY;
  let techo = Number.POSITIVE_INFINITY;
  for (const c of mundo.cajas) {
    if (!encima(c, p[0], p[2], b.radio * 0.6)) continue;
    if (c.max[1] <= p[1] + ESCALON) piso = Math.max(piso, c.max[1]);
    else if (c.min[1] >= p[1] + b.alto - 0.01) techo = Math.min(techo, c.min[1]);
  }
  let y = p[1] + b.vel[1] * dt;
  if (y + b.alto > techo && b.vel[1] > 0) {
    y = techo - b.alto;
    b.vel[1] = 0;
  }
  if (y <= piso) {
    y = piso;
    b.vel[1] = 0;
    b.enSuelo = true;
  } else b.enSuelo = false;
  p[1] = y;
}
