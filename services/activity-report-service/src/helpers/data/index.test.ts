import * as MockDate from 'mockdate'
import { mongo } from '@lighthouse/serverless-common'

import * as data from '.'
import * as mockData from './fixtures'

const mockToArray = jest.fn().mockReturnValue([])
let mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFindOne = jest.fn().mockReturnValue({})
const mockCollection = jest
  .fn()
  .mockReturnValue({ find: mockFind, findOne: mockFindOne })
const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })
const mockClient = jest.fn().mockResolvedValue({ db: mockDb })

mongo.createClient = mockClient

describe('helpers:getData', () => {
  let db

  beforeEach(async () => {
    MockDate.set('2000-01-01T00:00:00.000Z')
    const client = await mongo.createClient(mockData.secretId)
    db = client.db()
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('should handle missing shift', async () => {
    mockFindOne.mockReturnValueOnce(null)

    const shiftId = '5c18e2d030148e00017e9bdf'
    await expect(data.getShift({ db, shiftId })).rejects.toThrow(
      /Shift missing: 5c18e2d030148e00017e9bdf/,
    )
  })

  it('should handle missing user', async () => {
    mockFindOne.mockReturnValueOnce(null)

    const userId = '5bb7d1c618c1bb0001e8028b'
    await expect(data.getUser({ db, userId })).rejects.toThrow(
      /User missing: 5bb7d1c618c1bb0001e8028b/,
    )
  })

  it('should handle missing location', async () => {
    mockFindOne.mockReturnValueOnce(null)

    const locationId = '7bb7d2c618c1bb0001e8028a'
    await expect(data.getLocation({ db, locationId })).rejects.toThrow(
      /Location missing: 7bb7d2c618c1bb0001e8028a/,
    )
  })

  it('should handle location missing timezone', async () => {
    mockFindOne.mockReturnValueOnce({})

    const locationId = '7bb7d2c618c1bb0001e8028a'
    await expect(data.getLocation({ db, locationId })).rejects.toThrow(
      /Location missing timezone: 7bb7d2c618c1bb0001e8028a/,
    )
  })

  it('should query for the location', async () => {
    const { location } = mockData
    mockFindOne.mockReturnValueOnce(location)

    const { _id: locationId } = location
    await data.getLocation({ db, locationId })

    expect(mockCollection.mock.calls[0]).toEqual(['locations'])
    expect(mockFindOne.mock.calls[0]).toEqual([
      {
        _id: new mongo.ObjectId(location._id),
      },
    ])
  })

  it('should query for the locations', async () => {
    mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
    mockToArray.mockReturnValueOnce(mockData.locations)

    const { application: applicationId, locations } = mockData
    const resultLocations = await data.getLocations({ db, applicationId })

    expect(mockCollection.mock.calls[0]).toEqual(['locations'])
    expect(mockToArray).toHaveBeenCalledTimes(1)
    expect(resultLocations).toEqual(locations)
  })

  it('should query for the zones', async () => {
    mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
    mockToArray.mockReturnValueOnce(mockData.zones)

    const { application: applicationId, zones } = mockData
    const resultZones = await data.getZones({ db, applicationId })

    expect(mockCollection.mock.calls[0]).toEqual(['zones'])
    expect(mockToArray).toHaveBeenCalledTimes(1)
    expect(resultZones).toEqual(zones)
  })

  it('should query for the location audit entries', async () => {
    const {
      application: applicationId,
      audits,
      shift: { end, start },
      user: { _id: userId },
    } = mockData

    mockToArray.mockReturnValueOnce(audits)

    const resultAudits = await data.getEntries({
      applicationId,
      collection: 'auditentries',
      db,
      start,
      end,
      userId,
    })

    expect(mockCollection.mock.calls[0]).toEqual(['auditentries'])
    expect(mockToArray).toHaveBeenCalledTimes(1)
    expect(resultAudits).toEqual(audits)
  })
})
