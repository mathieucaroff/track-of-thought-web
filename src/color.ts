export function toHtmlColor(color: number) {
  return '#' + color.toString(16).padStart(6, '0')
}

export function stringifyThemeObject(colorObject: Record<string, number>) {
  return Object.entries(colorObject)
    .map(([key, value]) => `${key}:${value.toString(16).padStart(6, '0')}`)
    .join(',')
}

export function parseThemeObject(input: string) {
  let result: Theme = { ...defaultTheme }

  input.split(',').forEach((pair) => {
    let [name, value] = pair.split(':')
    result[name] = parseInt(value, 16)
  })

  return result
}

export const defaultTheme = {
  background: 0x2d2e37,
  pavement: 0xb0b0b0,
  asphalt: 0x37383f,
  departure: 0x000000,
  switch: 0x4b494a,
  switchHover: 0x9b999a,
  switchOutline: 0xdddddd,
  scoreBackground: 0x4b494a,
  switchWithTrain: 0x000000,
  switchHoverWithTrain: 0xffffff,
}

export type Theme = typeof defaultTheme

export function stringifyColorList(colorList: number[]) {
  return colorList.map((c) => c.toString(16).padStart(6, '0')).join(',')
}

export function parseColorList(input: string) {
  return input.split(',').map((w) => parseInt(w, 16))
}

export const defaultColorList = [
  0x0088ff, // blue
  0x00ff00, // green
  0xff0000, // red
  0x00ffff, // cyan
  0xffff00, // yellow
  0xff8800, // orange
  0xff8888, // pink
  0x004488, // dark blue
  0x008800, // dark green
  0x880000, // dark red
  0x008888, // dark cyan
  0x888800, // dark yellow
  0x666666, // grey
  0xcccccc, // white-ish
  0x884444, // dark pink
]

export function getColorFromList(colorIndex: number, colorList: number[]) {
  return colorList[colorIndex % colorList.length]
}
