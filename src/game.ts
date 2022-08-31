import { LevelObject } from './level/importerObject'
import { Train } from './train'

export class Game {
  trainArray: Train[] = []
  constructor(public levelContent: LevelObject) {}
  update(dt: number) {}
}
