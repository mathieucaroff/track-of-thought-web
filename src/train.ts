import * as pixi from 'pixi.js'
import { SQUARE_WIDTH } from './constants'
import * as graphics from './graphics/graphics'
import { Grid } from './grid'
import { Direction, GridPosition } from './type'
import { setPosition } from './util'

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
    public running: boolean,
  ) {
    this.g = graphics.train(color)
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
    this.g.x += this.progress * SQUARE_WIDTH
  }
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
}
