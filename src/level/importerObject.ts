import { pathGroup } from './levelImporter'

export interface ImporterObject {
  [levelNumber: string]: {
    [alternativeNumber: string]: typeof pathGroup[keyof typeof pathGroup]
  }
}

let importerObject: ImporterObject = {}

Object.entries(pathGroup).forEach(([name, importer]) => {
  let [levelNumber, alternativeNumber] = name.split('-')
  importerObject[levelNumber] = importerObject[levelNumber] || {}
  importerObject[levelNumber][alternativeNumber] = importer
})

export { importerObject }
