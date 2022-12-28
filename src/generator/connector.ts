/**
 * connector, walk through a grid to connect one location to anther
 */

import { GeneratorAbortionError } from '../error'
import { Direction, Position, Rail, Tile } from '../type'
import { Track } from '../type/tileType'
import { directionToDelta, moveDirectionArray, oppositeOf } from '../util/direction'
import { positionEqual } from '../util/position'

function isDirectionValid(grid: (Tile | null)[][], cursor: Position, target: Position, track: any) {
  return (direction) => {
    if (direction === track?.exit) {
      return false
    }
    let { dx, dy } = directionToDelta(direction)
    let tile = grid[cursor.y + dy]?.[cursor.x + dx]
    if (cursor.x + dx === target.x && cursor.y + dy === target.y) {
      return true
    }
    if (tile === undefined) {
      // we are outside of the grid
      return false
    }
    if (tile === null || tile.type === 'track') {
      return true // break out of bestMoveDirectionArray().some
    }
    return false
  }
}

/**
 * railwayConnection, produce the rails to connect a location to anther on the grid
 * the connections are created form the destination to the start
 */
export function railwayConnection(grid: (Tile | null)[][], start: Tile, destination: Tile) {
  let railway: Rail[] = []
  let entrance = '<direction to be determined>' as Direction

  let cursor = { x: destination.x, y: destination.y }
  let target = { x: start.x, y: start.y }
  let track: Track | null = null

  const CURSOR_LOOP_LIMIT = 100 + grid.length + grid[0].length
  for (let k = 0; k < CURSOR_LOOP_LIMIT; k++) {
    // determine a valid direction
    let [direction] = moveDirectionArray(cursor, target).filter(
      isDirectionValid(grid, cursor, target, track),
    )
    if (direction === undefined) {
      throw new GeneratorAbortionError('cannot find a direction to continue the track')
    }

    // write the entrance of the current track, before switching to the next tile
    if (k > 0) {
      railway.slice(-1)[0].entrance = direction
    } else {
      entrance = direction
    }

    // move the cursor
    let { dx, dy } = directionToDelta(direction)
    cursor.x += dx
    cursor.y += dy

    if (positionEqual(cursor, target) || grid[cursor.y][cursor.x]?.type === 'track') {
      return { railway, entrance, exit: oppositeOf(direction) }
    }

    // add the rail
    track = {
      type: 'track',
      entrance: '<direction to be determined>' as Direction,
      exit: oppositeOf(direction),
      x: cursor.x,
      y: cursor.y,
    }
    railway.push(track)
  }
  throw new Error('reached the loop limit while connecting a station to the railway')
}
