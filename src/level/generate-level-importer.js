const { readdirSync, writeFileSync } = require('fs')
const { resolve } = require('path')

let pathGroup = readdirSync(resolve(__dirname, 'levelData'), { withFileTypes: true })
  .filter((entry) => entry.isFile && entry.name.split('.')[1] === 'json')
  .map((entry) => {
    let [stem, _extension] = entry.name.split('.')
    let [_, major, minor] = stem.split('-')
    let escaped = entry.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return `  '${major.padStart(2, '0')}-${minor}': () => import('./levelData/${escaped}'),`
  })
  .sort()
  .join('\n')

let content = `export const pathGroup = {
${pathGroup}
}
`

writeFileSync(resolve(__dirname, 'levelImporter.ts'), content, { encoding: 'utf-8' })
