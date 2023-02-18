import { createEmptyGrid } from '../grid'
import { TrackOfThoughtConfig } from '../main'
import { Level } from '../type'
import { Destination, Rail, Switch, Tile } from '../type/tileType'
import { oppositeOf } from '../util/direction'
import { nextTile } from '../util/nextTile'

export interface SmartSwitch extends Switch {
  colorIndexArray: number[]
  colorIndexOtherArray: number[]
}

export function getSmartSwitchGrid(
  config: TrackOfThoughtConfig,
  level: Level,
  grid: (Tile | null)[][],
): (SmartSwitch | null)[][] {
  let switchGrid = createEmptyGrid<SmartSwitch | null>({
    width: config.gridWidth,
    height: config.gridHeight,
  })

  const addColor = (dest: Destination) => {
    let lastTile: Tile = dest
    for (
      let k = 0, tile = nextTile(dest, dest.entrance, grid);
      tile.type !== 'departure';
      k++, lastTile = tile, tile = nextTile(tile, tile.entrance, grid)
    ) {
      if (tile.type === 'switch') {
        let smartSwitch = switchGrid[tile.y][tile.x] ?? {
          ...tile,
          colorIndexArray: [],
          colorIndexOtherArray: [],
        }
        switchGrid[tile.y][tile.x] = smartSwitch

        if (oppositeOf(lastTile.entrance) === smartSwitch.exit) {
          smartSwitch.colorIndexArray.push(dest.colorIndex)
        } else if (oppositeOf(lastTile.entrance) === smartSwitch.otherExit) {
          smartSwitch.colorIndexOtherArray.push(dest.colorIndex)
        } else {
          console.error('mismatch between track entraces and switch exits')
        }
      }
      if (k > 999) {
        console.error('infite loop (>999) while trying to add smart switch color', dest)
        break
      }
    }
  }

  level.destinationArray.forEach(addColor)

  return switchGrid
}
