export type Kind<TName extends string, TProperties extends {} = {}> = TProperties & { kind: TName }

export interface Size {
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}
