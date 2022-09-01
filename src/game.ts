import * as pixi from 'pixi.js'
import { LevelObject } from './level/importerObject'
import { Train } from './train'
import { colorNameToNumber, randomPick } from './util'

export class Game {
  trainArray: Train[] = []
  startTimeArray: number[]
  elapsedTimeMs: number
  constructor(public app: pixi.Application, public levelObject: LevelObject) {
    let length = levelObject.balls.amount
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
        this.levelObject.stations[0],
        0.5,
        colorNameToNumber(randomPick(this.levelObject.stations).color) || 0,
      )
      this.trainArray.push(train)
      this.app.stage.addChild(train.g)
    }
    this.trainArray.forEach((train) => {
      train.update(elapsedMS)
    })
  }
}
