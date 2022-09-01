import { LevelObject, StationEntry, TrackEntry } from './type'

export interface Grid extends LevelObject {
  content: (TrackEntry | StationEntry | undefined)[][]
}

export let createGrid = (levelObject: LevelObject): Grid => {
  let content: Grid['content'] = Array.from({ length: 9 }, () => Array.from({ length: 14 }))
  levelObject.tracks.forEach((track) => {
    content[track.row][track.column] = track
  })
  levelObject.stations.forEach((station) => {
    content[station.row][station.column] = station
  })
  return {
    ...levelObject,
    content,
  }
}
