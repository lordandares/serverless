const mockToArray = jest.fn().mockReturnValue([
  {
    _id: '600000000000000000000000',
    application: '500000000000000000000000',
  },
  {
    _id: '600000000000000000000001',
    application: '500000000000000000000000',
  },
])
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFindOne = jest.fn()
const mockGetCollection = jest.fn().mockResolvedValue({
  find: mockFind,
  findOne: mockFindOne,
})

import { mongo } from '@lighthouse/serverless-common'
import { fetchLocations } from './index'

mongo.getCollection = mockGetCollection

const MOCK_DATA = [
  {
    _id: '600000000000000000000000',
    application: '500000000000000000000000',
  },
  {
    _id: '600000000000000000000001',
    application: '500000000000000000000000',
  },
]

describe('helpers:fetchLocations', () => {
  it('should error if the required params are invalid', done => {
    expect.assertions(1)

    process.env.MONGODB_SECRET_ID = 'valid-secret'

    fetchLocations('').catch(err => {
      expect(err.message).toMatch(/Missing required environment variables/)
      done()
    })
  })

  it('should fetch locations', done => {
    expect.assertions(3)

    process.env.MONGODB_SECRET_ID = 'lio/application/service/environment'

    fetchLocations('500000000000000000000000').then(locations => {
      expect(locations).toEqual([
        {
          _id: '600000000000000000000000',
          application: '500000000000000000000000',
        },
        {
          _id: '600000000000000000000001',
          application: '500000000000000000000000',
        },
      ])

      expect(mockFind).toHaveBeenCalledTimes(1)
      expect(mockFind).toBeCalledWith({
        application: new mongo.ObjectId('500000000000000000000000'),
        activityReportTriggerTime: {
          $exists: true,
        },
        deleted: { $ne: true },
        timezone: { $exists: true },
      })

      done()
    })
  })
})
