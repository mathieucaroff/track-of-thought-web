import { Position } from '../type'

function pairToPosition([x, y]: number[]): Position {
  return { x, y }
}

function addPosition(a: Position) {
  return (b: Position) => ({ x: a.x + b.x, y: a.y + b.y })
}

const SURROUNDING_FOUR = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
].map(pairToPosition)

const SURROUNDING_FIVE = [{ x: 0, y: 0 }, ...SURROUNDING_FOUR]

const SURROUNDING_NINE = [
  ...SURROUNDING_FIVE,
  ...[
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ].map(pairToPosition),
]
const SURROUNDING_THIRTEEN = [
  ...SURROUNDING_NINE,
  ...[
    [0, 2],
    [0, -2],
    [2, 0],
    [-2, 0],
  ].map(pairToPosition),
]

export function distance(a: Position, b: Position) {
  return distance2(a, b) ** 0.5
}

export function distance2(a: Position, b: Position) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
}

export function positionEqual(a: Position, b: Position) {
  return a.x === b.x && a.y === b.y
}

export function difference(a: Position, b: Position) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  }
}

export function surroundingFour(a: Position) {
  return SURROUNDING_FOUR.map(addPosition(a))
}

export function surroundingFive(a: Position) {
  return SURROUNDING_FIVE.map(addPosition(a))
}

export function surroundingNine(a: Position) {
  return SURROUNDING_NINE.map(addPosition(a))
}

export function surroundingThirteen(a: Position) {
  return SURROUNDING_THIRTEEN.map(addPosition(a))
}

export function surroundingSquare(radius: number, a: Position) {
  let result: Position[] = []
  Array.from({ length: 2 * radius - 1 }, (_, by) => {
    let y = by - radius
    Array.from({ length: 2 * radius - 1 }, (_, bx) => {
      let x = bx - radius
      result.push({ x: x + a.x, y: y + a.y })
    })
  })
  return result
}

export function surroundingDiamond(radius: number, a: Position) {
  return surroundingSquare(radius, a).filter(
    ({ x, y }) => Math.abs(x - a.x) + Math.abs(y - a.y) <= radius,
  )
}
