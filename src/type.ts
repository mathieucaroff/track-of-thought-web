export type Kind<TName extends string, TProperties extends {} = {}> = TProperties & { kind: TName }

export type Direction = 'top' | 'bottom' | 'left' | 'right'

export interface Size {
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}

export type GridPosition = {
  column: number
  row: number
}

export interface LevelObject {
  name: string
  balls: { amount: number }
  stations: StationEntry[]
  tracks: TrackEntry[]
}

export interface Grid extends LevelObject {
  content: (TrackEntry | StationEntry | undefined)[][]
  start: StationEntry
}

export interface StationEntry extends GridPosition {
  type: 'start' | 'normal'
  exit: Direction
  color: string
  trainCount: number
  redraw?: () => void
}

export interface TrackEntry extends GridPosition {
  type: 'straight' | 'curved'
  start: Direction
  end1: Direction
  end2: Direction
  color: string
  switch: 'true' | 'false'
  trainCount: number
  redraw?: () => void
}

export interface ImporterObject {
  [levelNumber: string]: {
    [alternativeNumber: string]: () => Promise<LevelObject>
  }
}
