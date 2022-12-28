import { InfoObject, indirectResolve } from './lib/indirectResolver'

export interface Layout {
  squareWidth: number
  sw: number
  stationBorder: number
  stationMargin: number
  squareBorder: number
  roadWidth: number
  interiorRoadWidth: number
  roadHole: number
  roadBorder: number
  scoreHeight: number
  switchOutlineWidth: number
  switchRadius: number
}

export const defaultLayoutInfoObject: InfoObject<Layout> = {
  squareWidth: () => 128,
  sw: ({ squareWidth }) => squareWidth(),
  stationBorder: ({ sw }) => sw() / 24,
  stationMargin: ({ sw }) => sw() / 6,
  squareBorder: ({ sw }) => sw() / 16,
  roadWidth: ({ sw }) => (sw() * 3) / 10,
  interiorRoadWidth: ({ sw }) => (sw() * 2) / 10,
  roadHole: ({ sw, roadWidth }) => (sw() - roadWidth()) / 2,
  roadBorder: ({ roadWidth, interiorRoadWidth }) => (roadWidth() - interiorRoadWidth()) / 2,
  scoreHeight: () => 50,
  switchOutlineWidth: () => 2,
  switchRadius: ({ sw }) => sw() / 3,
}

export function stringifyLayout(layout: Layout) {
  return Object.entries(layout)
    .map(([key, value]) => `${key}:${value}`)
    .join(',')
}

export function parseLayout(input: string): Layout {
  let infoObject = { ...defaultLayoutInfoObject }

  if (input) {
    input.split(',').forEach((pair) => {
      let [name, value] = pair.split(':')
      infoObject[name] = () => +value
    })
  }

  return indirectResolve<Layout>(infoObject)
}

export const defaultLayout = parseLayout('')
export const phoneDefaultLayout = parseLayout('squareWidth:60')
