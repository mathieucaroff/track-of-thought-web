import { LevelObject } from '../type'
import { generate as generateImplementation, GeneratorConfig } from './generator'
import { isSwitch } from './slate'
import { Slate } from './type'
import { isStraight } from './util/direction'

function getType(track: Slate) {
  return isStraight(track.entrance, track.exit!) ? 'straight' : 'curved'
}

export const oldColorList = [
  'blue',
  'green',
  'red',
  'cyan',
  'orange',
  'pink',
  'yellow',
  'blue + o',
  'cyan + o',
  'green + o',
  'orange + o',
  'yellow + o',
  'black',
  'pink + o',
  'red + o',
]

export function generate(param: GeneratorConfig): LevelObject {
  let level = generateImplementation(param)

  let { start } = level

  return {
    balls: { amount: param.trainCount },
    name: 'level',
    stations: [
      ...level.stationArray.map((station, k) => ({
        color: oldColorList[k],
        column: station.x,
        row: station.y,
        start: station.entrance,
        type: 'normal' as const,
        exit: station.entrance,
        trainCount: 0,
      })),
      {
        color: 'black',
        column: start.x,
        row: start.y,
        exit: start.exit!,
        trainCount: 0,
        type: 'start' as const,
      },
    ],
    tracks: level.trackArray.map((track) => ({
      end1: track.exit!,
      end2: track.otherExit!,
      start: track.entrance,
      type: getType(track),
      color: '',
      switch: isSwitch(track) ? 'true' : 'false',
      column: track.x,
      row: track.y,
      trainCount: 0,
    })),
  }
}
