// Kit para armar escenas: piezas con colisión, materiales hechos con lienzo (sin descargar nada), texto en 3D,
// monedas, utilería y el cielo con su única luz con sombras. Las escenas usan esto y no crean materiales a mano.
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { type Caja, cajaDe, mundo, type V3 } from '../core/fisica';
import { jugador } from '../core/jugador';
import { jugando, useJuego } from '../core/store';

export const calidadBaja = typeof location !== 'undefined' && location.hash.includes('prueba');

/** Bucle de juego: solo corre mientras se juega, y limita dt para que un cuadro lento no rompa la física. */
export function useTick(cb: (dt: number, t: number) => void, prioridad = 0) {
  const ref = useRef(cb);
  ref.current = cb;
  useFrame((s, d) => {
    if (jugando()) ref.current(Math.min(d, 0.05), s.clock.elapsedTime);
  }, prioridad);
}

/** Registra una caja de colisión mientras el componente esté montado. */
export function useCaja(pos: V3, tam: V3, activa = true) {
  const c = useMemo<Caja>(() => cajaDe(pos, tam), [pos[0], pos[1], pos[2], tam[0], tam[1], tam[2]]);
  useLayoutEffect(() => {
    if (!activa) return;
    mundo.cajas.add(c);
    return () => {
      mundo.cajas.delete(c);
    };
  }, [c, activa]);
  return c;
}

// ------------------------------------------------------------------ materiales con lienzo
export type Mat = 'liso' | 'cesped' | 'piedra' | 'madera' | 'ladrillo' | 'arena' | 'agua' | 'metal';
const rnd = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

function pintar(mat: Mat): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const r = rnd(mat.length * 977 + 13);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 128, 128);
  const gris = (v: number) => `rgb(${v},${v},${v})`;
  if (mat === 'cesped' || mat === 'arena' || mat === 'piedra') {
    const n = mat === 'piedra' ? 90 : 600;
    for (let i = 0; i < n; i++) {
      g.fillStyle = gris(200 + Math.floor(r() * 55));
      const s = mat === 'piedra' ? 6 + r() * 14 : 1 + r() * 3;
      g.fillRect(r() * 128, r() * 128, s, mat === 'cesped' ? s * 2.5 : s);
    }
  } else if (mat === 'madera') {
    for (let y = 0; y < 128; y += 16) {
      g.fillStyle = gris(215 + Math.floor(r() * 30));
      g.fillRect(0, y, 128, 15);
      g.fillStyle = gris(170);
      g.fillRect(0, y + 15, 128, 1);
    }
  } else if (mat === 'ladrillo') {
    g.fillStyle = gris(190);
    g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 8; y++)
      for (let x = -1; x < 5; x++) {
        g.fillStyle = gris(225 + Math.floor(r() * 30));
        g.fillRect(x * 32 + (y % 2) * 16 + 2, y * 16 + 2, 28, 12);
      }
  } else if (mat === 'agua') {
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = gris(230 + Math.floor(r() * 25));
      g.beginPath();
      const x = r() * 128;
      const y = r() * 128;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 8, y - 4, x + 16, y);
      g.stroke();
    }
  }
  return c;
}

const cache = new Map<string, THREE.Material>();
/** Material con su textura de lienzo; el color lo eliges tú y la textura lo matiza. */
export function material(mat: Mat, color: string, repetir = 1): THREE.Material {
  const clave = `${mat}|${color}|${repetir}`;
  let m = cache.get(clave);
  if (!m) {
    const tex = mat === 'liso' || mat === 'metal' ? null : new THREE.CanvasTexture(pintar(mat));
    if (tex) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repetir, repetir);
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    m = new THREE.MeshStandardMaterial({
      color,
      map: tex,
      roughness: mat === 'metal' ? 0.35 : mat === 'agua' ? 0.15 : 0.85,
      metalness: mat === 'metal' ? 0.8 : 0,
      transparent: mat === 'agua',
      opacity: mat === 'agua' ? 0.85 : 1,
    });
    cache.set(clave, m);
  }
  return m;
}

// ------------------------------------------------------------------ piezas
interface Pieza {
  pos: V3;
  color?: string;
  mat?: Mat;
}
/** Caja con colisión. `pos` es el centro. */
export function Bloque({ pos, tam, color = '#ccc', mat = 'liso', solido = true }: Pieza & { tam: V3; solido?: boolean }) {
  useCaja(pos, tam, solido);
  const rep = Math.max(1, Math.round(Math.max(tam[0], tam[2]) / 2));
  return (
    <mesh position={pos} castShadow receiveShadow material={material(mat, color, rep)}>
      <boxGeometry args={tam} />
    </mesh>
  );
}
/** Plano visual en y = 0. */
export function Suelo({ tam = 60, color = '#5aa845', mat = 'cesped' }: { tam?: number; color?: string; mat?: Mat }) {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow material={material(mat, color, tam / 4)}>
      <circleGeometry args={[tam / 2, 48]} />
    </mesh>
  );
}
/** Cilindro decorativo (sin colisión; para chocar usa un Bloque invisible con `solido`). */
export function Cilindro({ pos, r, alto, color = '#ccc', mat = 'liso' }: Pieza & { r: number; alto: number }) {
  return (
    <mesh position={pos} castShadow receiveShadow material={material(mat, color)}>
      <cylinderGeometry args={[r, r, alto, 20]} />
    </mesh>
  );
}

/** Textura con texto dibujado en lienzo: así no se descarga ninguna fuente de texto 3D. */
export function texturaTexto(texto: string, { fg = '#fff', bg = 'rgba(0,0,0,.55)', px = 64 } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = `700 ${px}px Fredoka, system-ui, sans-serif`;
  const w = Math.ceil(g.measureText(texto).width) + px;
  c.width = w;
  c.height = px * 1.6;
  g.font = `700 ${px}px Fredoka, system-ui, sans-serif`;
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(0, 0, w, c.height, px * 0.4);
  g.fill();
  g.fillStyle = fg;
  g.textBaseline = 'middle';
  g.fillText(texto, px / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { textura: t, aspecto: w / c.height };
}
/** Letrero que siempre mira a la cámara. */
export function Etiqueta({ pos, texto, alto = 0.6, fg, bg }: { pos: V3; texto: string; alto?: number; fg?: string; bg?: string }) {
  const { textura, aspecto } = useMemo(() => texturaTexto(texto, { fg, bg }), [texto, fg, bg]);
  return (
    <sprite position={pos} scale={[alto * aspecto, alto, 1]}>
      <spriteMaterial map={textura} depthWrite={false} />
    </sprite>
  );
}

const geoMoneda = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24);
// poco metal: sin un mapa de entorno que reflejar, el metal se ve café oscuro
const matMoneda = new THREE.MeshStandardMaterial({ color: '#ffd23f', metalness: 0.25, roughness: 0.35, emissive: '#b37400', emissiveIntensity: 0.45 });
/** Moneda que gira y se toma al tocarla. */
export function Moneda({ pos }: { pos: V3 }) {
  const ref = useRef<THREE.Mesh>(null);
  const [tomada, setTomada] = useState(false);
  useTick((_, t) => {
    if (tomada || !ref.current) return;
    ref.current.rotation.y = t * 3;
    ref.current.position.y = pos[1] + Math.sin(t * 2 + pos[0]) * 0.12;
    const p = jugador.cuerpo.pos;
    if (Math.hypot(p[0] - pos[0], p[1] + 0.9 - pos[1], p[2] - pos[2]) < 1.1) {
      setTomada(true);
      useJuego.getState().tomarMoneda();
    }
  });
  if (tomada) return null;
  return <mesh ref={ref} position={pos} rotation-x={Math.PI / 2} geometry={geoMoneda} material={matMoneda} castShadow />;
}

// ------------------------------------------------------------------ utilería
const geoTronco = new THREE.CylinderGeometry(0.18, 0.25, 1.6, 8);
const geoCopa = new THREE.IcosahedronGeometry(1.2, 0);
/** Árbol bajo en polígonos con colisión en el tronco. `pos` es el punto de apoyo en el suelo. */
export function Arbol({ pos, escala = 1, color = '#3f8f3a' }: { pos: V3; escala?: number; color?: string }) {
  useCaja([pos[0], pos[1] + 0.8 * escala, pos[2]], [0.5 * escala, 1.6 * escala, 0.5 * escala]);
  return (
    <group position={pos} scale={escala}>
      <mesh position-y={0.8} geometry={geoTronco} material={material('madera', '#8a5a35')} castShadow />
      <mesh position-y={2.2} geometry={geoCopa} material={material('liso', color)} castShadow />
    </group>
  );
}

// ------------------------------------------------------------------ cielo y luz
const HORAS = {
  dia: { cielo: '#8fd3ff', niebla: '#cfeaff', sol: '#fff4dc', fuerza: 2.4, hemi: 0.9, dir: [12, 20, 8] },
  tarde: { cielo: '#ffb36b', niebla: '#ffd2a1', sol: '#ffb070', fuerza: 1.8, hemi: 0.6, dir: [20, 8, 4] },
  noche: { cielo: '#0d1630', niebla: '#14203f', sol: '#9fb4ff', fuerza: 0.6, hemi: 0.25, dir: [-8, 18, -6] },
} as const;
/** Fondo, niebla y una sola luz con sombras que sigue al jugador. */
export function Cielo({ hora = 'dia' }: { hora?: keyof typeof HORAS }) {
  const h = HORAS[hora];
  const sol = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const l = sol.current;
    if (!l) return;
    const p = jugador.cuerpo.pos;
    l.position.set(p[0] + h.dir[0], p[1] + h.dir[1], p[2] + h.dir[2]);
    l.target.position.set(p[0], p[1], p[2]);
    l.target.updateMatrixWorld();
  });
  return (
    <>
      <color attach="background" args={[h.cielo]} />
      <fog attach="fog" args={[h.niebla, 30, 90]} />
      <hemisphereLight args={[h.cielo, '#4a5a3a', h.hemi]} />
      <directionalLight
        ref={sol}
        color={h.sol}
        intensity={h.fuerza}
        castShadow={!calidadBaja}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0004}
      />
    </>
  );
}
