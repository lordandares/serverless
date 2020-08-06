const mockToArray = jest.fn()
const mockSort = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFind = jest.fn().mockReturnValue({ sort: mockSort })
const mockFindOne = jest.fn()

const mockGetCollection = jest.fn().mockResolvedValue({
  find: mockFind,
  findOne: mockFindOne,
})

import { mongo } from '@lighthouse/serverless-common'

import { getShiftDetails } from '.'
import * as mockData from './fixture'

mongo.getCollection = mockGetCollection

describe('helpers:getShiftDetails', () => {
  afterEach(() => jest.clearAllMocks())

  it('it returns filtered shifts when there are area location permissions', async () => {
    expect.assertions(6)
    const datetime = new Date('2019-11-07T11:15:00Z')

    mockToArray.mockResolvedValue(mockData.shifts)
    mockFindOne.mockResolvedValue(mockData.application)

    const result = await getShiftDetails({ user: mockData.user, datetime })

    expect(mockGetCollection).toHaveBeenCalledTimes(2)
    expect(mockGetCollection).toBeCalledWith('shifts')
    expect(mockGetCollection).toBeCalledWith('applications')

    // shift query
    expect(mockFind).toBeCalledWith({
      application: new mongo.ObjectId(mockData.user.application),
      'end.time': {
        $gte: new Date('2019-11-05T11:15:00Z'),
        $lt: expect.any(Date),
      },
      deleted: { $ne: true },
    })
    expect(mockSort).toBeCalledWith({ 'end.time': -1 })

    expect(result).toMatchSnapshot()
  })

  it('it returns filtered shifts when there are legacy location permissions', async () => {
    expect.assertions(6)

    const datetime = new Date('2019-11-07T11:15:00Z')
    mockFindOne.mockResolvedValue(mockData.application)
    mockToArray.mockResolvedValue(mockData.legacyShifts)

    const result = await getShiftDetails({
      user: mockData.legacyUser,
      datetime,
    })

    expect(mockGetCollection).toHaveBeenCalledTimes(2)
    expect(mockGetCollection).toBeCalledWith('shifts')
    expect(mockGetCollection).toBeCalledWith('applications')

    // shift query
    expect(mockFind).toBeCalledWith({
      application: new mongo.ObjectId(mockData.legacyUser.application),
      'end.time': {
        $gte: new Date('2019-11-05T11:15:00Z'),
        $lt: expect.any(Date),
      },
      deleted: { $ne: true },
    })
    expect(mockSort).toBeCalledWith({ 'end.time': -1 })

    expect(result).toMatchSnapshot()
  })

  it('it returns all shifts when the user has no location permissions', async () => {
    expect.assertions(6)

    const datetime = new Date('2019-11-05T11:15:00Z')
    mockFindOne.mockResolvedValue(mockData.application)
    mockToArray.mockResolvedValue(mockData.shifts)

    const result = await getShiftDetails({
      datetime,
      user: mockData.userWithNoPermissions,
    })

    expect(mockGetCollection).toHaveBeenCalledTimes(2)
    expect(mockGetCollection).toBeCalledWith('shifts')
    expect(mockGetCollection).toBeCalledWith('applications')

    // shift query
    expect(mockFind).toBeCalledWith({
      application: new mongo.ObjectId(
        mockData.userWithNoPermissions.application,
      ),
      'end.time': {
        $gte: new Date('2019-11-03T11:15:00Z'),
        $lt: expect.any(Date),
      },
      deleted: { $ne: true },
    })
    expect(mockSort).toBeCalledWith({ 'end.time': -1 })

    expect(result).toMatchSnapshot()
  })

  it('it returns all locations when the legacy user has no location permissions', async () => {
    expect.assertions(6)

    const datetime = new Date('2019-11-07T11:15:00Z')
    mockFindOne.mockResolvedValue(mockData.application)
    mockToArray.mockResolvedValue(mockData.legacyShifts)

    const result = await getShiftDetails({
      datetime,
      user: mockData.userWithNoPermissions,
    })

    expect(mockGetCollection).toHaveBeenCalledTimes(2)
    expect(mockGetCollection).toBeCalledWith('shifts')
    expect(mockGetCollection).toBeCalledWith('applications')

    // shift query
    expect(mockFind).toBeCalledWith({
      application: new mongo.ObjectId(
        mockData.userWithNoPermissions.application,
      ),
      'end.time': {
        $gte: new Date('2019-11-05T11:15:00Z'),
        $lt: expect.any(Date),
      },
      deleted: { $ne: true },
    })
    expect(mockSort).toBeCalledWith({ 'end.time': -1 })

    expect(result).toMatchSnapshot()
  })

  it('handles error when returning shifts and returns false', async () => {
    expect.assertions(1)

    const error = new Error('Location error')
    const datetime = new Date('2019-11-07T11:15:00Z')

    mockFindOne.mockResolvedValue(mockData.application)
    mockToArray.mockRejectedValue(error)

    const user = {
      ...mockData.user,
      application: '565fe59257c5d59e60cc35d2',
    }

    const result = await getShiftDetails({
      datetime,
      user,
    })

    expect(result).toEqual(false)
  })
})
