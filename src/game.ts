import * as pixi from 'pixi.js'
import { Train } from './train'
import { colorNameToNumber, randomPick } from './util'
import { Grid } from './grid'
import { errorSound } from './audio/sound'
import { SQUARE_WIDTH } from './constants'

export interface GameOption {
  errorSound: boolean
}

export class Game {
  trainArray: Train[] = []
  startTimeArray: number[]
  elapsedTimeMs: number
  totalTrainCount = 0
  goodTrainCount = 0
  score: pixi.Text
  finalText: pixi.Text
  constructor(public stage: pixi.Container, public grid: Grid, public option: GameOption) {
    let length = grid.balls.amount
    this.startTimeArray = Array.from({ length }, (_, k) => {
      return (k / length) * 100 * 1000 // spread the train's start time over the course of 100 seconds
    })
    this.elapsedTimeMs = 0

    // Score and score background
    this.score = new pixi.Text(
      `0 / 0 (-0)`,
      new pixi.TextStyle({
        fill: '#c7b59d',
        fontFamily: 'Arial',
      }),
    )
    this.score.anchor.set(0.5)

    let scoreBackground = new pixi.Graphics()
    scoreBackground.beginFill(0x4b494a)
    scoreBackground.drawRect(-10, -20, 185, 60)

    scoreBackground.x = 30
    scoreBackground.y = -SQUARE_WIDTH + 10
    this.score.x = 110
    this.score.y = -SQUARE_WIDTH + 24

    stage.addChild(scoreBackground)
    stage.addChild(this.score)

    // Final text
    this.finalText = new pixi.Text(
      '',
      new pixi.TextStyle({
        fill: '#c7b59d',
        fontFamily: 'Arial',
        fontSize: 60,
        strokeThickness: 5,
        align: 'center',
      }),
    )
    this.finalText.anchor.set(0.5)
    this.finalText.x = 480
    this.finalText.y = 300
    stage.addChild(this.finalText)
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
      this.stage.addChild(train.g)
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
    this.stage.removeChild(train.g)
    this.totalTrainCount += 1
    if (train.colorMatchesStation()) {
      this.goodTrainCount += 1
    } else {
      if (this.option.errorSound) {
        errorSound.play()
      }
    }
    this.score.text = `${this.goodTrainCount} / ${this.totalTrainCount} (-${
      this.totalTrainCount - this.goodTrainCount
    })`
    if (this.totalTrainCount === this.grid.balls.amount) {
      this.reportUserResult()
    }
  }

  reportUserResult() {
    let diff = this.goodTrainCount - this.totalTrainCount
    this.finalText.text = this.score.text
    if (diff === 0) {
      this.finalText.text += '\nPerfect score!'
    } else if (diff >= -2) {
      this.finalText.text += '\nLevel complete!'
    }
  }
}
