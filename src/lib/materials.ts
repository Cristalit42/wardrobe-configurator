import type { MaterialId } from '../types'

export const MATERIALS: Record<MaterialId, { name: string; color: string; edge: string }> = {
  white: { name: 'Белый', color: '#f4f2ee', edge: '#d8d4cc' },
  oak: { name: 'Дуб сонома', color: '#d2ad7c', edge: '#b48c5c' },
  walnut: { name: 'Орех', color: '#7a5236', edge: '#5e3e28' },
  graphite: { name: 'Графит', color: '#4a4c50', edge: '#36383b' },
}
