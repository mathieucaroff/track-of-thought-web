import * as pixi from 'pixi.js'
import { SQUARE_WIDTH } from './constants'
import { Game } from './game'
import * as graphics from './graphics/graphics'
import { createGrid, Grid } from './grid'
import { importerObject } from './level/importerObject'
import { Direction } from './type'
import { colorNameToNumber, randomPick, addPosition, isStraight } from './util'

let app: pixi.Application
let speedFactor = 1

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
  // let importer = importerObject['04']['4']

  let levelContent = await importer()

  console.log('levelContent', levelContent)

  let grid = createGrid(levelContent)

  // speedFactor hooks
  window.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      speedFactor = 3
    }
  })
  window.addEventListener('keyup', (event) => {
    if (event.key === ' ') {
      speedFactor = 1
    }
  })

  return grid
}

let simpleTrack = (start: Direction, end: Direction) => {
  if (start === end) {
    throw new Error(`encountered equal start and end (${start}) in some level file`)
  }
  if (isStraight(start, end)) {
    let result = graphics.road()
    if ([start, end].includes('top')) {
      result.rotation = Math.PI / 2
      result.x += SQUARE_WIDTH
    }
    return result
  } else {
    let turn = graphics.roadTurn()
    let [c, d] = [start, end].sort()
    if (c + d === 'righttop') {
      turn.rotation = Math.PI / 2
      turn.x += SQUARE_WIDTH
    } else if (c + d === 'bottomright') {
      turn.rotation = Math.PI
      turn.x += SQUARE_WIDTH
      turn.y += SQUARE_WIDTH
    } else if (c + d === 'bottomleft') {
      turn.rotation = -Math.PI / 2
      turn.y += SQUARE_WIDTH
    }
    return turn
  }
}

let buildLevel = (grid: Grid) => {
  // draw tracks and fill the switchArray
  grid.tracks.forEach((track) => {
    let result = new pixi.Container()

    let g: pixi.Graphics
    if (track.switch === 'true') {
      g = simpleTrack(track.start, track.end2)
      addPosition(g, track)
      result.addChild(g)

      g = graphics.switchCircle()
      addPosition(g, track)
      result.addChild(g)
      g.interactive = true
      g.hitArea = new pixi.Circle(SQUARE_WIDTH / 2, SQUARE_WIDTH / 2, SQUARE_WIDTH / 2)
      ;(g as any).mousedown = () => {
        ;[track.end1, track.end2] = [track.end2, track.end1]
        let g = simpleTrack(track.start, track.end2)
        addPosition(g, track)
        result.addChild(g)
        g = graphics.switchCircle()
        addPosition(g, track)
        result.addChild(g)
        g = simpleTrack(track.start, track.end1)
        addPosition(g, track)
        result.addChild(g)
      }
      ;(g as any).mouseover = () => {
        app.view.style.cursor = 'pointer'
      }
      ;(g as any).mouseout = () => {
        app.view.style.cursor = 'inherit'
      }
    }
    g = simpleTrack(track.start, track.end1)
    addPosition(g, track)
    result.addChild(g)
    app.stage.addChild(result)
  })

  // draw stations
  grid.stations.forEach((entry) => {
    let g = graphics.station(colorNameToNumber(entry.color) ?? 0x222222)
    addPosition(g, entry)
    app.stage.addChild(g)
  })
  let g = graphics.station(colorNameToNumber(grid.start.color) ?? 0x222222)
  addPosition(g, grid.start)
  app.stage.addChild(g)
}

let main = async () => {
  let grid = await init()
  buildLevel(grid)
  let game = new Game(app, grid)
  pixi.Ticker.shared.add(() => {
    game.update(pixi.Ticker.shared.elapsedMS * speedFactor)
  })
}

main()
