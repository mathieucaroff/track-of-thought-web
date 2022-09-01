import * as pixi from 'pixi.js'
import { SQUARE_WIDTH } from './constants'
import * as graphics from './graphics/graphics'
import { GridPosition } from './type'
import { setPosition } from './util'

export class Train {
  g: pixi.Graphics
  /**
   *
   * @param gridPosition Coordinates of the tile of the grid which is being hovered
   * @param progress Number going from 0 to 1 indicating how far the train has advanced on the track
   * @param color Hexadecimal number for the color of the train
   */
  constructor(public gridPosition: GridPosition, public progress: number, public color: number) {
    this.g = graphics.train(color)
    setPosition(this.g, gridPosition)
  }
  update(elapsedMS: number) {
    this.progress += elapsedMS / 1000
    while (this.progress > 1) {
      this.progress -= 1
    }
    setPosition(this.g, this.gridPosition)
    this.g.x += this.progress * SQUARE_WIDTH
  }
}
