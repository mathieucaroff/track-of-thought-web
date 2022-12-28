import { Rail, Station, Tile } from '../type/tileType'

export function isStation(a: Tile | null): a is Station {
  return ['departure', 'destination'].includes(a?.type ?? '')
}

export function isRail(a: Tile | null): a is Rail {
  return ['track', 'switch'].includes(a?.type ?? '')
}
