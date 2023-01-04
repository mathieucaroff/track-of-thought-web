import { Direction, Tile } from '../type'
import { Switch } from '../type/tileType'
import { directionToDelta } from './direction'

export function nextTile(tile: Tile, direction: Direction, grid: (Tile | null)[][]) {
  let { dx, dy } = directionToDelta(direction)
  let next = grid[tile.y + dy][tile.x + dx]
  if (!next) {
    throw new Error('never, null tile')
  }
  return next
}
