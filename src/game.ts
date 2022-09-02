import * as pixi from 'pixi.js'
import { Train } from './train'
import { colorNameToNumber, randomPick } from './util'
import { Grid } from './grid'

export class Game {
  trainArray: Train[] = []
  startTimeArray: number[]
  elapsedTimeMs: number
  constructor(public app: pixi.Application, public grid: Grid) {
    let length = grid.balls.amount
    this.startTimeArray = Array.from({ length }, (_, k) => {
      return (k / length) * 100 * 1000 // spread the train's start time over the course of 100 seconds
    })
    this.elapsedTimeMs = 0
  }
  update(elapsedMS: number) {
    this.elapsedTimeMs += elapsedMS
    while (this.startTimeArray.length > 0 && this.startTimeArray[0] < this.elapsedTimeMs) {
      this.startTimeArray.shift()
      let train = new Train(
        this.grid,
        { ...this.grid.start },
        0.5,
        colorNameToNumber(randomPick(this.grid.stations).color) || 0,
        true,
      )
      this.trainArray.push(train)
      this.app.stage.addChild(train.g)
    }

    // remove the trains which have reached a station
    this.trainArray = this.trainArray.filter((train) => {
      if (!train.running) {
        this.app.stage.removeChild(train.g)
        return false
      }
      return true
    })

    // update the trains
    this.trainArray.forEach((train) => {
      train.update(elapsedMS)
    })
  }
}
