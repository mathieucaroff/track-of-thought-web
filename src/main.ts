import * as pixi from 'pixi.js'
import { road, roadTurn, SQUARE_WIDTH, station, train } from './graphics/graphics'
import { importerObject } from './level/importerObject'

let type = 'WebGL'
if (!pixi.utils.isWebGLSupported()) {
  type = 'canvas'
}

pixi.utils.sayHello(type)

let app = new pixi.Application({})

// size
let resize = () => {
  app.renderer.resize(window.innerWidth - 3, window.innerHeight - 4)
}
resize()
window.addEventListener('resize', resize)

app.renderer.backgroundColor = 0x061639

document.body.appendChild(app.view)

let randomPick = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)]
}

let main = async () => {
  let [levelNumber, alternativeImporterObject] = randomPick(Object.entries(importerObject))
  let [alternativeNumber, importer] = randomPick(Object.entries(alternativeImporterObject))

  console.log('level', levelNumber, alternativeNumber)

  let levelContent = await importer()

  console.log('levelContent', levelContent)
}
main()
