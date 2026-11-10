// El lienzo 3D: monta el nivel y al jugador. Cada partida nueva lo vuelve a montar desde cero.
import { Canvas } from '@react-three/fiber';
import { Fragment } from 'react';
import { useJuego } from '../core/store';
import { enlazarGiro } from '../core/input';
import { Jugador } from './Jugador';
import { calidadBaja } from './kit';
import { Nivel } from './Nivel';

export function Lienzo() {
  const partida = useJuego((s) => s.partida);
  return (
    <Canvas
      shadows={!calidadBaja}
      dpr={calidadBaja ? 1 : [1, 2]}
      camera={{ fov: 60, near: 0.1, far: 200, position: [0, 6, 16] }}
      onCreated={({ gl }) => {
        window.__juego.gl = gl;
        enlazarGiro(gl.domElement);
      }}
    >
      {/* Fragment y no <group>: el fondo y la niebla del Cielo tienen que colgar de la escena */}
      <Fragment key={partida}>
        <Nivel />
        <Jugador />
      </Fragment>
    </Canvas>
  );
}
