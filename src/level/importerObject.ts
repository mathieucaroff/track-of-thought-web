import { GridPosition } from '../type'
import { pathGroup } from './levelImporter'

export type Direction = 'top' | 'bottom' | 'left' | 'right'

export interface LevelObject {
  name: string
  balls: { amount: number }
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
  switch: 'true' | 'false'
}

export interface ImporterObject {
  [levelNumber: string]: {
    [alternativeNumber: string]: () => Promise<LevelObject>
  }
}

let importerObject: ImporterObject = {}

Object.entries(pathGroup).forEach(([name, importer]) => {
  let [levelNumber, alternativeNumber] = name.split('-')
  importerObject[levelNumber] = importerObject[levelNumber] || {}
  importerObject[levelNumber][alternativeNumber] = importer as any as () => Promise<LevelObject>
})

export { importerObject }
