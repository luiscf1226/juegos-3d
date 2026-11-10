// Control en tercera persona: lee la entrada, mueve el cuerpo con la física, anima el muñeco y lleva la cámara.
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { mundo, paso } from '../core/fisica';
import { input } from '../core/input';
import { jugador } from '../core/jugador';
import { jugando } from '../core/store';
import { material } from './kit';

const CAMINA = 5.2;
const CORRE = 8.2;
const SALTO = 9.4;
const camPos = new THREE.Vector3(0, 6, 10);
const mira = new THREE.Vector3();

export function Jugador({ color = '#2f7bd9' }: { color?: string }) {
  const grupo = useRef<THREE.Group>(null);
  const cuerpo = useRef<THREE.Group>(null);
  const camara = useThree((s) => s.camera);
  const st = useRef({ coyote: 0, paso: 0 });

  useFrame((_, crudo) => {
    const dt = Math.min(crudo, 0.05);
    const b = jugador.cuerpo;
    jugador.camYaw -= input.giroX * 0.005;
    jugador.camPitch = Math.max(-0.1, Math.min(1.2, jugador.camPitch + input.giroY * 0.004));
    input.giroX = input.giroY = 0;

    if (jugando()) {
      // moverse relativo a la cámara
      const s = Math.sin(jugador.camYaw);
      const c = Math.cos(jugador.camYaw);
      const vx = input.mx * c + input.mz * s;
      const vz = -input.mx * s + input.mz * c;
      const v = input.correr ? CORRE : CAMINA;
      b.vel[0] = vx * v;
      b.vel[2] = vz * v;
      if (Math.hypot(vx, vz) > 0.05) {
        const objetivo = Math.atan2(-vx, -vz);
        let d = objetivo - jugador.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        jugador.yaw += d * Math.min(1, dt * 12);
      }
      st.current.coyote = b.enSuelo ? 0.12 : st.current.coyote - dt;
      if (input.tomarSalto() && st.current.coyote > 0) {
        b.vel[1] = SALTO;
        st.current.coyote = 0;
      }
      paso(b, dt);
      if (b.pos[1] < mundo.caidaY) jugador.reaparecer();
      jugador.rapidez = Math.hypot(b.vel[0], b.vel[2]);
    } else jugador.rapidez = 0;

    const g = grupo.current;
    if (g) {
      g.position.set(b.pos[0], b.pos[1], b.pos[2]);
      g.rotation.y = jugador.yaw;
    }
    // balanceo al caminar
    st.current.paso += dt * jugador.rapidez * 2.2;
    if (cuerpo.current) cuerpo.current.position.y = b.enSuelo ? Math.abs(Math.sin(st.current.paso)) * 0.08 : 0.05;

    // cámara
    if (jugador.camFija) {
      camara.position.set(...jugador.camFija.pos);
      camara.lookAt(...jugador.camFija.mira);
      return;
    }
    const d = jugador.camDist;
    const cp = Math.cos(jugador.camPitch);
    camPos.set(
      b.pos[0] + Math.sin(jugador.camYaw) * d * cp,
      b.pos[1] + 1.6 + Math.sin(jugador.camPitch) * d,
      b.pos[2] + Math.cos(jugador.camYaw) * d * cp,
    );
    camara.position.lerp(camPos, Math.min(1, dt * 8));
    mira.set(b.pos[0], b.pos[1] + 1.3, b.pos[2]);
    camara.lookAt(mira);
  });

  const piel = material('liso', '#f1c27d');
  const ropa = material('liso', color);
  const oscuro = material('liso', '#222');
  return (
    <group ref={grupo}>
      <group ref={cuerpo}>
        <mesh position-y={0.75} material={ropa} castShadow>
          <capsuleGeometry args={[0.36, 0.7, 6, 14]} />
        </mesh>
        <mesh position-y={1.45} material={piel} castShadow>
          <sphereGeometry args={[0.3, 20, 14]} />
        </mesh>
        <mesh position={[-0.1, 1.5, -0.26]} material={oscuro}>
          <sphereGeometry args={[0.045, 8, 6]} />
        </mesh>
        <mesh position={[0.1, 1.5, -0.26]} material={oscuro}>
          <sphereGeometry args={[0.045, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}
