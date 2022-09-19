import { ImporterObject, LevelObject } from '../type'
import { pathGroup } from './levelImporter'

let importerObject: ImporterObject = {}

Object.entries(pathGroup).forEach(([name, importer]) => {
  let [levelNumber, alternativeNumber] = name.split('-')
  let n = +levelNumber
  importerObject[n] = importerObject[n] || {}
  importerObject[n][alternativeNumber] = importer as any as () => Promise<LevelObject>
})

export { importerObject }
