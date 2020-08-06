import { parseQueryParams } from './index'
import mongoDb from 'mongodb'

describe('parse-query-params', () => {
  it('should cast any ObjectIds when building up the query params', () => {
    const _id = '5ca1850cfc13ae346e000000'
    const name = 'Application 0'

    const result = parseQueryParams({ _id, name })

    expect(result).toEqual({
      _id: new mongoDb.ObjectId(_id),
      name: 'Application 0',
    })
  })
})
