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
      // dropShadow: true,
      // dropShadowDistance: 0,
      // dropShadowBlur: 2,
    })
  }

  const roadTurn = () => {
    let g = new pixi.Graphics()
    // interior road hole
    const hole = () => {
      g.moveTo(0, 0)
      g.arc(0, 0, layout.roadHole, 0, Math.PI / 2 - 0.0001, false)
      g.cut()
    }

    // road turn exterior
    g.moveTo(0, 0)
    g.arc(0, 0, layout.roadHole + layout.roadWidth, 0, pixi.PI_2 / 4, false)
    g.fill(theme.pavement)
    hole()
    // road turn center
    g.moveTo(0, 0)
    g.arc(
      0,
      0,
      layout.roadHole + layout.roadBorder + layout.interiorRoadWidth,
      0,
      pixi.PI_2 / 4,
      false,
    )
    g.fill(theme.asphalt)
    hole()
    // road turn interior
    g.moveTo(0, 0)
    g.arc(0, 0, layout.roadHole + layout.roadBorder, 0, pixi.PI_2 / 4, false)
    g.fill(theme.pavement)
    hole()

    return g
  }

  const road = () => {
    let g = new pixi.Graphics()
    // road exterior
    g.moveTo(0, 0)
    g.rect(0, layout.roadHole, layout.squareWidth, layout.roadWidth)
    g.fill(theme.pavement)

    // road interior
    g.moveTo(0, 0)
    g.rect(0, layout.roadHole + layout.roadBorder, layout.squareWidth, layout.interiorRoadWidth)
    g.fill(theme.asphalt)

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
    g.rect(
      stationMargin,
      stationMargin,
      squareWidth - 2 * stationMargin,
      squareWidth - 2 * stationMargin,
    )
    g.fill(0xffffff)
    g.rect(
      stationMargin + squareBorder,
      stationMargin + squareBorder,
      squareWidth - 2 * (stationMargin + squareBorder),
      squareWidth - 2 * (stationMargin + squareBorder),
    )
    g.fill(getColorFromList(colorIndex, colorList))
    let { dx, dy } = directionToDelta(direction)

    let h = new pixi.Container()
    h.x += stationMargin * dx
    h.y += stationMargin * dy
    h.addChild(g)

    if (showColorIndices) {
      let textContent = colorIndex.toString(16).toUpperCase()
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
    g.circle(squareWidth / 2, squareWidth / 2, layout.roadWidth / 2)
    g.fill(0xffffff)
    g.circle(squareWidth / 2, squareWidth / 2, layout.interiorRoadWidth / 2)
    g.fill(getColorFromList(colorIndex, colorList))
    let h = new pixi.Container()
    h.addChild(g)

    if (showColorIndices) {
      let textContent = colorIndex.toString(16).toUpperCase()
      let j = text(textContent, squareWidth / 7)
      j.x += 0.53 * squareWidth - 0.06 * squareWidth * textContent.length
      j.y += 0.42 * squareWidth
      h.addChild(j)
    }
    return h
  }

  const switchCircle = (g: pixi.Graphics, circleColor: number) => {
    g.clear()
    g.circle(layout.squareWidth / 2, layout.squareWidth / 2, layout.switchRadius)
    g.fill(theme.switchOutline)
    g.circle(
      layout.squareWidth / 2,
      layout.squareWidth / 2,
      layout.switchRadius - layout.switchOutlineWidth,
    )
    g.fill(circleColor)
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
