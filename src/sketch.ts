import { pixi } from './alias'
import { getColorFromList, Theme } from './color'
import { Layout } from './layout'
import { Direction, Station } from './type'
import { directionToDelta } from './util/direction'

export function createSketcher(layout: Layout, theme: Theme, showColorIndices: boolean) {
  const text = (textContent: string, fontSize: number) => {
    return new pixi.Text(textContent, {
      fontFamily: 'Arial',
      fontSize, // layout.squareWidth / 4
      fill: 0xffffff,
      dropShadow: true,
      dropShadowDistance: 0,
      dropShadowBlur: 2,
    })
  }

  const roadTurn = () => {
    let g = new pixi.Graphics()
    // interior road hole
    const hole = () => {
      g.beginHole()
      g.moveTo(0, 0)
      g.arc(0, 0, layout.roadHole, 0, Math.PI / 2 - 0.0001, false)
      g.endHole()
    }

    // road turn exterior
    g.moveTo(0, 0)
    g.beginFill(theme.pavement)
    g.arc(0, 0, layout.roadHole + layout.roadWidth, 0, pixi.PI_2 / 4, false)
    g.endFill()
    hole()
    // road turn center
    g.moveTo(0, 0)
    g.beginFill(theme.asphalt)
    g.arc(
      0,
      0,
      layout.roadHole + layout.roadBorder + layout.interiorRoadWidth,
      0,
      pixi.PI_2 / 4,
      false,
    )
    hole()
    // road turn interior
    g.moveTo(0, 0)
    g.beginFill(theme.pavement)
    g.arc(0, 0, layout.roadHole + layout.roadBorder, 0, pixi.PI_2 / 4, false)
    hole()

    return g
  }

  const road = () => {
    let g = new pixi.Graphics()
    // road exterior
    g.moveTo(0, 0)
    g.beginFill(theme.pavement)
    g.drawRect(0, layout.roadHole, layout.squareWidth, layout.roadWidth)
    g.endFill()

    // road interior
    g.moveTo(0, 0)
    g.beginFill(theme.asphalt)
    g.drawRect(0, layout.roadHole + layout.roadBorder, layout.squareWidth, layout.interiorRoadWidth)

    return g
  }

  const station = (station: Station, colorIndex: number, colorList: number[]) => {
    let direction: Direction
    if (station.type === 'departure') {
      direction = station.exit
    } else {
      direction = station.entrance
    }

    let { squareWidth, squareBorder, stationMargin, stationBorder } = layout

    let g = new pixi.Graphics()
    g.beginFill(0xffffff)
    g.drawRect(
      stationMargin,
      stationMargin,
      squareWidth - 2 * stationMargin,
      squareWidth - 2 * stationMargin,
    )
    g.beginFill(getColorFromList(colorIndex, colorList))
    g.drawRect(
      stationMargin + squareBorder,
      stationMargin + squareBorder,
      squareWidth - 2 * (stationMargin + squareBorder),
      squareWidth - 2 * (stationMargin + squareBorder),
    )
    g.endFill()
    let { dx, dy } = directionToDelta(direction)

    let h = new pixi.Container()
    h.x += stationMargin * dx
    h.y += stationMargin * dy
    h.addChild(g)

    if (showColorIndices) {
      let textContent = `${colorIndex}`
      let j = text(textContent, squareWidth / 4)
      j.x += 0.52 * squareWidth - 0.08 * squareWidth * textContent.length
      j.y += 0.38 * squareWidth
      h.addChild(j)
    }

    return h
  }

  const train = (colorIndex: number, colorList: number[]) => {
    let { squareWidth } = layout
    let g = new pixi.Graphics()
    g.beginFill(0xffffff)
    g.drawCircle(squareWidth / 2, squareWidth / 2, layout.roadWidth / 2)
    g.beginFill(getColorFromList(colorIndex, colorList))
    g.drawCircle(squareWidth / 2, squareWidth / 2, layout.interiorRoadWidth / 2)
    g.endFill()
    let h = new pixi.Container()
    h.addChild(g)

    if (showColorIndices) {
      let textContent = `${colorIndex}`
      let j = text(textContent, squareWidth / 7)
      j.x += 0.53 * squareWidth - 0.06 * squareWidth * textContent.length
      j.y += 0.42 * squareWidth
      h.addChild(j)
    }
    return h
  }

  const switchCircle = (g: pixi.Graphics, circleColor: number) => {
    g.beginFill(theme.switchOutline)
    g.drawCircle(layout.squareWidth / 2, layout.squareWidth / 2, layout.switchRadius)
    g.beginFill(circleColor)
    g.drawCircle(
      layout.squareWidth / 2,
      layout.squareWidth / 2,
      layout.switchRadius - layout.switchOutlineWidth,
    )
    g.endFill()
  }

  return {
    roadTurn,
    road,
    station,
    train,
    switchCircle,
  }
}

export type Sketcher = ReturnType<typeof createSketcher>
