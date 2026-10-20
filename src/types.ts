export type SectionType = 'shelves' | 'hanger'

export interface Section {
  type: SectionType
  shelves: number
}

export interface Config {
  width: number
  height: number
  depth: number
  sections: Section[]
  doors: boolean
  material: MaterialId
}

export type MaterialId = 'white' | 'oak' | 'graphite' | 'walnut'

export type PartKind = 'carcass' | 'shelf' | 'back' | 'door' | 'rod' | 'plinth'

export interface Part {
  name: string
  kind: PartKind
  // центр детали и её габариты, мм; x — слева направо, y — снизу вверх, z — от задней стенки к фасаду
  pos: [number, number, number]
  size: [number, number, number]
}

export interface SpecRow {
  name: string
  length: number
  width: number
  thickness: number
  qty: number
}
