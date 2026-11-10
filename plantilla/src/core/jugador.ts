// El jugador como datos: posición, cámara y aparición. Las escenas y las pruebas lo leen y lo mueven desde aquí.
import type { Cuerpo, V3 } from './fisica';

export const jugador = {
  cuerpo: { pos: [0, 0, 0], vel: [0, 0, 0], radio: 0.42, alto: 1.75, enSuelo: true } as Cuerpo,
  /** hacia dónde mira el muñeco; yaw = 0 mira hacia −Z */
  yaw: 0,
  camYaw: 0,
  camPitch: 0.35,
  camDist: 8,
  inicio: [0, 0, 0] as V3,
  /** cámara fija para capturas o cinemáticas; null = sigue al jugador */
  camFija: null as null | { pos: V3; mira: V3 },
  /** se usa para animar al caminar */
  rapidez: 0,
  teletransportar(x: number, y: number, z: number) {
    this.cuerpo.pos = [x, y, z];
    this.cuerpo.vel = [0, 0, 0];
  },
  ponerInicio(pos: V3, yaw = 0) {
    this.inicio = [...pos];
    this.yaw = this.camYaw = yaw;
    this.teletransportar(...pos);
  },
  reaparecer() {
    this.teletransportar(...this.inicio);
  },
};
