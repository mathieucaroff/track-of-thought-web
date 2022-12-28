import { Direction, Position } from '../type'

export interface Departure extends Position {
  type: 'departure'
  exit: Direction
}

export interface Destination extends Position {
  type: 'destination'
  entrance: Direction
  colorIndex: number
}

export interface Track extends Position {
  type: 'track'
  entrance: Direction
  exit: Direction
}

export interface Switch extends Position {
  type: 'switch'
  entrance: Direction
  exit: Direction
  otherExit: Direction
  trainCount: number
  mouseIsOver: boolean
}

export type Station = Departure | Destination

export type Rail = Track | Switch

export type Tile = Station | Rail
