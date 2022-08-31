import { pathGroup } from './levelImporter'

export type Direction = 'top' | 'bottom' | 'left' | 'right'

export type GridPosition = {
  column: number
  row: number
}

export interface LevelObject {
  stations: StationEntry[]
  tracks: TrackEntry[]
}

export interface StationEntry extends GridPosition {
  type: 'start' | 'normal'
  exit: Direction
  color: string
}

export interface TrackEntry extends GridPosition {
  type: 'straight' | 'curved'
  start: Direction
  end1: Direction
  end2: Direction
  color: string
}

export interface ImporterObject {
  [levelNumber: string]: {
    [alternativeNumber: string]: typeof pathGroup[keyof typeof pathGroup]
  }
}

let importerObject: ImporterObject = {}

Object.entries(pathGroup).forEach(([name, importer]) => {
  let [levelNumber, alternativeNumber] = name.split('-')
  importerObject[levelNumber] = importerObject[levelNumber] || {}
  importerObject[levelNumber][alternativeNumber] = importer
})

export { importerObject }
