export let create = <K extends keyof HTMLElementTagNameMap>(
  name: K,
  attribute: Partial<Omit<HTMLElementTagNameMap[K], 'style'>> & {
    style?: Partial<CSSStyleDeclaration>
  } = {},
  children: Element[] = [],
) => {
  // Create element
  let elem = document.createElement<K>(name)

  // Copy each attribute
  Object.entries(attribute).forEach(([name, value]) => {
    if (name === 'style') {
      Object.assign(elem.style, value)
      return
    }

    const elemRecord = elem as unknown as Record<string, unknown>
    if (elemRecord[name] !== undefined) {
      elemRecord[name] = value
    } else {
      elem.setAttribute(name, value as any)
    }
  })

  // Insert each child
  children.forEach((child) => {
    elem.appendChild(child)
  })

  return elem
}
