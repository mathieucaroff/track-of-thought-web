import { default as packageJson } from '../package.json'
import {
  defaultColorList,
  defaultTheme,
  parseThemeObject,
  stringifyColorList,
  stringifyThemeObject,
  Theme,
  toHtmlColor,
} from './color'
import { Game, GameNavigation, setupGame } from './game'
import { defaultLayout, phoneDefaultLayout, stringifyLayout } from './layout'
import { create } from './lib/create'
import { githubCornerHTML } from './lib/githubCorner'
import { resolveSearch } from './lib/urlParameter'
import { isMobile } from './util/isMobile'

export type Device = 'detect' | 'phone' | 'desktop' | ''

export type GamePlay = 'station' | 'switch'

export interface TrackOfThoughtConfig {
  autoPlay: boolean
  autoPlayOnEntry: boolean
  autoPlayOnExit: boolean
  colorList: string
  departureClearance: number
  device: Device
  duration: number
  gamePlay: GamePlay
  generateRetryCount: number
  gridHeight: number
  gridWidth: number
  layout: string
  level: number
  seed: number
  stationSeed: number
  trainSeed: number
  showColorIndices: boolean
  stationCount: number
  theme: Theme
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
    autoPlay: [() => false],
    autoPlayOnEntry: [({ autoPlay }) => autoPlay()],
    autoPlayOnExit: [({ autoPlay }) => autoPlay()],
    colorList: [() => stringifyColorList(defaultColorList)],
    departureClearance: [() => 3],
    device: [() => 'detect'],
    duration: [() => 100],
    gamePlay: [() => 'switch'],
    generateRetryCount: [() => (import.meta.env.PROD ? 200_000 : 2_000)],
    gridHeight: [({ level, device }) => levelInfo(level(), device()).gridHeight],
    gridWidth: [({ level, device }) => levelInfo(level(), device()).gridWidth],
    layout: [
      ({ device }) =>
        stringifyLayout(
          levelInfo(-1, device()).device === 'phone' ? phoneDefaultLayout : defaultLayout,
        ),
    ],
    level: [() => 0],
    seed: [() => randomSeed()],
    stationSeed: [({ seed }) => seed()],
    trainSeed: [({ seed }) => seed()],
    showColorIndices: [() => false],
    stationCount: [({ level }) => levelInfo(level(), '').stationCount],
    theme: [() => stringifyThemeObject(defaultTheme), parseThemeObject],
    trainCount: [({ level }) => levelInfo(level(), '').trainCount],
  })
}

function createMenu(
  config: TrackOfThoughtConfig,
  onSelect: (level: number, gamePlay: GamePlay) => void,
) {
  let levelSelected = false
  let gamePlay = config.gamePlay
  const gamePlayOptionArray: { value: GamePlay; title: string; description: string }[] = [
    { value: 'switch', title: 'Switch', description: 'Set each switch before trains pass' },
    { value: 'station', title: 'Station', description: "Guide trains to their color's station" },
  ]
  let gamePlaySelector = create(
    'div',
    { className: 'gamePlaySelector' },
    gamePlayOptionArray.map(({ value, title, description }) =>
      create('label', { className: 'gamePlayOption' }, [
        create('input', {
          type: 'radio',
          name: 'gamePlay',
          value,
          checked: value === gamePlay,
          onchange: () => {
            gamePlay = value
          },
        }),
        create('span', { className: 'gamePlayTitle', textContent: title }),
        create('span', { className: 'gamePlayDescription', textContent: description }),
      ]),
    ),
  )
  let levelSelectionDiv = create('div', { className: 'levelSelectionDiv' }, [
    create('h1', { textContent: 'Select a game mode' }),
    gamePlaySelector,
    create('h1', { textContent: 'Select a level' }),
  ])

  Array.from({ length: 14 - 3 + 1 }, (_, k) => {
    let level = k + 3
    levelSelectionDiv.appendChild(
      create('button', {
        textContent: `${level}`,
        className: 'levelSelectionButton',
        onclick: () => {
          // ignore clicks on other buttons once a level has been picked
          if (levelSelected) {
            return
          }
          levelSelected = true
          levelSelectionDiv.style.opacity = '0%'
          const onTransitionEnd = (event: TransitionEvent) => {
            // the buttons' own hover transitions bubble up to the div; only
            // react to the fade-out of the div itself
            if (event.target !== levelSelectionDiv) {
              return
            }
            levelSelectionDiv.removeEventListener('transitionend', onTransitionEnd)
            onSelect(level, gamePlay)
          }
          levelSelectionDiv.addEventListener('transitionend', onTransitionEnd)
        },
      }),
    )
  })

  return levelSelectionDiv
}

function main() {
  const initialConfig = getConfig(location)
  console.info('theme', initialConfig.theme)

  document.documentElement.style.backgroundColor = toHtmlColor(initialConfig.theme.background)

  document.body.insertAdjacentHTML(
    'beforeend',
    githubCornerHTML(packageJson.repository, packageJson.version),
  )

  // what is currently on screen: the level selection menu, or a game
  let menu: HTMLElement | null = null
  let game: Promise<Game> | null = null
  // incremented on each navigation, so that a slow game setup which has been
  // superseded by another navigation gets torn down instead of displayed
  let renderId = 0

  const clearScreen = async () => {
    menu?.remove()
    menu = null
    if (game) {
      let previousGame = game
      game = null
      ;(await previousGame).destroy()
    }
  }

  // show the screen matching the current URL
  const render = async () => {
    let id = ++renderId
    await clearScreen()
    if (id !== renderId) {
      return
    }
    const config = getConfig(location)
    if (config.level > 0) {
      console.info(`&seed=${config.seed}`)
      console.info('config', config)
      game = setupGame(config, navigation)
    } else {
      menu = createMenu(config, (level, gamePlay) => {
        let search = new URLSearchParams(location.search)
        search.set('level', `${level}`)
        search.set('gamePlay', gamePlay)
        history.pushState({}, '', '?' + search)
        render()
      })
      document.body.appendChild(menu)
    }
  }

  const navigation: GameNavigation = {
    onMenu: () => {
      let search = new URLSearchParams(location.search)
      search.delete('level')
      history.pushState({}, '', '?' + search)
      render()
    },
    // the URL stays the same: same level and game mode, with a new random seed
    // unless the seed is set in the URL
    onReplay: () => {
      render()
    },
  }

  // browser back and forward buttons
  window.addEventListener('popstate', () => {
    render()
  })

  render()
}

main()
