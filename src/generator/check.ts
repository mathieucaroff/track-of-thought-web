import { Departure, Tile } from '../type'
import { nextTile } from '../util/nextTile'
import { isRail } from '../util/tile'

export function trackIsTooLinear(
  departure: Departure,
  grid: (Tile | null)[][],
  maximumTrackLength: number,
) {
  let tile = nextTile(departure, departure.exit, grid)
  if (!isRail(tile)) {
    throw new Error('never, not rail tile')
  }
  return longestTrack(tile, grid) > maximumTrackLength
}

function longestTrack(tile: Tile, grid: (Tile | null)[][]) {
  if (!isRail(tile)) {
    return 0
  }
  if (tile.type === 'track') {
    return 1 + longestTrack(nextTile(tile, tile.exit, grid), grid)
  }
  return (
    1 +
    Math.max(
      longestTrack(nextTile(tile, tile.exit, grid), grid),
      longestTrack(nextTile(tile, tile.otherExit, grid), grid),
    )
  )
}
