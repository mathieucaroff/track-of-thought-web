import { Departure, Destination, Rail, Tile, Station } from './type/tileType'

export { Departure, Rail, Tile, Station }

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

export interface Level {
  departure: Departure
  destinationArray: Destination[]
  railArray: Rail[]
}
