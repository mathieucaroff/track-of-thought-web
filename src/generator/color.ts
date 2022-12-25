export function stringifyThemeObject(colorObject: Record<string, number>) {
  return Object.entries(colorObject)
    .map(([key, value]) => `${key}:${value.toString(16).padStart(6, '0')}`)
    .join(',')
}

export function parseThemeObject(input: string) {
  let result: Record<string, number> = {}

  input.split(';').forEach((pair) => {
    let [name, value] = pair.split(':')
    result[name] = parseInt(value, 16)
  })

  return result
}

export const defaultThemeObject = {
  background: 0x2d2e37,
  pavement: 0xb0b0b0,
  asphalt: 0x37383f,
  switch: 0x4b494a,
  switchHover: 0x9b999a,
  switchOutline: 0xdddddd,
  scoreBackground: 0x4b494a,
  switchWithTrain: 0x000000,
}

export type Theme = typeof defaultThemeObject

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
  0x884400, // dark orange
  0x884444, // dark pink
]
