import { Level, Size } from './type'
import { Tile } from './type/tileType'

export function createEmptyGrid<T>(size) {
  return Array.from({ length: size.height }, () =>
    Array.from({ length: size.width }, () => null),
  ) as T[][]
}

export let getGrid = (level: Level, size: Size) => {
  let { departure, railArray, destinationArray } = level

  let grid = createEmptyGrid<Tile | null>(size)

  grid[departure.y][departure.x] = departure

  railArray.forEach((track) => {
    grid[track.y][track.x] = track
  })

  destinationArray.forEach((station) => {
    grid[station.y][station.x] = station
  })

  return grid
}
