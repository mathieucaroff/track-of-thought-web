import * as pixi from 'pixi.js'
import { Game } from './game'
import * as graphics from './graphics/graphics'
import {
  Direction,
  GridPosition,
  importerObject,
  LevelObject,
  TrackEntry,
} from './level/importerObject'

let app: pixi.Application

let init = async () => {
  let type = 'WebGL'
  if (!pixi.utils.isWebGLSupported()) {
    type = 'canvas'
  }

  pixi.utils.sayHello(type)

  app = new pixi.Application({})

  // size
  let resize = () => {
    app.renderer.resize(window.innerWidth - 3, window.innerHeight - 4)
  }
  resize()
  window.addEventListener('resize', resize)

  app.renderer.backgroundColor = 0x061639

  document.body.appendChild(app.view)

  let [levelNumber, alternativeImporterObject] = randomPick(Object.entries(importerObject))
  let [alternativeNumber, importer] = randomPick(Object.entries(alternativeImporterObject))

  console.log('level', levelNumber, alternativeNumber)

  let levelContent = await importer()

  console.log('levelContent', levelContent)

  return levelContent
}

let randomPick = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)]
}

let aligned = (a: Direction, b: Direction) => {
  let [c, d] = [a, b].sort()
  return (c === 'bottom' && d === 'top') || (c === 'left' && d === 'right')
}

let setPosition = (g: pixi.Container, position: GridPosition) => {
  g.x += graphics.SQUARE_WIDTH * position.column
  g.y += graphics.SQUARE_WIDTH * position.row
  return g
}

let colorNameToNumber = (color: string) => {
  return {
    'black': 0x0,
    'blue + o': 0x004488,
    'blue': 0x0088ff,
    'cyan + o': 0x008888,
    'cyan': 0x00ffff,
    'green + o': 0x008800,
    'green': 0x00ff00,
    'orange + o': 0x884400,
    'orange': 0xff8800,
    'pink + o': 0x884444,
    'pink': 0xff8888,
    'red + o': 0x880000,
    'red': 0xff0000,
    'yellow + o': 0x888800,
    'yellow': 0xffff00,
  }[color]
}

let simpleTrack = (start: Direction, end: Direction) => {
  if (start === end) {
    throw new Error(`encountered equal start and end (${start}) in some level file`)
  }
  if (aligned(start, end)) {
    let result = graphics.road()
    if ([start, end].includes('top')) {
      result.rotation = Math.PI / 2
      result.x += graphics.SQUARE_WIDTH
    }
    return result
  } else {
    let turn = graphics.roadTurn()
    let [c, d] = [start, end].sort()
    if (c + d === 'lefttop') {
    } else if (c + d === 'righttop') {
      turn.rotation = Math.PI / 2
      turn.x += graphics.SQUARE_WIDTH
    } else if (c + d === 'bottomright') {
      turn.rotation = Math.PI
      turn.x += graphics.SQUARE_WIDTH
      turn.y += graphics.SQUARE_WIDTH
    } else {
      turn.rotation = -Math.PI / 2
      turn.y += graphics.SQUARE_WIDTH
    }
    return turn
  }
}

let buildLevel = (levelContent: LevelObject) => {
  // draw tracks and fill the switchArray
  let switchArray: TrackEntry[] = []
  levelContent.tracks.forEach((track) => {
    let result = new pixi.Container()

    let g = simpleTrack(track.start, track.end1)
    setPosition(g, track)
    result.addChild(g)
    if (track.switch === 'true') {
      g = graphics.switchCircle()
      setPosition(g, track)
      result.addChild(g)

      g = simpleTrack(track.start, track.end2)
      setPosition(g, track)
      result.addChild(g)

      switchArray.push(track)
    }
    app.stage.addChild(result)
  })

  // draw stations
  levelContent.stations.forEach((entry) => {
    let g = graphics.station(colorNameToNumber(entry.color) || 0x222222)
    setPosition(g, entry)
    app.stage.addChild(g)
  })

  return switchArray
}

let main = async () => {
  let levelContent = await init()
  let switchArray = buildLevel(levelContent)
  app.renderer.plugins.interaction.on('pointerdown', (event) => {
    let { x, y } = event.data.global
    switchArray.some((entry) => {
      let sx = (entry.column + 0.5) * graphics.SQUARE_WIDTH
      let sy = (entry.row + 0.5) * graphics.SQUARE_WIDTH
      if ((x - sx) ** 2 + (y - sy) ** 2 < graphics.SQUARE_WIDTH ** 2 / 4) {
        ;[entry.end1, entry.end2] = [entry.end2, entry.end1]
        buildLevel(levelContent)
        return true
      }
    })
  })
  let game = new Game(levelContent)
  pixi.Ticker.shared.add((dt) => {
    game.update(dt)
  })
}

main()
