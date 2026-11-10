// El nivel de ejemplo: una isla con plataformas y 8 monedas. Todo sale de datos/nivel.json.
import { useState } from 'react';
import { mundo, type V3 } from '../core/fisica';
import { jugador } from '../core/jugador';
import { useJuego } from '../core/store';
import nivel from '../datos/nivel.json';
import { Arbol, Bloque, Cielo, Etiqueta, Moneda, Suelo, useTick } from './kit';

export function Nivel() {
  // limpia la física y pone al jugador ANTES de que las piezas registren sus cajas
  useState(() => {
    mundo.reiniciar();
    mundo.limite = 22;
    jugador.ponerInicio(nivel.inicio as V3);
    return 0;
  });
  useTick((dt) => useJuego.getState().tic(dt));
  return (
    <>
      <Cielo hora="dia" />
      <Suelo tam={48} />
      {nivel.plataformas.map((p, i) => (
        <Bloque key={i} pos={p.pos as V3} tam={p.tam as V3} color={p.color} mat={p.mat as 'madera'} />
      ))}
      {nivel.monedas.map((m, i) => (
        <Moneda key={i} pos={m as V3} />
      ))}
      {nivel.arboles.map(([x, z], i) => (
        <Arbol key={i} pos={[x, 0, z]} escala={0.9 + (i % 3) * 0.2} />
      ))}
      <Etiqueta pos={[0, 2.6, 5]} texto="¡Juntá las monedas!" />
    </>
  );
}
