import * as lodash from 'lodash'
import * as random from 'random-js'
import { MINIMAL_START_DISTANCE } from '../constants'
import { GeneratorAbortionError } from './error'
import { isSimpleTrack } from './slate'
import { Direction, Has, Level, Position, Size, Slate, Start } from './type'
import { bestMoveDirectionArray, directionToDelta, oppositeOf } from './util/direction'
import { distance, distance2, positionEqual, surroundingSquare } from './util/position'

export interface GeneratorConfig {
  trainCount: number
  randomEngine: random.Engine
  gridSize: Size
  retryCount: number
  stationCount: number
  sortStationArray: boolean
}

function randomStart(config: GeneratorConfig): Position {
  const x = random.picker([0, config.gridSize.width - 1])(config.randomEngine)
  const y = random.picker([1, config.gridSize.height - 2])(config.randomEngine)
  return { x, y }
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
  const { trainCount, randomEngine, gridSize, stationCount } = config

  let start: Start = { ...randomStart(config), exit: 'right' }

  const grid: (Slate | null)[][] = Array.from({ length: gridSize.height }, () =>
    Array.from({ length: gridSize.width }, () => null),
  )

  const optionCount = gridSize.width * gridSize.height
  const optionArray = Array.from({ length: optionCount }, (_, k) => k)

  const startSurrounding = surroundingSquare(MINIMAL_START_DISTANCE + 1, start).filter(
    isInGridBound(config.gridSize),
  )

  lodash.pull(optionArray, ...startSurrounding.map(({ x, y }) => y * gridSize.width + x))

  let stationArray: (Slate & Has<'squaredDistanceToStart', number>)[] = Array.from(
    { length: stationCount },
    () => {
      const stationNumber = random.picker(optionArray)(randomEngine)
      lodash.pull(optionArray, stationNumber)
      const x = stationNumber % gridSize.width
      const y = Math.floor(stationNumber / gridSize.width)
      const station: Slate & Has<'squaredDistanceToStart', number> = {
        x,
        y,
        entrance: '<direction to be determined>' as Direction,
        squaredDistanceToStart: distance2({ x, y }, start),
      }

      grid[y][x] = station

      return station
    },
  )

  if (config.sortStationArray) {
    stationArray = lodash.sortBy(stationArray, (station) => -station.squaredDistanceToStart)
  }

  const trackArray: Slate[] = []

  stationArray.forEach((station, k) => {
    // find the closest track to the station
    // - exclude the tracks which are already switches
    // - exclude the tracks which are close to the start slate
    let reachableTrackArray: Position[] = trackArray.filter(
      (track) =>
        !(track.exit && track.otherExit) && distance(track, start) > MINIMAL_START_DISTANCE,
    )
    // for the first station, the only possible junction point is the start
    if (k === 0) {
      reachableTrackArray = [start]
    }

    if (reachableTrackArray.length === 0) {
      throw new GeneratorAbortionError('reachableTrackArray is empty')
    }

    let closest = lodash.minBy(reachableTrackArray, (track) => distance2(track, station))!
    if (!closest) {
      throw new Error('never')
    }

    let cursor = {
      x: station.x,
      y: station.y,
    }

    // try to create all the tracks needed to go from the closest track to the station
    // we move the cursor from the station to the closest point
    let m = 0
    const LIMIT = 100
    for (; m < LIMIT; m++) {
      // determine a valid direction
      let bestDirection = '' as Direction
      let lastTrack = grid[cursor.y][cursor.x]!
      let foundADirection = bestMoveDirectionArray(cursor, closest).some((direction) => {
        if (direction === lastTrack.exit) {
          return false
        }
        let { dx, dy } = directionToDelta(direction)
        let slate = grid[cursor.y + dy]?.[cursor.x + dx]
        if (cursor.x + dx === closest.x && cursor.y + dy === closest.y) {
          bestDirection = direction
          return true
        }
        if (slate === undefined) {
          // we are outside of the grid
          return false
        }
        if (slate === null || isSimpleTrack(slate)) {
          bestDirection = direction
          return true // break out of bestMoveDirectionArray().some
        }
        return false
      })
      if (!foundADirection) {
        throw new GeneratorAbortionError('cannot find a direction to continue the track')
      }

      lastTrack.entrance = bestDirection
      if (lastTrack.entrance === lastTrack.exit || lastTrack.entrance === lastTrack.otherExit) {
        console.log('lastTrack', k, lastTrack, station)
        const level: Level = {
          trainCount,
          start,
          stationArray,
          trackArray,
        }

        return level
      }
      let { dx, dy } = directionToDelta(bestDirection)
      cursor.x += dx
      cursor.y += dy

      if (positionEqual(cursor, closest)) {
        if (k == 0) {
          start = {
            ...start,
            exit: oppositeOf(bestDirection),
          }
          grid[start.y][start.x] = start as Slate
        }
        grid[cursor.y][cursor.x]!.otherExit = oppositeOf(bestDirection)
        break
      } else if (
        grid[cursor.y][cursor.x] !== null &&
        grid[cursor.y][cursor.x]?.exit &&
        !grid[cursor.y][cursor.x]!.otherExit
      ) {
        if (distance(cursor, start) <= MINIMAL_START_DISTANCE) {
          throw new GeneratorAbortionError('switch too close to the start station')
        }
        // transform this track into a switch
        grid[cursor.y][cursor.x]!.otherExit = oppositeOf(bestDirection)
        break
      }

      const track: Slate = {
        x: cursor.x,
        y: cursor.y,
        exit: oppositeOf(bestDirection),
        entrance: '<direction to be determined>' as Direction,
      }
      trackArray.push(track)
      grid[cursor.y][cursor.x] = track

      // for the first station, the only possible junction point is the start
      if (k === 0) {
        grid[start.y][start.x] = start as Slate
      }
    }
    if (m >= LIMIT) {
      console.error(trackArray)
      throw new Error('reached the loop limit while creating a track')
    }
  })

  const level: Level = {
    trainCount,
    start,
    stationArray,
    trackArray,
  }

  return level
}
