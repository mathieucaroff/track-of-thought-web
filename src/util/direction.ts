import { Direction, Position } from '../type'
import { difference } from './position'

export const DIRECTION_ARRAY: Direction[] = ['bottom', 'left', 'right', 'top']

export function oppositeOf(direction: Direction): Direction {
  return {
    bottom: 'top' as const,
    left: 'right' as const,
    right: 'left' as const,
    top: 'bottom' as const,
  }[direction]
}

export function directionToDelta(direction: Direction) {
  return {
    bottom: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
    top: { dx: 0, dy: -1 },
  }[direction]
}

export let isStraight = (a: Direction, b: Direction) => {
  let [c, d] = [a, b].sort()
  let e = c + d
  return e === 'bottomtop' || e === 'leftright'
}

export function moveDirectionArray(from: Position, to: Position): Direction[] {
  const vector = difference(to, from)
  let directionArray: Direction[] = []
  const topBottom = () => {
    if (vector.y <= 0) {
      directionArray.push('top')
    }
    if (vector.y >= 0) {
      directionArray.push('bottom')
    }
  }

  const leftRight = () => {
    if (vector.x <= 0) {
      directionArray.push('left')
    }
    if (vector.x >= 0) {
      directionArray.push('right')
    }
  }

  if (Math.abs(vector.y) >= Math.abs(vector.x)) {
    topBottom()
    leftRight()
  } else {
    leftRight()
    topBottom()
  }
  return directionArray
}
