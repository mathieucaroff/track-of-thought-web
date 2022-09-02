import { LevelObject, StationEntry, TrackEntry } from './type'

export interface Grid extends LevelObject {
  content: (TrackEntry | StationEntry | undefined)[][]
  start: StationEntry
}

export let createGrid = (levelObject: LevelObject): Grid => {
  let content: Grid['content'] = Array.from({ length: 9 }, () => Array.from({ length: 14 }))
  levelObject.tracks.forEach((track) => {
    content[track.row][track.column] = track
  })
  levelObject.stations.forEach((station) => {
    content[station.row][station.column] = station
  })
  // get the startpoint
  let start: StationEntry | undefined = undefined
  let stations = levelObject.stations.filter((s) => {
    if (s.type === 'start') {
      if (start !== undefined) {
        throw new Error(`the level contains more than one start point`)
      }
      start = s
      return false
    }
    return true
  })
  if (start === undefined) {
    throw new Error(`the level does not contain a start point`)
  }
  return {
    ...levelObject,
    stations,
    content,
    start,
  }
}
