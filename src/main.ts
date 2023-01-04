import { default as packageJson } from '../package.json'
import {
  defaultColorList,
  defaultTheme,
  parseThemeObject,
  stringifyColorList,
  stringifyThemeObject,
  toHtmlColor,
} from './color'
import { setupGame } from './game'
import { defaultLayout, phoneDefaultLayout, stringifyLayout } from './layout'
import { create } from './lib/create'
import { githubCornerHTML } from './lib/githubCorner'
import { resolveSearch } from './lib/urlParameter'
import { isMobile } from './util/isMobile'

export type Device = 'detect' | 'phone' | 'desktop' | ''

export interface TrackOfThoughtConfig {
  autoPlay: boolean
  colorList: string
  departureClearance: number
  duration: number
  generateRetryCount: number
  gridHeight: number
  gridWidth: number
  layout: string
  level: number
  device: Device
  seed: number
  showColorIndices: boolean
  stationCount: number
  theme: string
  trainCount: number
}

function randomSeed() {
  return Math.floor(Math.random() * 2 ** 32)
}

function levelInfo(level: number, device: Device) {
  level = Math.max(level, 3)
  let trainCount = 14 + 3 * level
  let stationCount = level
  let big = 8 + Math.max(0, Math.floor(+(level - 11) / 2))
  let small = 6
  if (device === 'detect') {
    device = isMobile() ? 'phone' : 'desktop'
  }
  if (device === 'phone') {
    return {
      device: 'phone',
      gridHeight: big,
      gridWidth: small,
      trainCount,
      stationCount,
    }
  }
  return {
    device: 'desktop',
    gridHeight: small,
    gridWidth: big,
    trainCount,
    stationCount,
  }
}

function getConfig(location: Location) {
  return resolveSearch<TrackOfThoughtConfig>(location, {
    autoPlay: () => false,
    colorList: () => stringifyColorList(defaultColorList),
    departureClearance: () => 3,
    duration: () => 100,
    generateRetryCount: () => (process.env.NODE_ENV === 'production' ? 200_000 : 2_000),
    gridHeight: ({ level, device }) => levelInfo(level(), device()).gridHeight,
    gridWidth: ({ level, device }) => levelInfo(level(), device()).gridWidth,
    layout: ({ device }) =>
      stringifyLayout(
        levelInfo(-1, device()).device === 'phone' ? phoneDefaultLayout : defaultLayout,
      ),
    level: () => 0,
    device: () => 'detect',
    seed: () => randomSeed(),
    showColorIndices: () => false,
    stationCount: ({ level }) => levelInfo(level(), '').stationCount,
    theme: () => stringifyThemeObject(defaultTheme),
    trainCount: ({ level }) => levelInfo(level(), '').trainCount,
  })
}

function main() {
  const config = getConfig(location)
  console.info(`&seed=${config.seed}`)
  console.info('config', config)

  const theme = parseThemeObject(config.theme)
  console.info('theme', theme)

  document.documentElement.style.backgroundColor = toHtmlColor(theme.background)

  document.body.innerHTML += githubCornerHTML(packageJson.repository, packageJson.version)

  if (config.level > 0) {
    setupGame(config, theme)
  } else {
    let levelSelectionDiv = create('div', { className: 'levelSelectionDiv' }, [
      create('h1', { textContent: 'Select a level' }),
    ])
    document.body.appendChild(levelSelectionDiv)

    Array.from({ length: 14 - 3 + 1 }, (_, k) => {
      let levelNumber = `${k + 3}`
      levelSelectionDiv.appendChild(
        create('button', {
          textContent: levelNumber,
          className: 'levelSelectionButton',
          onclick: () => {
            levelSelectionDiv.style.opacity = '0%'
            levelSelectionDiv.addEventListener('transitionend', () => {
              document.body.removeChild(levelSelectionDiv)
              let search = new URLSearchParams(location.search)
              search.set('level', levelNumber)
              history.pushState({}, '', '?' + search)
              setupGame(getConfig(location), theme)
            })
          },
        }),
      )
    })
  }
}

main()
