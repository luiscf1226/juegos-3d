# Kit, mundo y rendimiento

## Convenciones del mundo

- Las unidades son metros y **Y va hacia arriba**. El jugador mide 1.75 m y tiene 0.42 m de radio. Camina a 5.2 m/s,
  corre a 8.2 m/s y salta unos 1.7 m de alto.
- `yaw = 0` mira hacia **−Z** y la cámara queda detrás, en +Z.
- El `pos` de `Bloque` y `Cilindro` es el **centro**. El de `Arbol` y el resto de la utilería es el **punto de apoyo
  en el suelo**.
- La física no tiene rampas. Los escalones de hasta 0.36 m se suben solos, y para el relieve se usan escalones y
  plataformas.
- `mundo.suelo = null` quita el suelo (para caer al vacío). `mundo.caidaY` es la altura a la que se reaparece y
  `mundo.limite` es el radio jugable.

## Piezas (`src/juego/kit.tsx`)

```tsx
<Cielo hora="dia|tarde|noche" />                      // fondo, niebla, luz de cielo y la única luz con sombras
<Suelo tam={48} color="#5aa845" mat="cesped" />        // disco visual en y = 0
<Bloque pos tam color mat solido />                    // caja con colisión (solido por defecto)
<Cilindro pos r alto color mat />                      // decorativo, sin colisión
<Arbol pos escala color />                             // con colisión en el tronco
<Moneda pos />                                         // gira, se toma al tocarla y llama a store.tomarMoneda()
<Etiqueta pos texto alto fg bg />                      // letrero que mira a la cámara, dibujado en lienzo
useTick((dt, t) => {})                                 // bucle de juego; solo corre en la partida; dt ≤ 0.05
useCaja(pos, tam, activa)                              // caja de colisión propia mientras el componente exista
material(mat, color, repetir)                          // MeshStandardMaterial con textura de lienzo, en caché
texturaTexto(texto, { fg, bg, px })                    // CanvasTexture con texto
```

Materiales (`mat`): `liso cesped piedra madera ladrillo arena agua metal`. El color lo eliges tú y la textura lo
matiza. Para un material nuevo, agrega un caso a `pintar()`: se dibuja en gris sobre blanco para que el color lo tiña.

## Jugador (`src/core/jugador.ts`)

```ts
jugador.cuerpo.pos / vel / enSuelo
jugador.teletransportar(x, y, z)   jugador.ponerInicio(pos, yaw)   jugador.reaparecer()
jugador.camFija = { pos, mira }    // cámara fija para capturas o cinemáticas; null vuelve a seguir
jugador.camYaw / camPitch / camDist
```

Entrada (`src/core/input.ts`): `input.mx` y `input.mz` van de −1 a 1 y son relativos a la cámara. `input.correr`
dice si corre, y `input.tomarSalto()` da true una sola vez por pulsación. El teclado, la palanca táctil y el
arrastre de cámara escriben ahí, y el juego solo lee `input`.

## Rendimiento

- **Presupuesto:** menos de unas 350 llamadas de dibujo y 60 fps en una compu normal. La prueba lo mide con
  `t.calls()` y `t.fps()`.
- **Una sola luz con sombras.** Su cámara de sombras sigue al jugador (±25 m). Para lo demás usa luz de cielo
  (`hemisphereLight`) y materiales emisivos.
- **Repeticiones:** de unas 30 copias de la misma pieza para arriba, usa `InstancedMesh`. La geometría estática que
  no se mueve se fusiona (`mergeGeometries`).
- **Nada nuevo en cada cuadro:** vectores temporales fuera del componente, y geometrías y materiales en caché.
- **Calidad baja para pruebas:** con `#prueba` en la dirección no hay sombras y la resolución es 1×. En celular,
  `dpr={[1, 2]}` ya limita la resolución.

## Arte sin archivos

- Lo bajo en polígonos con `flatShading` o con `IcosahedronGeometry(r, 0)` se ve bien y pesa poco.
- Texturas en un lienzo de 128 × 128 con ruido, vetas o ladrillos en gris. Con `RepeatWrapping` y `repeat` según el
  tamaño, no se estiran.
- El cielo es un color de fondo más niebla del mismo tono, y así el horizonte se funde. Para la noche, sube los
  emisivos (faroles, ventanas) en vez de agregar luces.
- Personajes: una cápsula, una esfera y dos ojos ya leen como muñeco. Cuando haga falta, agrega brazos y piernas
  como grupos que giran al caminar.
- Para tener dos estilos (por ejemplo bloques y suave), separa un **paquete de arte** con la misma interfaz
  (`Bloque`, `Arbol`, `Avatar`, `Cielo`…). Las escenas no cambian.

## Un solo HTML

`tools/build.mjs` corre `vite build` con todo en un JS y un CSS (`vite.config.ts`). Luego mete los dos en
`dist/juego.html` y escribe `dist/artifact.html` sin `<html>`, `<head>` ni `<body>`. Las fuentes salen de los
`<link>` de Google Fonts de `index.html`. Si el archivo pasa de 15 MB, avisa: algo grande se metió.
