import { pointSchema, polygonSchema } from './geojson'

describe('Point', () => {
  test('valid', () => {
    expect(() =>
      pointSchema.validateSync(
        {
          type: 'Point',
          coordinates: [90, -90],
        },
        { strict: true },
      ),
    ).not.toThrow()
  })

  test('invalid', () => {
    expect(() =>
      pointSchema.validateSync(
        {
          type: 'Polygon',
          coordinates: [90, -90],
        },
        { strict: true },
      ),
    ).toThrow()

    expect(() =>
      pointSchema.validateSync(
        {
          type: 'Point',
          coordinates: [90],
        },
        { strict: true },
      ),
    ).toThrow()

    expect(() =>
      pointSchema.validateSync(
        {
          type: 'Point',
          coordinates: [1, 2, 3],
        },
        { strict: true },
      ),
    ).toThrow()
  })
})

describe('Polygon', () => {
  test('valid', () => {
    expect(() =>
      polygonSchema.validateSync(
        {
          type: 'Polygon',
          coordinates: [[1, 1], [2, 2], [3, 3], [1, 1]],
        },
        { strict: true },
      ),
    ).not.toThrow()
  })

  test('invalid', () => {
    expect(() =>
      polygonSchema.validateSync(
        {
          type: 'MultiPolygon',
          coordinates: [[1, 1], [2, 2], [3, 3], [1, 1]],
        },
        { strict: true },
      ),
    ).toThrow()
  })

  test('invalid', () => {
    expect(() =>
      polygonSchema.validateSync(
        {
          type: 'Polygon',
          coordinates: [[1, 1], [2, 2], [3, 3]],
        },
        { strict: true },
      ),
    ).toThrow()
  })
})
