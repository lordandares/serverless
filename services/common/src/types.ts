import { Point } from 'geojson'

export interface AreaObject {
  id: string
  center: Point
  name: string
}

export interface AreaReference {
  label: string
  shortLabel: string
  center: Point
  location: AreaObject
  building: AreaObject
  geofence: AreaObject
  floor: AreaObject
  room: AreaObject
  point: AreaObject
}
