import { ImporterObject, LevelObject } from '../type'
import { pathGroup } from './levelImporter'

let importerObject: ImporterObject = {}

Object.entries(pathGroup).forEach(([name, importer]) => {
  let [levelNumber, alternativeNumber] = name.split('-')
  importerObject[+levelNumber] = importerObject[levelNumber] || {}
  importerObject[+levelNumber][alternativeNumber] = importer as any as () => Promise<LevelObject>
})

export { importerObject }
