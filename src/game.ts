import { pixi, random } from './alias'

import { clickSound } from './audio/sound'
import { defaultColorList, interpolateColor, parseColorList } from './color'
import { generate } from './generator/generator'
import { createEmptyGrid, getGrid } from './grid'
import { parseLayout } from './layout'
import { TrackOfThoughtConfig } from './main'
import { create } from './lib/create'
import { createScore } from './score'
import { createSketcher } from './sketch'
import { getSmartSwitchGrid } from './tools/smartSwitchGrid'
import { createTrainManager } from './train'
import { Direction, Position } from './type'
import { Switch } from './type/tileType'
import { isStraight } from './util/direction'

export interface GameNavigation {
  // leave the game and go back to the level selection menu
  onMenu: () => void
  // start a new game at the same level
  onReplay: () => void
}

export interface Game {
  // stop the game and remove everything it added to the page
  destroy: () => void
}

export async function setupGame(
  config: TrackOfThoughtConfig,
  navigation: GameNavigation,
): Promise<Game> {
  const layout = parseLayout(config.layout)
  console.info('layout', layout)

  document.body.classList.add('gamemode')

  const sketch = createSketcher(layout, config.theme, config.showColorIndices)

  const colorList = parseColorList(config.colorList)
  const colorListBaseLength = colorList.length
  if (colorList.length < config.stationCount) {
    const colorSet = new Set(colorList)
    defaultColorList.forEach((color) => {
      if (!colorSet.has(color)) {
        colorList.push(color)
        colorSet.add(color)
      }
    })
    console.warn("There's not enough colors in the list for the number of stations")
    if (colorList.length > colorListBaseLength) {
      console.warn('Colors from the default set have been added')
    }
  }

  const level = generate({
    gridSize: { height: config.gridHeight, width: config.gridWidth },
    randomEngine: random.MersenneTwister19937.seed(config.stationSeed),
    stationCount: config.stationCount,
    retryCount: config.generateRetryCount,
    departureClearance: config.departureClearance,
  })

  console.info('level', level)
  console.info(`&seed=${config.seed}`)

  const grid = getGrid(level, {
    width: config.gridWidth,
    height: config.gridHeight,
  })

  const onGameEnd = () => {
    interativeGraphicalSwitchArray.forEach((g) => {
      g.eventMode = 'none'
    })
    canvas.style.cursor = 'inherit'
    menuButton.remove()
    score.showScore([
      { label: 'Play again', onClick: navigation.onReplay },
      { label: 'Go to Menu', onClick: navigation.onMenu },
    ])
  }

  const score = createScore(document.body, layout, config.theme)

  const menuButton = create('button', {
    className: 'gameButton gameMenuButton',
    textContent: 'Back to Menu',
    title: 'Back to the level selection (Escape)',
    onclick: navigation.onMenu,
  })
  document.body.appendChild(menuButton)

  const graphicalGrid = createEmptyGrid<pixi.Container | null>({
    width: config.gridWidth,
    height: config.gridHeight,
  })

  // inner disc of each switch, whose tint is used to show the switch color
  const switchInnerGrid = createEmptyGrid<pixi.Graphics | null>({
    width: config.gridWidth,
    height: config.gridHeight,
  })

  const smartSwitchGrid = getSmartSwitchGrid(config, level, grid)

  let app = new pixi.Application()
  await app.init({
    antialias: true,
    resizeTo: window,
    background: config.theme.background,
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
  let g = sketch.station(level.departure, 0, [config.theme.departure])
  addPosition(g, level.departure)
  stationContainer.addChild(g)

  graphicalGrid[level.departure.y][level.departure.x] = g

  // Draw destination stations
  level.destinationArray.forEach((station, k) => {
    let colorIndex = k
    let g = sketch.station(station, colorIndex, colorList)
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
    let circle = sketch.switchCircle(config.theme.switch)
    result.addChild(circle.container)
    result.addChild(drawTrack(track.entrance, track.exit))
    switchInnerGrid[track.y][track.x] = circle.inner
    return result
  }
  const toggleSwitch = (g: pixi.Container, rail: Switch) => {
    rail.state = rail.state === 'initial' ? 'swapped' : 'initial'
    ;[rail.exit, rail.otherExit] = [rail.otherExit, rail.exit]
    // use swapChildren so that pixi knows the render order has changed
    g.swapChildren(g.children[0], g.children[2])

    clickSound.play()
  }

  const getSwitchColor = interpolateColor(config.theme.switch, config.theme.switchWithTrain)
  const getSwitchHoverColor = interpolateColor(
    config.theme.switchHover,
    config.theme.switchHoverWithTrain,
  )

  const updateSwitchColor = (x: number, y: number) => {
    let rail = grid[y][x]
    if (rail?.type !== 'switch') {
      throw new Error('never, switch')
    }
    let bestTrainProgress = rail.trainArray.reduce((best, train) => {
      return Math.max(best, train.progress)
    }, 0)
    let color = (rail.mouseIsOver ? getSwitchHoverColor : getSwitchColor)(bestTrainProgress)
    let inner = switchInnerGrid[y][x]!
    // tint is a cheap property change, and pixi ignores it when unchanged
    inner.tint = color
  }

  let interativeGraphicalSwitchArray: pixi.Container[] = []
  const makeSwitchInteractive = (g: pixi.Container, rail: Switch) => {
    g.eventMode = 'static'
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

  level.railArray.forEach((track) => {
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
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      speedFactor = 3
    } else if (event.key === 'Escape') {
      navigation.onMenu()
    }
  }
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      speedFactor = 1
    }
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  app.stage.addChild(gameContainer)
  gameContainer.addChild(railContainer)
  gameContainer.addChild(trainContainer)
  gameContainer.addChild(stationContainer)

  let trainManager = createTrainManager({
    colorList,
    config,
    container: trainContainer,
    departure: level.departure,
    destinationArray: level.destinationArray,
    graphicalGrid,
    grid,
    layout,
    onGameEnd,
    randomEngine: random.MersenneTwister19937.seed(config.trainSeed),
    score,
    sketch,
    smartSwitchGrid,
    toggleSwitch,
    updateSwitchColor,
  })

  let lastTime = Date.now()
  let animationFrameId = 0
  const loop = () => {
    let elapsedTime = Date.now() - lastTime
    lastTime += elapsedTime
    // We limit the time value to avoid issues where the tab is no longer
    // visible and thus requestAnimationFrame stops firing, but performance.now()
    // keeps increasing
    let clampedTime = Math.min(1, elapsedTime / 20)
    trainManager.update(speedFactor * clampedTime)
    animationFrameId = requestAnimationFrame(loop)
  }
  loop()

  return {
    destroy: () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      menuButton.remove()
      score.destroy()
      // removes the canvas from the page and frees the GPU resources
      app.destroy({ removeView: true }, { children: true })
      document.body.classList.remove('gamemode')
    },
  }
}
