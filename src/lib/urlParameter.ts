import { InfoObject, indirectResolve } from './indirectResolver'

export let ensureSpacelessURL = (location: Location) => {
  let spaceLessURL = location.href.replace(/ |%20/g, '')

  if (location.href !== spaceLessURL) {
    location.replace(spaceLessURL)
  }
}

export let resolveHash = <T extends Record<string, any>>(
  location: Location,
  defaultConfig: InfoObject<T>,
) => {
  let infoObject: Record<string, any> = { ...defaultConfig }

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

      infoObject[key] = [() => value, infoObject[key][1]]
    })

  return indirectResolve<T>(infoObject as InfoObject<T>)
}

export let resolveSearch = <T extends Record<string, any>>(
  location: Location,
  defaultConfig: InfoObject<T>,
) => {
  let infoObject: Record<string, any> = { ...defaultConfig }

  let search = new URLSearchParams(location.search)

  ;[...search.entries()].forEach(([key, value]: [string, any]) => {
    if (!infoObject[key]) {
      return
    }
    if (value === '') {
      value = true
    } else if (!isNaN(value)) {
      value = +value
    }
    infoObject[key] = [() => value, infoObject[key][1]]
  })

  return indirectResolve<T>(infoObject as InfoObject<T>)
}
