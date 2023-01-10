import { pixi, random } from './alias'
import { Layout } from './layout'
import { TrackOfThoughtConfig } from './main'
import { Score } from './score'
import { Sketcher } from './sketch'
import { SmartSwitch } from './tools/smartSwitchGrid'
import { Direction, Position, Tile } from './type'
import { Departure, Destination, Rail, Switch } from './type/tileType'
import { directionToDelta, isStraight, oppositeOf } from './util/direction'
import { isRail, isStation } from './util/tile'

export interface TrainManagerParam {
  colorList: number[]
  config: TrackOfThoughtConfig
  container: pixi.Container
  departure: Departure
  destinationArray: Destination[]
  grid: (Tile | null)[][]
  layout: Layout
  randomEngine: random.Engine
  score: Score
  sketch: Sketcher
  updateSwitchColor: (x: number, y: number) => void
  smartSwitchGrid: (SmartSwitch | null)[][]
  graphicalGrid: (pixi.Container | null)[][]
  toggleSwitch: (g: pixi.Container, rail: Switch) => void
}

export function createTrainManager(param: TrainManagerParam) {
  const {
    colorList,
    config,
    container,
    departure,
    destinationArray,
    grid,
    layout,
    randomEngine,
    score,
    sketch,
    updateSwitchColor,
    smartSwitchGrid,
    graphicalGrid,
    toggleSwitch,
  } = param

  const { duration, trainCount } = config

  let trainArray: Train[] = []

  let trainPeriod = duration / trainCount
  let trainTime = 0

  let sentTrainCount = 0

  const addTrain = () => {
    while (sentTrainCount < trainCount && trainTime >= trainPeriod) {
      trainTime -= trainPeriod

      let train = createTrain({
        colorIndex: random.pick(randomEngine, destinationArray).colorIndex,
        colorList,
        grid,
        position: departure,
        layout,
        sketch,
        updateSwitchColor,
        smartSwitchGrid,
        graphicalGrid,
        toggleSwitch,
        autoPlay: config.autoPlay,
      })
      container.addChild(train.g)
      trainArray.push(train)

      train.progress += trainTime

      sentTrainCount += 1
    }
  }

  return {
    update(timeStep: number) {
      trainTime += timeStep / 60
      addTrain()

      // remove the trains which have reached a station
      trainArray = trainArray.filter((train) => {
        if (!train.running) {
          score.trainArrival(train.colorMatchesStation())

          container.removeChild(train.g)
          train.g.destroy()
          return false
        }
        return true
      })

      // update the trains
      trainArray.forEach((train) => {
        train.update(timeStep)
      })
    },
  }
}

export interface TrainParam {
  position: Position
  grid: (Tile | null)[][]
  colorList: number[]
  colorIndex: number
  layout: Layout
  sketch: Sketcher
  updateSwitchColor: (x: number, y: number) => void
  smartSwitchGrid: (SmartSwitch | null)[][]
  graphicalGrid: (pixi.Container | null)[][]
  toggleSwitch: (g: pixi.Container, rail: Switch) => void
  autoPlay: boolean
}

export function createTrain(param: TrainParam) {
  let position = { ...param.position }
  let {
    grid,
    colorList,
    colorIndex,
    layout,
    sketch,
    updateSwitchColor,
    smartSwitchGrid,
    graphicalGrid,
    toggleSwitch,
    autoPlay,
  } = param

  let g = sketch.train(colorIndex, colorList)

  const next = () => {
    let { x, y } = position
    let track = param.grid[y][x]
    if (!track) {
      throw new Error(`encountered a null entry in the grid, at ${y}:${x}`)
    }
    if (track.type === 'destination') {
      throw new Error('never, destination')
    }

    let { dx, dy } = directionToDelta(track.exit)
    position.x += dx
    position.y += dy
  }
  const bumpSwitchTrainCount = (amount: number) => {
    let { x, y } = position
    let tile = grid[y][x]
    if (tile?.type === 'switch') {
      tile.trainCount += amount
      updateSwitchColor(x, y)
    }
  }
  const update = (timeStep: number) => {
    me.progress += timeStep / 80
    if (me.progress > 1) {
      if (autoPlay) {
        setSwitch()
      }
      bumpSwitchTrainCount(-1)
      while (me.progress > 1) {
        next()
        me.progress -= 1
      }
      bumpSwitchTrainCount(1)
      if (autoPlay) {
        // we've just arrived on the tile, so we aren't in a hurry to set it to
        // the right direction, so use the weak mode so that if there is already
        // a train on the switch, the switch won't be toggled.
        let weak = true
        setSwitch(weak)
      }
    }
    updatePosition()
    if (grid[position.y][position.x]?.type === 'destination' && me.progress >= 0.5) {
      me.running = false
    }
  }
  // in autoplay mode, toggle the switch if necessary for the train to reach its
  // destination
  const setSwitch = (weak = false) => {
    let { x, y } = position
    let tile = grid[y][x]
    if (tile?.type === 'switch') {
      if (weak && tile.trainCount > 1) {
        return
      }
      let smartSwitch = smartSwitchGrid[y][x]!
      let colorArray =
        tile.state === 'initial' ? smartSwitch.colorIndexArray : smartSwitch.colorIndexOtherArray
      if (colorArray.includes(me.colorIndex)) {
        let g = graphicalGrid[y][x]!
        toggleSwitch(g, tile)
      }
    }
  }

  const updatePosition = () => {
    // Move to the tile position
    g.x = layout.squareWidth * position.x
    g.y = layout.squareWidth * position.y

    let tile = grid[position.y][position.x]!

    let entrance: Direction
    let exit: Direction
    if (isRail(tile)) {
      ;({ entrance, exit } = tile)
    } else if (tile.type === 'departure') {
      ;({ exit } = tile)
      entrance = oppositeOf(exit)
    } else if (tile.type === 'destination') {
      ;({ entrance } = tile)
      exit = oppositeOf(entrance)
    } else {
      throw new Error('never')
    }

    if (isStraight(entrance, exit)) {
      if (exit === 'right') {
        g.x += (me.progress - 0.5) * layout.squareWidth
      } else if (exit === 'left') {
        g.x += (0.5 - me.progress) * layout.squareWidth
      } else if (exit === 'bottom') {
        g.y += (me.progress - 0.5) * layout.squareWidth
      } else if (exit === 'top') {
        g.y += (0.5 - me.progress) * layout.squareWidth
      }
    } else {
      let from = ((Math.sin((me.progress * Math.PI) / 2) - 1) * layout.squareWidth) / 2
      let to = ((Math.cos((me.progress * Math.PI) / 2) - 1) * layout.squareWidth) / 2
      if (entrance === 'top') g.y += from
      if (entrance === 'left') g.x += from
      if (entrance === 'right') g.x -= from
      if (entrance === 'bottom') g.y -= from

      if (exit === 'top') g.y += to
      if (exit === 'left') g.x += to
      if (exit === 'right') g.x -= to
      if (exit === 'bottom') g.y -= to
    }
  }

  const colorMatchesStation = () => {
    let s = grid[position.y][position.x]
    if (!s || !isStation(s)) {
      throw new Error('train is not at a station')
    }
    return me.colorIndex === (s as any).colorIndex
  }

  let me = {
    g,
    running: true,
    progress: 0.5,
    colorIndex,
    update,
    colorMatchesStation,
  }

  update(0)

  return me
}

type Train = ReturnType<typeof createTrain>
