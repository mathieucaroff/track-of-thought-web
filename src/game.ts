import * as pixi from 'pixi.js'
import { Train } from './train'
import { colorNameToNumber, randomPick } from './util'
import { Grid } from './type'
import { errorSound } from './audio/sound'
import { SCORE_BACKGROUND_COLOR, SQUARE_WIDTH, SW } from './constants'

export interface GameOption {
  errorSound: boolean
  enablePattern: boolean
}

export class Game {
  trainArray: Train[] = []
  startTimeArray: number[]
  elapsedTimeMs: number
  totalTrainCount = 0
  goodTrainCount = 0
  score: pixi.Text
  finalText: pixi.Text
  finalBackground: pixi.Graphics
  constructor(
    public stage: pixi.Container,
    public grid: Grid,
    public canvas: HTMLCanvasElement,
    public option: GameOption,
  ) {
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
        fontSize: 35 * SW,
      }),
    )
    this.score.anchor.set(0.5)

    let scoreBackground = new pixi.Graphics()
    scoreBackground.beginFill(SCORE_BACKGROUND_COLOR)
    scoreBackground.drawRect(-30 * SW, -20 * SW, 225 * SW, 60 * SW)

    scoreBackground.x = 30 * SW
    scoreBackground.y = -SQUARE_WIDTH + 10 * SW
    this.score.x = 110 * SW
    this.score.y = -SQUARE_WIDTH + 24 * SW

    stage.addChild(scoreBackground)
    stage.addChild(this.score)

    // Button back
    let buttonBack = new pixi.Text('⮌', {
      fill: '#c7b59d',
      fontSize: 35 * SW,
    })
    buttonBack.x = 235 * SW
    buttonBack.y = -122 * SW
    let buttonBackBackground = new pixi.Graphics()
    scoreBackground.beginFill(0x4b494a)
    scoreBackground.drawRect(190 * SW, -20 * SW, 60 * SW, 60 * SW)
    buttonBackBackground.interactive = true
    buttonBackBackground.hitArea = new pixi.Rectangle(215 * SW, -140 * SW, 70 * SW, 60 * SW)
    let goBack = () => {
      location.search = ''
    }
    buttonBackBackground.on('mousedown', goBack)
    buttonBackBackground.on('tap', goBack)
    buttonBackBackground.on('mouseover', () => {
      this.canvas.style.cursor = 'pointer'
    })
    buttonBackBackground.on('mouseout', () => {
      this.canvas.style.cursor = 'inherit'
    })
    stage.addChild(buttonBack)
    stage.addChild(buttonBackBackground)

    // Final text
    this.finalText = new pixi.Text(
      '',
      new pixi.TextStyle({
        fill: '#c7b59d',
        fontFamily: 'Arial',
        fontSize: 60 * SW,
        strokeThickness: 5 * SW,
        align: 'center',
      }),
    )
    this.finalText.anchor.set(0.5)
    this.finalText.x = 480 * SW
    this.finalText.y = 300 * SW
    this.finalBackground = new pixi.Graphics()
    stage.addChild(this.finalBackground)
    stage.addChild(this.finalText)
  }
  update(elapsedMS: number) {
    this.elapsedTimeMs += elapsedMS
    while (this.startTimeArray.length > 0 && this.startTimeArray[0] < this.elapsedTimeMs) {
      this.startTimeArray.shift()
      let colorName = randomPick(this.grid.stations).color
      let train = new Train(
        this.grid,
        { ...this.grid.start },
        0.5,
        colorNameToNumber(colorName) || 0,
        this.option.enablePattern && colorName.endsWith(' + o'),
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
    this.finalBackground.beginFill(SCORE_BACKGROUND_COLOR)
    this.finalBackground.drawRect(250 * SW, 210 * SW, 460 * SW, 180 * SW)
    this.finalText.text = this.score.text
    if (diff === 0) {
      this.finalText.text += '\nPerfect score!'
    } else if (diff >= -2) {
      this.finalText.text += '\nLevel complete!'
    }
  }
}
