import { lodash, random } from '../alias'
import { GeneratorAbortionError } from '../error'
import { createEmptyGrid } from '../grid'
import { Departure, Direction, Level, Position, Size, Tile } from '../type'
import { Destination, Rail, Switch } from '../type/tileType'
import { directionToDelta } from '../util/direction'
import { distance, distance2, surroundingSquare } from '../util/position'
import { trackIsTooLinear } from './check'
import { railwayConnection } from './connector'

export interface GeneratorConfig {
  randomEngine: random.Engine
  gridSize: Size
  retryCount: number
  stationCount: number
  departureClearance: number
}

function randomDeparture(config: GeneratorConfig): Departure {
  const x = random.picker([0, config.gridSize.width - 1])(config.randomEngine)
  const y = random.picker([1, config.gridSize.height - 2])(config.randomEngine)
  return {
    type: 'departure',
    x,
    y,
    exit: '<direction to be determined>' as Direction,
  }
}

export function generate(config: GeneratorConfig) {
  for (let k = 0; ; k++) {
    try {
      console.log('generating level')
      return coreGenerate(config)
    } catch (e) {
      if (e instanceof GeneratorAbortionError && k < config.retryCount) {
        continue
      }
      throw e
    }
  }
}

function isInGridBound(size: Size) {
  return ({ x, y }: Position) => 0 <= x && x < size.width && 0 <= y && y < size.height
}

function coreGenerate(config: GeneratorConfig): Level {
  const { randomEngine, gridSize, stationCount } = config

  // create an empty grid
  const grid: (Tile | null)[][] = createEmptyGrid(gridSize)

  let departure = randomDeparture(config)
  let destinationArray: Destination[] = []
  let railArray: Rail[] = []

  // Compute the base available options where we can place stations
  let optionCount = gridSize.width * gridSize.height
  let optionArray = Array.from({ length: optionCount }, (_, k) => k)
  let betterOptionArray: number[] = []
  // we make the borders more likely to be picked as station position
  optionArray.forEach((positionNumber) => {
    let x = positionNumber % gridSize.width
    let y = Math.floor(positionNumber / gridSize.width)
    if (x === 0 || x === gridSize.width - 1 || y === 0 || y === gridSize.height - 1) {
      betterOptionArray.push(positionNumber)
    }
  })
  optionArray.push(...betterOptionArray, ...betterOptionArray)
  // we remove all the positions too close from the start
  let startSurrounding = surroundingSquare(config.departureClearance + 1, departure).filter(
    isInGridBound(config.gridSize),
  )
  lodash.pull(optionArray, ...startSurrounding.map(({ x, y }) => y * gridSize.width + x))

  // Place `stationCount` stations, one after the other
  for (let k = 0; k < stationCount; k++) {
    const positionNumber = random.picker(optionArray)(randomEngine)
    lodash.pull(optionArray, positionNumber)
    let x = positionNumber % gridSize.width
    let y = Math.floor(positionNumber / gridSize.width)
    let entrance = '<direction to be determined>' as Direction
    const destination: Destination = { type: 'destination', colorIndex: k, x, y, entrance }

    grid[y][x] = destination

    destinationArray.push(destination)
  }

  const addRailway = (railway: Rail[]) => {
    railArray.push(...railway)
    railway.forEach((rail) => {
      grid[rail.y][rail.x] = rail
    })
  }

  // For the first destination station, create the track needed to connect it to the departure station
  let { railway, exit, entrance } = railwayConnection(grid, departure, destinationArray[0])
  addRailway(railway)
  destinationArray[0].entrance = entrance
  departure.exit = exit

  // Then for each remaining station, add the tracks and switches needed to connect it to the railway
  for (let destination of destinationArray.slice(1)) {
    // Determine the set of rail tiles that we are allowed to connect to
    let reachableRailArray: Tile[] = railArray.filter(
      (rail) => rail.type === 'track' && distance(rail, departure) >= config.departureClearance,
    )
    if (reachableRailArray.length < 1) {
      throw new GeneratorAbortionError('no reachable rail')
    }

    let closestRail = lodash.minBy(
      reachableRailArray,
      (track) => distance2(track, destination) + random.real(0, 1)(randomEngine),
    )!
    let { railway, exit, entrance } = railwayConnection(grid, closestRail, destination)
    addRailway(railway)
    destination.entrance = entrance
    // transform the junction point from track to switch
    let { x, y, entrance: e } = [destination, ...railway].slice(-1)[0]
    let { dx, dy } = directionToDelta(e)
    let junction = grid[y + dy][x + dx] as Switch
    if (distance(junction, departure) < config.departureClearance) {
      throw new GeneratorAbortionError('switch too close to the start station')
    }
    junction.type = 'switch'
    junction.trainArray = []
    junction.otherExit = exit
    junction.mouseIsOver = false
  }

  if (trackIsTooLinear(departure, grid, gridSize.width + gridSize.height - 3)) {
    throw new GeneratorAbortionError('track is too linear')
  }

  return {
    departure,
    destinationArray,
    railArray,
  }
}
