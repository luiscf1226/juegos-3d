// Estado del juego (Zustand): pantalla, monedas, tiempo y récord. Sin nada de 3D, para que se pueda probar y portar.
import { create } from 'zustand';
import nivel from '../datos/nivel.json';

export type Pantalla = 'menu' | 'jugando' | 'fin';

interface Estado {
  pantalla: Pantalla;
  /** sube en cada partida: la escena se vuelve a montar desde cero */
  partida: number;
  monedas: number;
  meta: number;
  tiempo: number;
  gano: boolean | null;
  record: number | null;
  empezar(): void;
  tomarMoneda(): void;
  tic(dt: number): void;
  terminar(gano: boolean): void;
  menu(): void;
}

const leerRecord = () => {
  try {
    const v = localStorage.getItem('record');
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};

export const useJuego = create<Estado>((set, get) => ({
  pantalla: 'menu',
  partida: 0,
  monedas: 0,
  meta: nivel.monedas.length,
  tiempo: nivel.tiempo,
  gano: null,
  record: leerRecord(),
  empezar: () => set((s) => ({ pantalla: 'jugando', partida: s.partida + 1, monedas: 0, tiempo: nivel.tiempo, gano: null })),
  tomarMoneda: () => {
    const s = get();
    if (s.pantalla !== 'jugando') return;
    set({ monedas: s.monedas + 1 });
    if (s.monedas + 1 >= s.meta) s.terminar(true);
  },
  tic: (dt) => {
    const s = get();
    if (s.pantalla !== 'jugando') return;
    const tiempo = Math.max(0, s.tiempo - dt);
    set({ tiempo });
    if (tiempo === 0) s.terminar(false);
  },
  terminar: (gano) => {
    const s = get();
    const usado = nivel.tiempo - s.tiempo;
    const record = gano && (s.record === null || usado < s.record) ? usado : s.record;
    try {
      if (record !== null) localStorage.setItem('record', String(record));
    } catch {}
    set({ pantalla: 'fin', gano, record });
  },
  menu: () => set({ pantalla: 'menu' }),
}));

export const jugando = () => useJuego.getState().pantalla === 'jugando';
