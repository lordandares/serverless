import { mongo } from '@lighthouse/serverless-common'
import * as MockDate from 'mockdate'

import { getShiftSummaryData } from './'
import * as mockData from './fixtures'

const mockToArray = jest.fn().mockResolvedValue([])
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFindOne = jest.fn().mockResolvedValue({})
const mockCollection = jest
  .fn()
  .mockReturnValue({ find: mockFind, findOne: mockFindOne })
const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })
const mockClient = jest.fn().mockResolvedValue({ db: mockDb })

mongo.createClient = mockClient

describe('helpers:getShiftSummaryData', () => {
  beforeEach(() => {
    process.env.MONGODB_SECRET_ID = mockData.secretId
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('should create mongo client passing secret id', async () => {
    expect.assertions(2)

    mockFindOne.mockResolvedValueOnce(mockData.shift)

    await getShiftSummaryData(mockData.payload)

    expect(mongo.createClient).toHaveBeenCalledTimes(1)
    expect(mongo.createClient).toBeCalledWith(mockData.secretId)
  })

  it('should handle missing required params', async () => {
    await expect(getShiftSummaryData({})).rejects.toThrow(
      /Missing required params/,
    )
  })

  it('should skip for shift that exceeds the max duration', async () => {
    expect.assertions(5)

    mockFindOne.mockResolvedValueOnce({
      ...mockData.shift,
      duration: 108000000,
    })

    try {
      await getShiftSummaryData(mockData.payload)
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[Error: Shift duration exceeded, shift: ${mockData.shift._id}]`,
      )
      expect(mockDb).toHaveBeenCalledTimes(1)
      expect(mockCollection).toHaveBeenCalledTimes(1)
      expect(mockFindOne).toHaveBeenCalledTimes(1)
      expect(mockFind).not.toHaveBeenCalled()
    }
  })

  it('should skip for shift that does not have end time', async () => {
    expect.assertions(5)

    mockFindOne.mockResolvedValueOnce({
      ...mockData.shift,
      end: {},
    })

    try {
      await getShiftSummaryData(mockData.payload)
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[Error: Shift start or end times does not exist, shift: ${
          mockData.shift._id
        }]`,
      )
      expect(mockDb).toHaveBeenCalledTimes(1)
      expect(mockCollection).toHaveBeenCalledTimes(1)
      expect(mockFindOne).toHaveBeenCalledTimes(1)
      expect(mockFind).not.toHaveBeenCalled()
    }
  })

  it('should skip for shift that does not have start and end times', async () => {
    expect.assertions(5)

    mockFindOne.mockResolvedValueOnce({
      ...mockData.shift,
      end: {},
      start: {},
    })

    try {
      await getShiftSummaryData(mockData.payload)
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[Error: Shift start or end times does not exist, shift: ${
          mockData.shift._id
        }]`,
      )
      expect(mockDb).toHaveBeenCalledTimes(1)
      expect(mockCollection).toHaveBeenCalledTimes(1)
      expect(mockFindOne).toHaveBeenCalledTimes(1)
      expect(mockFind).not.toHaveBeenCalled()
    }
  })

  it('should return all data', async () => {
    mockFindOne
      .mockResolvedValueOnce(mockData.shift)
      .mockResolvedValueOnce(mockData.application)
      .mockResolvedValueOnce(mockData.user)
    mockToArray
      .mockResolvedValueOnce(mockData.events)
      .mockResolvedValueOnce(mockData.locations)
      .mockResolvedValueOnce(mockData.zones)
      .mockResolvedValueOnce(mockData.audits)
      .mockResolvedValueOnce(mockData.issues)
      .mockResolvedValueOnce(mockData.tasks)

    const data = await getShiftSummaryData(mockData.payload)

    expect(mockDb).toHaveBeenCalledTimes(1)
    expect(mockCollection).toHaveBeenCalledTimes(9)
    expect(mockFindOne).toHaveBeenCalledTimes(3)
    expect(mockFind).toHaveBeenCalledTimes(6)
    expect(mockToArray).toHaveBeenCalledTimes(6)

    expect(data).toEqual({
      application: mockData.application,
      applicationId: mockData.shift.application,
      audits: mockData.audits,
      events: mockData.events,
      issues: mockData.issues,
      locations: mockData.locations,
      shift: mockData.shift,
      tasks: mockData.tasks,
      timestamp: mockData.shift.start.time,
      timezone: mockData.shift.properties.timezone,
      user: mockData.user,
      zones: mockData.zones,
    })
  })
})
