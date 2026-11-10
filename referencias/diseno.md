# Diseño de juegos

## El bucle principal

Escríbelo en una línea: **verbo + objetivo + presión**. «Saltar entre plataformas para juntar monedas antes de que
se acabe el tiempo.» Si no cabe en una línea, el juego todavía no está claro.

- **Cada 10 segundos** el jugador hace algo que se nota: toma algo, esquiva algo o llega a algún lado.
- **Cada 1 o 2 minutos** pasa algo más grande: termina una etapa, se ve el puntaje, aparece algo nuevo.
- **Entre partidas** hay una razón para volver: un récord, estrellas o algo que se desbloquea.

## Victoria, derrota y estrellas

- Toda partida termina, y se puede ganar y perder. La pantalla final dice qué pasó y ofrece «Otra vez» y «Menú».
- Estrellas: 1 por cumplir la meta, 2 por hacerlo bien y 3 por hacerlo casi perfecto. Guarda los umbrales en datos,
  como `{ "metas": [150, 250, 350] }`, no en el código.
- Mayor puntaje es mejor. Si el juego es de tiempo, convierte el tiempo en puntos o guarda el tiempo como récord.

## Dificultad por etapas

Los juegos largos van por etapas, de 3 a 6, y cada etapa dura de 60 a 120 segundos.

- Cada etapa recibe una dificultad `dif` de 0 a 1. Con ella sube la velocidad, aparecen más cosas o hay menos margen.
- **La etapa 1 se gana fácil** y la última cuesta. Si nadie pasa la 1, nadie llega a la 2.
- Usa un generador con semilla (`rng(semilla)`) para que una etapa salga igual cada vez y las pruebas sean estables.

## Motor y tema

Para tener muchos juegos sin escribir muchos juegos, separa:

- **Motor:** la mecánica. Por ejemplo cortar lo que cae, atrapar con una canasta, carrera, ritmo, pesca, trivia o
  manejo.
- **Tema:** datos que cambian cómo se ve y cómo se llama todo: `{ cosas: [["mango", "mango", "#f9a825"]], evita:
  [["piedra", "piedra"]], fondo: "finca", frases: ["¡Qué chivo!"] }`.

Reglas:
- Todos los campos del tema son opcionales y el motor trae valores por defecto. El motor sin tema también se juega.
- Si el tema trae una forma que el motor no conoce, se dibuja una bola del color pedido con su `Etiqueta`. Nunca
  falla.
- Si quieres variedad, **cada motor vive en un solo lugar** del juego: un nivel, un departamento o un mundo. Un
  script revisa que ningún motor se repita con otro nombre.

## Ganas de seguir jugando

- **Respuesta a todo:** al tomar algo, un sonido, un brillo y un número que sube. Al fallar, un sacudón corto de
  cámara.
- **Sonido sin archivos:** se sintetiza con WebAudio (`OscillatorNode` y ruido filtrado). No hay nada que descargar
  y pesa cero.
- **Frases cortas** en la forma de hablar del público, como un aviso de vez en cuando. No pongas muros de texto.
- **La cámara** sigue de cerca y con suavidad, y nunca atraviesa paredes en los niveles cerrados. Una cámara fija
  sirve para momentos especiales.
- **Bots:** si hay «otros jugadores» sin servidor, muéstralos como bots (🤖) y no los hagas pasar por personas.

## Texto

- Corto. Un botón dice una acción: «Jugar», «Otra vez», «Salir».
- Todo en el idioma del público. Si el juego es de un país, usa sus palabras.
- La ayuda de controles se ve en el menú y en la pantalla de inicio de cada minijuego, con teclas y gestos táctiles.
