import { createRoot } from 'react-dom/client';
import type { WebGLRenderer } from 'three';
import { App } from './App';
import { mundo } from './core/fisica';
import { enlazarEntrada, input } from './core/input';
import { jugador } from './core/jugador';
import { useJuego } from './core/store';
import './estilos.css';

declare global {
  interface Window {
    /** puerta para las pruebas y para depurar desde la consola */
    __juego: { store: typeof useJuego; jugador: typeof jugador; mundo: typeof mundo; input: typeof input; gl?: WebGLRenderer };
  }
}
window.__juego = { store: useJuego, jugador, mundo, input };
enlazarEntrada();
createRoot(document.getElementById('root')!).render(<App />);
