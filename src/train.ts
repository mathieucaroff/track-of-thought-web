import * as pixi from 'pixi.js'
import { SQUARE_WIDTH } from './constants'
import * as graphics from './graphics'
import { Grid } from './grid'
import { Direction, GridPosition } from './type'
import { colorNameToNumber, oppositeOf, setPosition } from './util'

export class Train {
  g: pixi.Graphics
  /**
   *
   * @param gridPosition Coordinates of the tile of the grid which is being hovered
   * @param progress Number going from 0 to 1 indicating how far the train has advanced on the track
   * @param color Hexadecimal number for the color of the train
   */
  constructor(
    public grid: Grid,
    public gridPosition: GridPosition,
    public progress: number,
    public color: number,
    public hasPattern: boolean,
    public running: boolean,
  ) {
    this.g = graphics.train(color, hasPattern)
    setPosition(this.g, gridPosition)
  }
  update(elapsedMS: number) {
    if (!this.running) {
      return
    }
    this.progress += elapsedMS / 1000
    while (this.progress > 1) {
      this.next()
      if (!this.running) {
        return
      }
      this.progress -= 1
    }
    setPosition(this.g, this.gridPosition)

    let { row, column } = this.gridPosition
    let track = this.grid.content[row][column]
    if (!track) {
      throw new Error(`encountered an undefined entry in the grid, at ${row}:${column}`)
    }

    //
    let start: Direction
    let exit: Direction
    if (track.type === 'start') {
      exit = track.exit
      start = oppositeOf(exit)
    } else if (track.type === 'normal') {
      // at the station
      this.running = false
      return
    } else if (track.type !== 'curved' && track.type !== 'straight') {
      throw new Error(`encountered the wrong grid entry type: ${track?.type}`)
    } else {
      exit = track.end1
      start = track.start
    }

    this.handlePositionUpdate(start, exit)
  }

  // Handle updating the position of the train
  handlePositionUpdate(start: Direction, exit: Direction) {
    // the straight moves are handled right in this function
    // the turning moves are handled by handleTurnPositionUpdate()
    if (start === 'left' && exit === 'right') {
      this.g.x += (this.progress - 0.5) * SQUARE_WIDTH
    } else if (start === 'right' && exit === 'left') {
      this.g.x += (0.5 - this.progress) * SQUARE_WIDTH
    } else if (start === 'top' && exit === 'bottom') {
      this.g.y += (this.progress - 0.5) * SQUARE_WIDTH
    } else if (start === 'bottom' && exit === 'top') {
      this.g.y += (0.5 - this.progress) * SQUARE_WIDTH
    } else {
      this.handleTurnPositionUpdate(start, exit)
    }
  }

  // Handle updating the position of the train provided that start and exit are at a 90° angle
  handleTurnPositionUpdate(start: Direction, exit: Direction) {
    let from = ((Math.sin((this.progress * Math.PI) / 2) - 1) * SQUARE_WIDTH) / 2
    let to = ((Math.cos((this.progress * Math.PI) / 2) - 1) * SQUARE_WIDTH) / 2
    if (start === 'top') this.g.y += from
    if (start === 'left') this.g.x += from
    if (start === 'right') this.g.x -= from
    if (start === 'bottom') this.g.y -= from

    if (exit === 'top') this.g.y += to
    if (exit === 'left') this.g.x += to
    if (exit === 'right') this.g.x -= to
    if (exit === 'bottom') this.g.y -= to
  }

  // next -- move the train to the next square
  next() {
    let { row, column } = this.gridPosition
    let track = this.grid.content[row][column]
    if (!track) {
      throw new Error(`encountered an undefined entry in the grid, at ${row}:${column}`)
    }
    let exit: Direction
    if (track.type === 'start') {
      exit = track.exit
    } else if (track.type === 'normal') {
      // at the station
      this.running = false
      return
    } else if (track.type !== 'curved' && track.type !== 'straight') {
      throw new Error(`encountered the wrong grid entry type: ${track?.type}`)
    } else {
      exit = track.end1
    }
    if (exit === 'bottom') {
      this.gridPosition.row++
    } else if (exit === 'left') {
      this.gridPosition.column--
    } else if (exit === 'right') {
      this.gridPosition.column++
    } else {
      this.gridPosition.row--
    }
  }

  colorMatchesStation() {
    let { row, column } = this.gridPosition
    let entry = this.grid.content[row][column]
    if (!entry || entry.type !== 'normal') {
      throw new Error('encountered colorMatchesStation call while the train is not on a station')
    }
    return this.color === colorNameToNumber(entry.color)
  }
}
