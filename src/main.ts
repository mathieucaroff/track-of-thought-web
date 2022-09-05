import * as pixi from 'pixi.js'
import { default as packageJson } from '../package.json'
import { clickSound } from './audio/sound'
import { BACKGROUND_COLOR, SQUARE_WIDTH, SWITCH_COLOR, SWITCH_HOVER_COLOR } from './constants'
import { Game } from './game'
import * as graphics from './graphics'
import { createGrid, Grid } from './grid'
import { importerObject } from './level/importerObject'
import { create } from './lib/create'
import { githubCornerHTML } from './lib/githubCorner'
import { Direction } from './type'
import { addPosition, colorNameToNumber, isStraight, randomPick } from './util'

let levelPicker = (prop: { next: () => void }) => {
  let { next } = prop
  let search = new URLSearchParams(location.search)
  if (importerObject[(search.get('level') ?? '').split('-')[0]]) {
    next()
    return
  }

  let levelSelectionDiv = create('div', { className: 'levelSelectionDiv' }, [
    create('h1', { textContent: 'Select a level' }),
  ])
  document.body.appendChild(levelSelectionDiv)

  Object.keys(importerObject).forEach((levelNumber) => {
    levelSelectionDiv.appendChild(
      create('button', {
        textContent: levelNumber,
        className: 'levelSelectionButton',
        onclick: () => {
          levelSelectionDiv.style.opacity = '0%'
          levelSelectionDiv.addEventListener('transitionend', () => {
            document.body.removeChild(levelSelectionDiv)
            search.set('level', levelNumber)
            history.pushState({}, '', '?' + search)
            next()
          })
        },
      }),
    )
  })
}

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

let initGame = async () => {
  let type = 'WebGL'
  if (!pixi.utils.isWebGLSupported()) {
    type = 'canvas'
  }

  pixi.utils.sayHello(type)

  let app = new pixi.Application({})
  let speedFactor = 1

  // size
  let resize = () => {
    app.renderer.resize(window.innerWidth - 3, window.innerHeight - 4)
  }
  resize()
  window.addEventListener('resize', resize)

  app.renderer.backgroundColor = BACKGROUND_COLOR

  document.body.appendChild(app.view)
  window.getComputedStyle(app.view).opacity // this forces a flush of the style
  setTimeout(() => {
    app.view.className = 'visible'
  })

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

  let search = new URLSearchParams(location.search)

  let stage = new pixi.Container()
  stage.y = SQUARE_WIDTH
  app.stage.addChild(stage)
  addTracks(grid, app.view, stage)
  addStations(grid, stage)
  let game = new Game(stage, grid, app.view, { errorSound: search.has('errorSound') })
  pixi.Ticker.shared.add(() => {
    game.update(pixi.Ticker.shared.elapsedMS * speedFactor)
  })
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

let addTracks = (grid: Grid, canvas: HTMLCanvasElement, stage: pixi.Container) => {
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
        clickSound().play()
        drawSwitch(SWITCH_HOVER_COLOR)
      }

      ;(g as any).on('mousedown', switchTrack)
      ;(g as any).on('tap', switchTrack)
      ;(g as any).on('mouseover', () => {
        canvas.style.cursor = 'pointer'
        drawSwitch(SWITCH_HOVER_COLOR)
      })
      ;(g as any).on('mouseout', () => {
        canvas.style.cursor = 'inherit'
        drawSwitch(SWITCH_COLOR)
      })
    }
    g = simpleTrack(track.start, track.end1)
    addPosition(g, track)
    result.addChild(g)
    stage.addChild(result)
  })
}

let addStations = (grid: Grid, stage: pixi.Container) => {
  // draw stations
  grid.stations.forEach((entry) => {
    let g = graphics.station(colorNameToNumber(entry.color) ?? 0x222222)
    addPosition(g, entry)
    stage.addChild(g)
  })
  let g = graphics.station(colorNameToNumber(grid.start.color) ?? 0x222222)
  addPosition(g, grid.start)
  stage.addChild(g)
}

let main = () => {
  document.documentElement.style.backgroundColor = '#' + BACKGROUND_COLOR.toString(16)

  document.body.innerHTML += githubCornerHTML(packageJson.repository, packageJson.version)
  window.addEventListener('popstate', (event) => {
    location.reload()
  })
  levelPicker({ next: initGame })
}

main()
