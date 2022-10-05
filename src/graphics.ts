import * as pixi from 'pixi.js'
import {
  ASPHALT_COLOR,
  INTERIOR_ROAD_WIDTH,
  PAVEMENT_COLOR,
  ROAD_BORDER,
  ROAD_HOLE,
  ROAD_WIDTH,
  SQUARE_BORDER,
  SQUARE_WIDTH,
  SW,
  SWITCH_OUTLINE_COLOR,
  SWITCH_OUTLINE_WIDTH,
} from './constants'
import patternImageUrl from 'url:../asset/pattern/pattern.png'

const pattern = pixi.Texture.from(patternImageUrl)

export function roadTurn() {
  let g = new pixi.Graphics()
  // interior road hole
  const hole = () => {
    g.beginHole()
    g.moveTo(0, 0)
    g.arc(0, 0, ROAD_HOLE, 0, Math.PI / 2 - 0.0001, false)
    g.endHole()
  }

  // road turn exterior
  g.moveTo(0, 0)
  g.beginFill(PAVEMENT_COLOR)
  g.arc(0, 0, ROAD_HOLE + ROAD_WIDTH, 0, pixi.PI_2 / 4, false)
  g.endFill()
  hole()
  // road turn center
  g.moveTo(0, 0)
  g.beginFill(ASPHALT_COLOR)
  g.arc(0, 0, ROAD_HOLE + ROAD_BORDER + INTERIOR_ROAD_WIDTH, 0, pixi.PI_2 / 4, false)
  hole()
  // road turn interior
  g.moveTo(0, 0)
  g.beginFill(PAVEMENT_COLOR)
  g.arc(0, 0, ROAD_HOLE + ROAD_BORDER, 0, pixi.PI_2 / 4, false)
  hole()

  return g
}

export function road() {
  let g = new pixi.Graphics()
  // road exterior
  g.moveTo(0, 0)
  g.beginFill(PAVEMENT_COLOR)
  g.drawRect(0, ROAD_HOLE, SQUARE_WIDTH, ROAD_WIDTH)
  g.endFill()

  // road interior
  g.moveTo(0, 0)
  g.beginFill(ASPHALT_COLOR)
  g.drawRect(0, ROAD_HOLE + ROAD_BORDER, SQUARE_WIDTH, INTERIOR_ROAD_WIDTH)

  return g
}

export function station(color: number, hasPattern: boolean) {
  let g = new pixi.Graphics()
  g.beginFill(0xffffff)
  g.drawRect(0, 0, SQUARE_WIDTH, SQUARE_WIDTH)
  g.beginFill(color)
  g.drawRect(
    SQUARE_BORDER,
    SQUARE_BORDER,
    SQUARE_WIDTH - 2 * SQUARE_BORDER,
    SQUARE_WIDTH - 2 * SQUARE_BORDER,
  )
  g.endFill()
  let h = new pixi.Container()
  h.addChild(g)
  if (hasPattern) {
    let s = new pixi.TilingSprite(pattern, 60, 60)
    s.tileScale.x = 0.2
    s.tileScale.y = 0.2
    h.addChild(s)
  }
  return h
}

export function train(color: number, hasPattern: boolean) {
  let g = new pixi.Graphics()
  g.beginFill(0xffffff)
  g.drawCircle(SQUARE_WIDTH / 2, SQUARE_WIDTH / 2, ROAD_WIDTH / 2)
  g.beginFill(color)
  g.drawCircle(SQUARE_WIDTH / 2, SQUARE_WIDTH / 2, INTERIOR_ROAD_WIDTH / 2)
  g.endFill()
  let h = new pixi.Container()
  h.addChild(g)
  if (hasPattern) {
    let s = new pixi.TilingSprite(pattern, 24 * SW, 24 * SW)
    s.tileScale.x = 0.2 * SW
    s.tileScale.y = 0.2 * SW
    s.x += 20 * SW
    s.y += 20 * SW
    h.addChild(s)
  }
  return h
}

export function switchCircle(circleColor: number) {
  let g = new pixi.Graphics()
  g.beginFill(SWITCH_OUTLINE_COLOR)
  g.drawCircle(SQUARE_WIDTH / 2, SQUARE_WIDTH / 2, SQUARE_WIDTH / 2)
  g.beginFill(circleColor)
  g.drawCircle(SQUARE_WIDTH / 2, SQUARE_WIDTH / 2, SQUARE_WIDTH / 2 - SWITCH_OUTLINE_WIDTH)
  g.endFill()
  return g
}
