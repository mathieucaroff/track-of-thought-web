import * as pixi from 'pixi.js'
import { Train } from './train'
import { colorNameToNumber, randomPick } from './util'
import { Grid } from './grid'
import { errorSound } from './audio/sound'

export class Game {
  trainArray: Train[] = []
  startTimeArray: number[]
  elapsedTimeMs: number
  totalTrainCount = 0
  goodTrainCount = 0
  score: pixi.Text
  constructor(public app: pixi.Application, public grid: Grid) {
    let length = grid.balls.amount
    this.startTimeArray = Array.from({ length }, (_, k) => {
      return (k / length) * 100 * 1000 // spread the train's start time over the course of 100 seconds
    })
    this.elapsedTimeMs = 0

    this.score = new pixi.Text(
      `0 / 0`,
      new pixi.TextStyle({
        fill: 'white',
        strokeThickness: 6,
      }),
    )
    this.score.x = 10
    this.score.y = 550
    app.stage.addChild(this.score)
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
        this.removeTrain(train)
        return false
      }
      return true
    })

    // update the trains
    this.trainArray.forEach((train) => {
      train.update(elapsedMS)
    })
  }

  removeTrain(train: Train) {
    this.app.stage.removeChild(train.g)
    this.totalTrainCount += 1
    if (train.colorMatchesStation()) {
      this.goodTrainCount += 1
    } else {
      errorSound.play()
    }
    this.writeText(`${this.goodTrainCount} / ${this.totalTrainCount}`)
    if (this.totalTrainCount === this.grid.balls.amount) {
      this.reportUserResult()
    }
  }

  reportUserResult() {
    let diff = this.goodTrainCount - this.totalTrainCount
    this.writeText(`end: ${diff}`, true)
    if (diff === 0) {
      this.writeText('Perfect score!', true)
    } else if (diff >= -2) {
      this.writeText('Congratulation on completing this level!', true)
    }
  }

  writeText(text: string, addLine = false) {
    console.log(text)
    if (addLine) {
      this.score.text += '\n' + text
    } else {
      this.score.text = '\n' + text
    }
  }
}
