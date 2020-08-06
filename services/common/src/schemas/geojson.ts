import { array, number, object, string } from 'yup'

export const positionSchema = array().of(number())

export const pointSchema = object().shape({
  type: string()
    .required()
    .test('isPoint', 'type should be `Point`', value => value === 'Point'),
  coordinates: positionSchema
    .required()
    .min(2)
    .max(2),
})

export const polygonSchema = object().shape({
  type: string()
    .required()
    .test(
      'isPolygon',
      'type should be `Polygon`',
      value => value === 'Polygon',
    ),
  coordinates: array()
    .of(positionSchema)
    .required()
    .min(4),
})
