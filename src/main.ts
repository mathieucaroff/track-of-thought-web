import * as pixi from 'pixi.js'
import { BACKGROUND_COLOR, SQUARE_WIDTH, SWITCH_COLOR, SWITCH_HOVER_COLOR } from './constants'
import { Game } from './game'
import * as graphics from './graphics'
import { createGrid, Grid } from './grid'
import { importerObject } from './level/importerObject'
import { githubCornerHTML } from './lib/githubCorner'
import { Direction } from './type'
import { colorNameToNumber, randomPick, addPosition, isStraight } from './util'
import { default as packageJson } from '../package.json'
import './audio/sound.ts'
import { clickSound } from './audio/sound'

let app: pixi.Application
let speedFactor = 1

let importLevel = (prop: { levelNumber?: string; alternativeNumber?: string } = {}) => {
  if (!prop.levelNumber) {
    prop.levelNumber = randomPick(Object.keys(importerObject))
  }
  let alternativeImporterObject = importerObject[prop.levelNumber]
  if (!prop.alternativeNumber) {
    prop.alternativeNumber = randomPick(Object.keys(alternativeImporterObject))
  }
  console.log('level', prop.levelNumber, prop.alternativeNumber)
  return alternativeImporterObject[prop.alternativeNumber]()
}

let init = async () => {
  document.body.innerHTML += githubCornerHTML(packageJson.repository, packageJson.version)

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

  app.renderer.backgroundColor = BACKGROUND_COLOR

  document.body.appendChild(app.view)

  let param = new URLSearchParams(location.search)
  let levelNumber: string | undefined = undefined
  let alternativeNumber: string | undefined = undefined
  if (param.has('level')) {
    ;[levelNumber, alternativeNumber] = param.get('level')!.split('-')
  }
  let levelContent = await importLevel({ levelNumber, alternativeNumber })

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

let addTracks = (grid: Grid) => {
  // draw tracks and fill the switchArray
  grid.tracks.forEach((track) => {
    let result = new pixi.Container()

    let g: pixi.Graphics
    if (track.switch === 'true') {
      g = simpleTrack(track.start, track.end2)
      addPosition(g, track)
      result.addChild(g)

      g = graphics.switchCircle(SWITCH_COLOR)
      addPosition(g, track)
      result.addChild(g)
      g.interactive = true
      g.hitArea = new pixi.Circle(SQUARE_WIDTH / 2, SQUARE_WIDTH / 2, SQUARE_WIDTH)

      let drawSwitch = (circleColor: number) => {
        let g = simpleTrack(track.start, track.end2)
        addPosition(g, track)
        result.addChild(g)
        g = graphics.switchCircle(circleColor)
        addPosition(g, track)
        result.addChild(g)
        g = simpleTrack(track.start, track.end1)
        addPosition(g, track)
        result.addChild(g)
      }

      let switchTrack = () => {
        ;[track.end1, track.end2] = [track.end2, track.end1]
        clickSound.play()
        drawSwitch(SWITCH_HOVER_COLOR)
      }

      ;(g as any).on('mousedown', switchTrack)
      ;(g as any).on('tap', switchTrack)
      ;(g as any).mouseover = () => {
        app.view.style.cursor = 'pointer'
        drawSwitch(SWITCH_HOVER_COLOR)
      }
      ;(g as any).mouseout = () => {
        app.view.style.cursor = 'inherit'
        drawSwitch(SWITCH_COLOR)
      }
    }
    g = simpleTrack(track.start, track.end1)
    addPosition(g, track)
    result.addChild(g)
    app.stage.addChild(result)
  })
}

let addStations = (grid: Grid) => {
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
  addTracks(grid)
  addStations(grid)
  let game = new Game(app, grid)
  pixi.Ticker.shared.add(() => {
    game.update(pixi.Ticker.shared.elapsedMS * speedFactor)
  })
}

main()
