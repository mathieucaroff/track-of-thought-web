import { pixi, random } from './alias'

import { clickSound } from './audio/sound'
import { defaultColorList, parseColorList, Theme } from './color'
import { generate } from './generator/generator'
import { createEmptyGrid, getGrid } from './grid'
import { parseLayout } from './layout'
import { TrackOfThoughtConfig } from './main'
import { createScore } from './score'
import { createSketcher } from './sketch'
import { createTrainManager } from './train'
import { Direction, Position } from './type'
import { Switch } from './type/tileType'
import { isStraight } from './util/direction'

export function setupGame(config: TrackOfThoughtConfig, theme: Theme) {
  const layout = parseLayout(config.layout)
  console.info('layout', layout)

  document.body.classList.add('gamemode')

  const sketch = createSketcher(layout, theme)

  const colorList = parseColorList(config.colorList).concat(defaultColorList)
  const colorSet = new Set(colorList)
  if (colorList.length < config.stationCount) {
    defaultColorList.forEach((color) => {
      if (!colorSet.has(color)) {
        colorList.push(color)
      }
    })
    if (colorList.length < config.stationCount) {
      throw new Error(
        `too few colors (${colorSet.size} colors for ${config.stationCount} stations)`,
      )
    } else {
      console.log(
        "warning: there's not enough colors in the list for the number of stations. Colors from the default set have been added.",
      )
    }
  }

  const randomEngine = random.MersenneTwister19937.seed(config.seed)

  const level = generate({
    gridSize: { height: config.gridHeight, width: config.gridWidth },
    randomEngine,
    stationCount: config.stationCount,
    retryCount: config.generateRetryCount,
    departureClearance: config.departureClearance,
  })

  console.info('level', level)

  const grid = getGrid(level, {
    width: config.gridWidth,
    height: config.gridHeight,
  })

  const onGameEnd = () => {
    interativeGraphicalSwitchArray.forEach((g) => {
      g.interactive = false
    })
  }

  const score = createScore(config.trainCount, document.body, layout, theme, onGameEnd)

  const graphicalGrid = createEmptyGrid<pixi.Container | null>({
    width: config.gridWidth,
    height: config.gridHeight,
  })

  let app = new pixi.Application({
    antialias: true,
    resizeTo: window,
    background: theme.background,
  })
  let canvas = app.view as HTMLCanvasElement
  setTimeout(() => {
    canvas.classList.add('visible')
  })
  document.body.appendChild(canvas)

  let gameContainer = new pixi.Container()
  let railContainer = new pixi.Container()
  let trainContainer = new pixi.Container()
  let stationContainer = new pixi.Container()

  gameContainer.y += layout.scoreHeight + 6

  const addPosition = (g: pixi.Container, position: Position) => {
    g.x += layout.squareWidth * position.x
    g.y += layout.squareWidth * position.y
    return g
  }

  // Draw Start
  let g = sketch.station(level.departure, theme.departure)
  addPosition(g, level.departure)
  stationContainer.addChild(g)

  graphicalGrid[level.departure.y][level.departure.x] = g

  // Draw destination stations
  level.destinationArray.map((station, k) => {
    let g = sketch.station(station, colorList[k])
    addPosition(g, station)
    graphicalGrid[station.y][station.x] = g
    stationContainer.addChild(g)
  })

  // Make switches interactive and draw tracks

  const drawTrack = (start: Direction, end: Direction) => {
    if (start === end) {
      throw new Error(`encountered equal start and end (${start})`)
    }
    if (isStraight(start, end)) {
      let result = sketch.road()
      if ([start, end].includes('top')) {
        result.rotation = Math.PI / 2
        result.x += layout.squareWidth
      }
      return result
    } else {
      let turn = sketch.roadTurn()
      let [c, d] = [start, end].sort()
      if (c + d === 'righttop') {
        turn.rotation = Math.PI / 2
        turn.x += layout.squareWidth
      } else if (c + d === 'bottomright') {
        turn.rotation = Math.PI
        turn.x += layout.squareWidth
        turn.y += layout.squareWidth
      } else if (c + d === 'bottomleft') {
        turn.rotation = -Math.PI / 2
        turn.y += layout.squareWidth
      }
      return turn
    }
  }

  let drawSwitch = (track: Switch) => {
    let result = new pixi.Container()
    result.addChild(drawTrack(track.entrance, track.otherExit))
    let g = new pixi.Graphics()
    sketch.switchCircle(g, theme.switch)
    result.addChild(g)
    result.addChild(drawTrack(track.entrance, track.exit))
    return result
  }
  const toggleSwitch = (g: pixi.Container, rail: Switch) => {
    ;[rail.exit, rail.otherExit] = [rail.otherExit, rail.exit]
    let h: any = g
    ;[h.children[0], h.children[2]] = [h.children[2], h.children[0]]

    clickSound.play()
  }

  const updateSwitchColor = (x: number, y: number) => {
    let rail = grid[y][x]
    if (rail?.type !== 'switch') {
      throw new Error('never, switch')
    }
    let color = theme.switch
    if (rail.mouseIsOver) {
      if (rail.trainCount > 0) {
        color = theme.switchHoverWithTrain
      } else {
        color = theme.switchHover
      }
    } else if (rail.trainCount > 0) {
      color = theme.switchWithTrain
    }
    let g = graphicalGrid[y][x]
    sketch.switchCircle(g?.children[1] as pixi.Graphics, color)
  }

  let interativeGraphicalSwitchArray: pixi.Container[] = []
  const makeSwitchInteractive = (g: pixi.Container, rail: Switch) => {
    g.interactive = true
    interativeGraphicalSwitchArray.push(g)
    g.hitArea = new pixi.Circle(
      layout.squareWidth / 2,
      layout.squareWidth / 2,
      layout.squareWidth / 2,
    )
    let toggle = () => toggleSwitch(g, rail)
    g.on('mousedown', toggle)
    g.on('tap', toggle)
    g.on('mouseover', () => {
      canvas.style.cursor = 'pointer'
      rail.mouseIsOver = true
      updateSwitchColor(rail.x, rail.y)
    })
    g.on('mouseout', () => {
      canvas.style.cursor = 'inherit'
      rail.mouseIsOver = false
      updateSwitchColor(rail.x, rail.y)
    })
  }

  level.railArray.map((track) => {
    let g: pixi.Container
    if (track.type === 'switch') {
      g = drawSwitch(track)
      makeSwitchInteractive(g, track)
    } else {
      g = drawTrack(track.entrance, track.exit!)
    }
    addPosition(g, track)

    graphicalGrid[track.y][track.x] = g
    railContainer.addChild(g)
  })

  // Manage the update speed
  let speedFactor = 1
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

  app.stage.addChild(gameContainer)
  gameContainer.addChild(railContainer)
  gameContainer.addChild(trainContainer)
  gameContainer.addChild(stationContainer)

  let trainManager = createTrainManager({
    colorList,
    container: trainContainer,
    grid,
    randomEngine,
    departure: level.departure,
    destinationArray: level.destinationArray,
    layout,
    sketch,
    config,
    score,
    updateSwitchColor,
  })

  const loop = () => {
    trainManager.update(speedFactor)
    requestAnimationFrame(loop)
  }
  loop()
}
