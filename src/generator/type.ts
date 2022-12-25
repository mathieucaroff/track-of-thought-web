export type Has<TName extends string, TValue> = { [name in TName]: TValue }

export type Direction = 'top' | 'bottom' | 'left' | 'right'

export interface Size {
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}

export interface Start extends Position {
  exit: Direction
}

export interface Level {
  trainCount: number
  start: Start
  stationArray: Slate[]
  trackArray: Slate[]
}

export interface Slate extends Position {
  entrance: Direction
  exit?: Direction
  otherExit?: Direction
}

export type Grid = (Slate | null)[][]
