---
name: juegos-3d
description: Crear y diseñar juegos 3D para el navegador que salen en un solo archivo HTML, sin nada que descargar, listos para publicarse como Artifact de Claude o abrirse con doble clic. Trae una plantilla que ya funciona (React Three Fiber, física ligera, kit de piezas, materiales hechos con lienzo, controles de teclado y táctiles) y un arnés de Chromium que juega solo, toma capturas y graba video. Úsala cuando el usuario diga «hazme un juego 3D», «diseña un juego», «un juego en un artifact», «prototipo jugable», «quiero un minijuego», «mejora este juego 3D», o en inglés «make a 3D game», «game artifact», «playable prototype».
---

# Juegos 3D en un solo archivo

Lo que se entrega es un juego que **se juega de verdad**. Cada botón hace algo, se puede ganar y perder, funciona en
la compu y en el celular, y sale en un solo HTML que se publica como Artifact o se manda por WhatsApp.

```
diseñar ──▶ arrancar de la plantilla ──▶ construir ──▶ probar y MIRAR ──▶ publicar ──▶ iterar
```

La plantilla está en `plantilla/`, junto a este archivo. Lee las referencias solo cuando las necesites:

| Archivo | Cuándo leerlo |
|---|---|
| `referencias/diseno.md` | Antes de diseñar: el bucle principal, la dificultad por etapas, motores y temas, cómo dar ganas de seguir jugando |
| `referencias/kit.md` | Antes de construir escenas: convenciones del mundo, piezas del kit, materiales, rendimiento |
| `referencias/pruebas.md` | Antes de escribir pruebas o de montar la revisión automática |

## 1. Diseñar primero

Antes de escribir código, deja esto claro con el usuario. Puede ir en el chat; si el juego es grande, publícalo como
página de plan.

1. **Una frase:** de qué va el juego. «Juntás monedas en una isla antes de que se acabe el tiempo.»
2. **El bucle principal:** qué hace el jugador cada 10 segundos y por qué quiere repetirlo.
3. **Victoria y derrota:** cómo se gana, cómo se pierde y qué se ve en cada caso.
4. **Controles:** teclado (WASD, Espacio, Shift, arrastrar para la cámara) y táctil (palanca y botones). Los dos desde
   el principio.
5. **Escenas y contenido:** los niveles, objetos, nombres y textos van **en datos** (`src/datos/*.json`), no metidos
   en el código. Así se cambian sin tocar la lógica y las pruebas los pueden leer.
6. **Estilo visual:** una paleta corta, los materiales y la hora del día. Mejor bajo en polígonos y con colores
   claros que realista y lento.
7. **Original:** mecánicas de un género, sí. Copiar un juego que existe (nombre, personajes, niveles, arte), no.
   Las marcas y los equipos reales van con apodos y sin logotipos.

Si el usuario trae su cultura o su país, úsalos de verdad: comidas, palabras, lugares y música en los temas, y el
texto en su forma de hablar.

## 2. Arrancar de la plantilla

```bash
cp -r <esta-skill>/plantilla <carpeta-del-juego> && cd <carpeta-del-juego>
pnpm install          # o npm install
pnpm test             # compila y juega solo: tiene que imprimir PASA antes de que cambies nada
pnpm dev              # http://localhost:5173 para jugar mientras construyes
```

Cambia `titulo` en `package.json` y el `<title>` de `index.html`. La plantilla es un juego completo y pequeño
(juntar 8 monedas sobre plataformas en 60 segundos). Cámbialo pieza por pieza: no la borres para empezar de cero.

| Dónde | Qué |
|---|---|
| `src/core/` | Lógica sin 3D: estado (`store.ts`, Zustand), entrada unificada, física, jugador |
| `src/juego/kit.tsx` | Piezas para armar escenas, materiales con lienzo, texto 3D, monedas, árboles, cielo |
| `src/juego/` | Jugador en tercera persona, nivel, lienzo |
| `src/App.tsx` | Menú, HUD, pantalla final, controles táctiles. Los `data-testid` son contrato con las pruebas |
| `src/datos/` | El contenido del juego en JSON |
| `tools/` | `build.mjs` (un solo HTML), `arnes.mjs`, `prueba.mjs`, `capturas.mjs` |

## 3. Construir

Reglas duras, porque cada una ya rompió un juego:

1. **Cero red mientras se juega.** Nada de `fetch`, modelos GLTF, imágenes, HDRI ni fuentes 3D externas. Solo Google
   Fonts por CSS. Las texturas se pintan en un lienzo (`material()` del kit) y el texto 3D sale de `Etiqueta` o
   `texturaTexto`. De drei no uses `Text`, `Text3D`, `Environment` con preset, `useGLTF` ni `useTexture` con URL.
   La prueba falla si hay peticiones de red.
2. **Las escenas usan el kit.** `Bloque`, `Suelo`, `Cilindro`, `Arbol`, `Moneda`, `Etiqueta` y `Cielo` llevan `color` y
   `mat`. Si te hace falta una pieza nueva, agrégala al kit para que todas las escenas se vean iguales.
3. **Rendimiento:** menos de unas 350 llamadas de dibujo por escena y **una sola luz con sombras** (la del `Cielo`,
   que sigue al jugador). Las piezas que se repiten van con `InstancedMesh`. Geometrías y materiales se crean una vez,
   fuera del componente o con caché, y nunca en cada cuadro.
4. **El bucle de juego va en `useTick`**, que se pausa solo fuera de la partida y limita `dt` a 0.05 s. Lo que cambia
   en cada cuadro vive en objetos mutables (`jugador`, refs), no en estado de React.
5. **Jugable de verdad:** nada que parezca un botón sin serlo. Cada partida tiene victoria y derrota, y «Otra vez»
   vuelve a montar la escena desde cero (la `key` de `partida`).
6. **Celular desde el día uno:** controles táctiles, texto que se lee a 390 px de ancho y nada que dependa del ratón.
7. **`localStorage` siempre con `try/catch`.** En un Artifact o en una ventana privada puede fallar.

## 4. Probar y MIRAR

```bash
pnpm typecheck
pnpm test             # juega una partida para ganar y otra para perder, en compu y en celular; revisa red y rendimiento
pnpm capturas         # capturas/*.png, capturas/recorrido.mp4 e INDICE.md
```

**Abre las capturas y míralas con ojo crítico en cada vuelta.** Una prueba en verde no dice si el juego se ve bien.
Estos fallos solo se ven mirando:

- el cielo y la niebla no aparecen: `<color attach="background">` y `<fog>` quedaron dentro de un `<group>`; tienen
  que colgar de la escena;
- el metal se ve café oscuro: sin mapa de entorno no tiene nada que reflejar, así que baja `metalness`;
- el HUD se parte en dos líneas en el celular: falta `white-space: nowrap`;
- cosas que flotan o se hunden: `pos` de un `Bloque` es su centro y el de la utilería es el punto de apoyo;
- caras que parpadean (z-fighting), texto cortado, sombras recortadas y colores que no se distinguen.

Cada mecánica nueva lleva su prueba en `tools/` (lee `referencias/pruebas.md`). La prueba **juega de verdad**: mantiene
teclas hasta que pase algo, se teletransporta para tomar cosas y llega hasta la pantalla final. Espera por lo que pasa
y no por segundos fijos, porque sin GPU el juego va a pocos cuadros por segundo.

## 5. Publicar

```bash
pnpm build            # dist/juego.html (página completa) y dist/artifact.html (fragmento para el Artifact)
```

- **Como Artifact de Claude:** publica `dist/artifact.html` con la herramienta Artifact (icono `game`). Para
  actualizarlo, vuelve a compilar y publica el mismo archivo, que queda en la misma dirección. El límite es 16 MB y
  la plantilla pesa alrededor de 1 MB.
- **Sin Artifacts:** `dist/juego.html` se abre con doble clic, se manda por mensaje o se sube a cualquier hosting
  estático (GitHub Pages, Cloudflare, Netlify).

Al usuario le das el enlace, cómo se juega (teclas y táctil), dos o tres capturas y lo que todavía no está.

## 6. Iterar

El usuario dice lo que no le gusta con sus palabras («está muy difícil», «se ve oscuro», «la cámara marea»). Lo
traduces a un cambio, lo pruebas, **miras las capturas** y vuelves a publicar en la misma dirección. Cuando cambia
el diseño, cambia primero los datos y las reglas, y después el código.

## 7. Cuando el juego crece

- **Varias escenas:** un `store` con `escena` y un componente por escena. Al entrar a una escena se limpia la física
  (`mundo.reiniciar()` dentro de `useState(() => …)`, antes de que las piezas registren sus cajas).
- **Minijuegos:** cada uno pasa por las fases `intro → jugando → fin` y termina con
  `terminar({ gano, estrellas, puntos })`. Los premios los calcula el `store`, no el minijuego.
- **Muchos juegos distintos:** separa el **motor** (la mecánica) del **tema** (nombres, formas, colores). Un motor con
  diez temas da diez juegos. Lee `referencias/diseno.md`.
- **Mucho trabajo:** pártelo en tickets y entrégalo por partes que se puedan ver, cada una con su vista previa y sus
  capturas.
