import { indirectResolve, InfoObject } from './indirectResolver'

export let ensureSpacelessURL = (location: Location) => {
  let spaceLessURL = location.href.replace(/ |%20/g, '')

  if (location.href !== spaceLessURL) {
    location.replace(spaceLessURL)
  }
}

export let resolveHash = <T>(location: Location, defaultConfig: InfoObject<T>) => {
  let infoObject = { ...defaultConfig }

  // populate config with keys and key-value pairs from the URL
  location.hash
    .split('#')
    .slice(1)
    .forEach((piece) => {
      let key: string
      let valueList: string[]
      let value: any
      if (piece.includes('=')) {
        ;[key, ...valueList] = piece.split('=')
        value = valueList.join('=')
        if (!isNaN(value)) {
          value = +value
        }
      } else {
        key = piece
        value = true
      }

      infoObject[key] = () => value
    })

  return indirectResolve<T>(infoObject)
}

export let resolveSearch = <T>(location: Location, defaultConfig: InfoObject<T>) => {
  let infoObject = { ...defaultConfig }

  let search = new URLSearchParams(location.search)

  ;[...search.entries()].forEach(([key, value]: [string, any]) => {
    if (value === '') {
      value = true
    } else if (!isNaN(value)) {
      value = +value
    }
    infoObject[key] = () => value
  })

  return indirectResolve<T>(infoObject)
}
