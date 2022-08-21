import * as pixi from 'pixi.js'
import { Empty, generate, SquareContent } from './generator/generator'
import { road, roadTurn, SQUARE_WIDTH, station, train } from './graphics/graphics'

let type = 'WebGL'
if (!pixi.utils.isWebGLSupported()) {
  type = 'canvas'
}

pixi.utils.sayHello(type)

let app = new pixi.Application({})

// size
let resize = () => {
  app.renderer.resize(window.innerWidth - 3, window.innerHeight - 4)
}
resize()
window.addEventListener('resize', resize)

let level = generate({ width: 9, height: 9 }, 7)

// level interpreter
function levelToGraphics(square: SquareContent): pixi.Container | undefined {
  let result: pixi.Container | undefined
  switch (square.kind) {
    case 'empty':
      return
    case 'station':
      result = station(square.color)
      break
    case 'spawn':
      result = station(0)
      break
    case 'horizontalRoad':
      result = road()
      break
    case 'verticalRoad':
      result = new pixi.Container()
      let r = road()
      r.rotation = Math.PI / 2
      r.x += SQUARE_WIDTH
      result.addChild(r)
      break
    case 'turnA':
    case 'turnB':
    case 'turnC':
    case 'turnD':
      result = new pixi.Container()
      let turn = roadTurn()
      turn.rotation = Math.PI / 2
      turn.rotation = pixi.PI_2 * { A: 0, B: 0.25, C: 0.5, D: 0.75 }[square.kind[4]]!
      if (square.kind === 'turnB' || square.kind === 'turnC') {
        turn.x += SQUARE_WIDTH
      }
      if (square.kind === 'turnD' || square.kind === 'turnC') {
        turn.y += SQUARE_WIDTH
      }
      result.addChild(turn)
      break
    case 'switch':
      result = levelToGraphics(square.a)
  }
  return result
}

level.grid.forEach((row, y) => {
  row.forEach((square, x) => {
    let g = levelToGraphics(square)
    if (g === undefined) {
      return
    }
    g.x += SQUARE_WIDTH * x
    g.y += SQUARE_WIDTH * y
    app.stage.addChild(g)
  })
})

// train -> circle
// station -> square
// rail -> two rectangles or three circles

app.renderer.backgroundColor = 0x061639

document.body.appendChild(app.view)
