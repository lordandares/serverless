const mockToArray = jest.fn().mockResolvedValue([])
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFindOne = jest.fn().mockResolvedValue({})
const mockCollection = jest
  .fn()
  .mockReturnValue({ find: mockFind, findOne: mockFindOne })
const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })
const mockClient = jest.fn().mockResolvedValue({ db: mockDb })

import { mongo } from '@lighthouse/serverless-common'
import * as MockDate from 'mockdate'

mongo.createClient = mockClient

import { getSummaryData } from './'

describe('helpers:getSummaryData', () => {
  const MOCK_PAYLOAD = {
    end: '2000-01-01T12:00:00.000Z',
    locationId: '5bff0da28d7c870001a01638',
    start: '2000-01-01T00:00:00.000Z',
  }

  const MOCK_LOCATION = {
    _id: MOCK_PAYLOAD.locationId,
    application: '5bff0da28d7c870001a01639',
    name: 'Testing Location',
    timezone: 'Australia/Melbourne',
  }

  const MOCK_LOCATIONS = [MOCK_LOCATION]
  const MOCK_SECRET_ID = 'lio/serverless/dar-service/secretId'

  beforeEach(() => {
    process.env.MONGODB_SECRET_ID = MOCK_SECRET_ID
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('should create mongo client passing secret id', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mongo.createClient).toHaveBeenCalledTimes(1)
    expect(mongo.createClient).toBeCalledWith(MOCK_SECRET_ID)
  })

  it('should handle missing required params', async () => {
    await expect(getSummaryData({})).rejects.toThrow(/Missing required params/)
  })

  it('should handle missing location', async () => {
    mockFindOne.mockResolvedValueOnce(null)

    await expect(getSummaryData(MOCK_PAYLOAD)).rejects.toThrow(
      /Location missing: 5bff0da28d7c870001a01638/,
    )
  })

  it('should handle location missing timezone', async () => {
    mockFindOne.mockResolvedValueOnce({})

    await expect(getSummaryData(MOCK_PAYLOAD)).rejects.toThrow(
      /Location missing timezone: 5bff0da28d7c870001a01638/,
    )
  })

  it('should query for the location', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[0]).toEqual(['locations'])
    expect(mockFindOne.mock.calls[0]).toEqual([
      {
        _id: new mongo.ObjectId(MOCK_LOCATION._id),
      },
    ])
  })

  it('should query for the locations', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[1]).toEqual(['locations'])
    expect(mockFind.mock.calls[0]).toEqual([
      {
        application: new mongo.ObjectId(MOCK_LOCATION.application),
      },
    ])
  })

  it('should query for the application', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[2]).toEqual(['applications'])
    expect(mockFindOne.mock.calls[1]).toEqual([
      {
        _id: new mongo.ObjectId(MOCK_LOCATION.application),
      },
    ])
  })

  it('should query for the application users', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[3]).toEqual(['applicationusers'])
    expect(mockFind.mock.calls[1]).toEqual([
      {
        application: new mongo.ObjectId(MOCK_LOCATION.application),
      },
    ])
  })

  it('should query for the location audit entries', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[4]).toEqual(['auditentries'])
    expect(mockFind.mock.calls[2]).toEqual([
      {
        application: new mongo.ObjectId(MOCK_LOCATION.application),
        createdAt: {
          $gte: new Date('2000-01-01T00:00:00.000Z'),
          $lte: new Date('2000-01-01T12:00:00.000Z'),
        },
        location: new mongo.ObjectId(MOCK_LOCATION._id),
      },
    ])
  })

  it('should query for the location enter events', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[5]).toEqual(['events'])
    expect(mockFind.mock.calls[3]).toEqual([
      {
        application: new mongo.ObjectId(MOCK_LOCATION.application),
        location: new mongo.ObjectId(MOCK_LOCATION._id),
        timestamp: {
          $gte: new Date('2000-01-01T00:00:00.000Z'),
          $lte: new Date('2000-01-01T12:00:00.000Z'),
        },
        type: 'enter',
      },
    ])
  })

  it('should query for the location issues', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[6]).toEqual(['issues'])
    expect(mockFind.mock.calls[4]).toEqual([
      {
        application: new mongo.ObjectId(MOCK_LOCATION.application),
        createdAt: {
          $gte: new Date('2000-01-01T00:00:00.000Z'),
          $lte: new Date('2000-01-01T12:00:00.000Z'),
        },
        location: new mongo.ObjectId(MOCK_LOCATION._id),
      },
    ])
  })

  it('should query for the location tasks', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[7]).toEqual(['taskentries'])
    expect(mockFind.mock.calls[5]).toEqual([
      {
        application: new mongo.ObjectId(MOCK_LOCATION.application),
        createdAt: {
          $gte: new Date('2000-01-01T00:00:00.000Z'),
          $lte: new Date('2000-01-01T12:00:00.000Z'),
        },
        location: new mongo.ObjectId(MOCK_LOCATION._id),
      },
    ])
  })

  it('should query for the location zones', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[8]).toEqual(['zones'])
    expect(mockFind.mock.calls[6]).toEqual([
      {
        application: new mongo.ObjectId(MOCK_LOCATION.application),
        location: new mongo.ObjectId(MOCK_LOCATION._id),
      },
    ])
  })

  it('should query for the users', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)
    mockToArray
      .mockResolvedValueOnce([
        /* locations */
      ])
      .mockResolvedValueOnce([
        /* applicationuser */
        { user: '565fe59257c5d59e60cc35a2' },
        { user: '565fe59257c5d59e60cc35a3' },
        { user: '565fe59257c5d59e60cc35a4' },
      ])
      .mockResolvedValue([
        /* everything else... */
      ])

    await getSummaryData(MOCK_PAYLOAD)

    expect(mockCollection.mock.calls[9]).toEqual(['users'])
    expect(mockFind.mock.calls[7]).toEqual([
      {
        _id: {
          $in: [
            '565fe59257c5d59e60cc35a2',
            '565fe59257c5d59e60cc35a3',
            '565fe59257c5d59e60cc35a4',
          ],
        },
      },
      {
        projection: {
          firstName: 1,
          lastName: 1,
        },
      },
    ])
  })

  it('should return all data', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_LOCATION)

    const data = await getSummaryData(MOCK_PAYLOAD)

    expect(mockDb).toHaveBeenCalledTimes(1)
    expect(mockCollection).toHaveBeenCalledTimes(10)
    expect(mockFindOne).toHaveBeenCalledTimes(2)
    expect(mockFind).toHaveBeenCalledTimes(8)
    expect(mockToArray).toHaveBeenCalledTimes(8)

    expect(data).toEqual({
      application: {},
      audits: [],
      end: MOCK_PAYLOAD.end,
      events: [],
      issues: [],
      location: MOCK_LOCATION,
      locations: [],
      start: MOCK_PAYLOAD.start,
      tasks: [],
      timestamp: '2000-01-01T00:00:00.000Z',
      timezone: MOCK_LOCATION.timezone,
      users: [],
      zones: [],
    })
  })

  describe('when area returned for location', () => {
    const MOCK_LOCATION_WITH_AREA = {
      ...MOCK_LOCATION,
      properties: {
        area: '5bff0da28d7c870001a01639',
      },
    }

    const MOCK_AREA = {
      _id: MOCK_LOCATION_WITH_AREA.properties.area,
      geometry: {
        coordinates: [
          [
            [144.98665809631345, -37.79712984141311],
            [144.98663127422333, -37.79726760509564],
            [144.98681366443634, -37.79729303836279],
            [144.9868431687355, -37.797148916399856],
            [144.98665809631345, -37.79712984141311],
          ],
        ],
        type: 'Polygon',
      },
    }

    it('should query for the area', async () => {
      mockFindOne.mockResolvedValueOnce(MOCK_LOCATION_WITH_AREA)

      await getSummaryData(MOCK_PAYLOAD)

      expect(mockCollection.mock.calls[4]).toEqual(['areas'])
      expect(mockFindOne.mock.calls[2]).toEqual([
        {
          _id: new mongo.ObjectId(MOCK_LOCATION_WITH_AREA.properties.area),
          application: new mongo.ObjectId(MOCK_LOCATION_WITH_AREA.application),
          deleted: false,
        },
      ])
    })

    it('should query audits, events, issues and tasks with $or query', async () => {
      mockFindOne
        .mockResolvedValueOnce(MOCK_LOCATION_WITH_AREA) // getLocation
        .mockResolvedValueOnce({}) // getApplication
        .mockResolvedValueOnce(MOCK_AREA) // getArea

      await getSummaryData(MOCK_PAYLOAD)

      expect(mockCollection.mock.calls[5]).toEqual(['auditentries'])
      expect(mockFind.mock.calls[2]).toMatchSnapshot()

      expect(mockCollection.mock.calls[6]).toEqual(['events'])
      expect(mockFind.mock.calls[3]).toMatchSnapshot()

      expect(mockCollection.mock.calls[7]).toEqual(['issues'])
      expect(mockFind.mock.calls[4]).toMatchSnapshot()

      expect(mockCollection.mock.calls[8]).toEqual(['taskentries'])
      expect(mockFind.mock.calls[5]).toMatchSnapshot()
    })
  })
})
