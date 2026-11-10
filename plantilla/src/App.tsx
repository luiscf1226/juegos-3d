// Interfaz: menú, HUD, pantalla final y controles táctiles. Los data-testid son contrato con las pruebas.
import { useRef } from 'react';
import { input, moverPalanca } from './core/input';
import { useJuego } from './core/store';
import { Lienzo } from './juego/Lienzo';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function App() {
  const pantalla = useJuego((s) => s.pantalla);
  return (
    <div className="app">
      <Lienzo />
      {pantalla === 'menu' && <Menu />}
      {pantalla === 'jugando' && <Hud />}
      {pantalla === 'fin' && <Fin />}
    </div>
  );
}

function Menu() {
  const { empezar, record } = useJuego();
  return (
    <div className="capa" data-testid="menu">
      <h1>Mi Juego 3D</h1>
      <p>Juntá las 8 monedas antes de que se acabe el tiempo.</p>
      <button type="button" data-testid="btn-jugar" onClick={empezar}>
        Jugar
      </button>
      {record !== null && <p data-testid="record">Récord: {fmt(record)}</p>}
      <p className="ayuda">WASD o flechas · Shift corre · Espacio salta · arrastrá para girar la cámara</p>
    </div>
  );
}

function Hud() {
  const { monedas, meta, tiempo } = useJuego();
  return (
    <>
      <div className="hud" data-testid="hud">
        <span data-testid="hud-monedas">
          🪙 {monedas}/{meta}
        </span>
        <span data-testid="hud-tiempo" className={tiempo < 10 ? 'poco' : ''}>
          ⏱ {fmt(tiempo)}
        </span>
      </div>
      <Tactil />
    </>
  );
}

function Fin() {
  const { gano, empezar, menu, monedas, meta } = useJuego();
  return (
    <div className="capa" data-testid="fin" data-gano={String(gano)}>
      <h1>{gano ? '¡Las juntaste todas!' : 'Se acabó el tiempo'}</h1>
      <p>
        {monedas} de {meta} monedas
      </p>
      <button type="button" data-testid="btn-otra" onClick={empezar}>
        Otra vez
      </button>
      <button type="button" className="sec" data-testid="btn-menu" onClick={menu}>
        Menú
      </button>
    </div>
  );
}

/** Palanca a la izquierda y botón de salto a la derecha; solo se ven en pantallas táctiles. */
function Tactil() {
  const base = useRef<HTMLDivElement>(null);
  const punta = useRef<HTMLDivElement>(null);
  const mover = (e: React.PointerEvent) => {
    const b = base.current!.getBoundingClientRect();
    let x = (e.clientX - (b.left + b.width / 2)) / (b.width / 2);
    let z = (e.clientY - (b.top + b.height / 2)) / (b.height / 2);
    const l = Math.hypot(x, z);
    if (l > 1) {
      x /= l;
      z /= l;
    }
    moverPalanca(x, z);
    punta.current!.style.transform = `translate(${x * 40}px, ${z * 40}px)`;
  };
  const soltar = () => {
    moverPalanca(0, 0);
    punta.current!.style.transform = '';
  };
  return (
    <div className="tactil">
      <div
        ref={base}
        className="palanca"
        data-testid="tactil-palanca"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          mover(e);
        }}
        onPointerMove={(e) => e.buttons && mover(e)}
        onPointerUp={soltar}
        onPointerCancel={soltar}
      >
        <div ref={punta} className="punta" />
      </div>
      <button
        type="button"
        className="saltar"
        data-testid="tactil-saltar"
        onPointerDown={() => {
          input.saltoPedido = true;
        }}
      >
        ⤒
      </button>
    </div>
  );
}
