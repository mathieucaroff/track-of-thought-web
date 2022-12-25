export const MINIMAL_START_DISTANCE = 3

export const SQUARE_WIDTH = location.search.includes('phone') ? 24 * 2 : 64 * 2 // px

export const SW = SQUARE_WIDTH / 128

export const STATION_BORDER = SQUARE_WIDTH / 24
export const STATION_MARGIN = SQUARE_WIDTH / 6

export const ROAD_WIDTH = SQUARE_WIDTH * 0.3
export const INTERIOR_ROAD_WIDTH = SQUARE_WIDTH * 0.2
export const ROAD_HOLE = (SQUARE_WIDTH - ROAD_WIDTH) / 2
export const ROAD_BORDER = (ROAD_WIDTH - INTERIOR_ROAD_WIDTH) / 2
export const SWITCH_RADIUS = SQUARE_WIDTH / 3
export const SWITCH_OUTLINE_WIDTH = 2
export const BACKGROUND_COLOR = 0x2d2e37
export const PAVEMENT_COLOR = 0xb0b0b0
export const ASPHALT_COLOR = 0x37383f
export const SWITCH_COLOR = 0x4b494a
export const SWITCH_HOVER_COLOR = 0x9b999a
export const SWITCH_OUTLINE_COLOR = 0xdddddd
export const SCORE_BACKGROUND_COLOR = 0x4b494a

export const SWITCH_WITH_TRAIN_COLOR = 0x000000
