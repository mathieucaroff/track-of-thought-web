/**
 * Level generation
 *
 * Parameters:
 * - available area (width and height)
 * - number of stations
 *
 * The level generator first chooses a corner where the train spawn
 * will be placed. It then picks a random location for a station. Then,
 * it builds a direct road from the station to the spawn. Then it loops
 * to picking another place for another station until all the stations
 * are placed.
 *
 * If there is no way to finish generating the level, the generator may
 * throw.
 */

import { Kind, Position, Size } from '../type'

export type Road =
  | Kind<'verticalRoad'>
  | Kind<'horizontalRoad'>
  | Kind<'turnA'>
  | Kind<'turnB'>
  | Kind<'turnC'>
  | Kind<'turnD'>

export type Empty = Kind<'empty'>

export type Spawn = Kind<'spawn'>

export type Switch = Kind<'switch', { a: Road; b: Road }>

export type Station = Kind<'station', { color: number }>

export type SquareContent = Empty | Road | Spawn | Switch | Station

export interface Level {
  grid: Array<Array<SquareContent>>
}

class RandomPositionManager {
  // for efficiency, indices represent a position's y and x:
  // y = n // area.width
  // x = n % area.width
  positionList: boolean[]
  totalAvailable: number
  constructor(public area: Size) {
    this.positionList = Array.from({ length: area.height * area.width }, (_, k) => false)
    this.totalAvailable = this.positionList.length
  }
  randomPosition(): Position {
    if (this.totalAvailable < 1) {
      throw new Error('Ran out of available positions')
    }
    let p = Math.floor(this.totalAvailable * Math.random())
    let m
    for (let k = 0; k < this.positionList.length; k++) {
      if (!this.positionList[k]) p--
      if (p < 0) {
        m = k
        break
      }
    }
    if (m === undefined) {
      throw new Error() // This should not happen -> integrity has been breached
    }
    let { width } = this.area
    return {
      y: Math.floor(m / width),
      x: m % width,
    }
  }
  usePosition(position: Position) {
    let p = position.y * this.area.width + position.x
    if (this.positionList[p]) {
      throw new Error(`position x:${position.x},y:${position.y} is already used`)
    }
    this.positionList[p] = true
    this.totalAvailable -= 1
  }
}

export function generate(area: Size, stationCount: number) {
  let level: Level = {
    grid: Array.from({ length: area.height }, () =>
      Array.from({ length: area.width }, (): Empty => ({ kind: 'empty' })),
    ),
  }

  let randomPositionManager = new RandomPositionManager(area)

  for (let k = 0; k < stationCount; k++) {
    let position = randomPositionManager.randomPosition()
    randomPositionManager.usePosition(position)
    level.grid[position.y][position.x] = {
      kind: 'station',
      color: Math.floor(Math.random() * 0x1000000),
    }
    ;(
      ['horizontalRoad', 'turnA', 'turnB', 'turnC', 'turnD', 'verticalRoad'] as Road['kind'][]
    ).forEach((kind) => {
      let position = randomPositionManager.randomPosition()
      randomPositionManager.usePosition(position)
      level.grid[position.y][position.x] = { kind }
    })
  }

  return level
}
