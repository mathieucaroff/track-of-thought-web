import * as pixi from 'pixi.js'
import { SQUARE_WIDTH } from './constants'
import { GridPosition } from './type'

export let randomPick = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)]
}

export let colorNameToNumber = (color: string) => {
  return {
    'black': 0x0,
    'blue + o': 0x004488,
    'blue': 0x0088ff,
    'cyan + o': 0x008888,
    'cyan': 0x00ffff,
    'green + o': 0x008800,
    'green': 0x00ff00,
    'orange + o': 0x884400,
    'orange': 0xff8800,
    'pink + o': 0x884444,
    'pink': 0xff8888,
    'red + o': 0x880000,
    'red': 0xff0000,
    'yellow + o': 0x888800,
    'yellow': 0xffff00,
  }[color]
}

export let addPosition = (g: pixi.Container, position: GridPosition) => {
  g.x += SQUARE_WIDTH * position.column
  g.y += SQUARE_WIDTH * position.row
  return g
}

export let setPosition = (g: pixi.Container, position: GridPosition) => {
  g.x = SQUARE_WIDTH * position.column
  g.y = SQUARE_WIDTH * position.row
  return g
}
