const mockToArray = jest.fn()
const mockSort = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFind = jest.fn().mockReturnValue({ sort: mockSort })
const mockFindOne = jest.fn()

const mockGetCollection = jest.fn().mockResolvedValue({
  find: mockFind,
  findOne: mockFindOne,
})

import { mongo } from '@lighthouse/serverless-common'

import { getUserDetails } from './'

mongo.getCollection = mockGetCollection

describe('helpers:getUserDetails', () => {
  const MOCK_APPLICATION = {
    _id: '565fe59257c5d59e60cc35b1',
    name: 'Testing Application',
  }

  const MOCK_USER = {
    application: '565fe59257c5d59e60cc35b5',
    email: 'testing@test.com',
    firstName: 'Testing',
    preferences: {
      notifications: {
        channels: [
          {
            enabled: true,
            name: 'daily-location-report',
            options: {
              hours: 9,
              timezone: 'America/Los_Angeles',
            },
          },
        ],
      },
    },
    permissions: [
      {
        module: 'location',
        type: 'document',
        value: '565fe59257c5d59e60cc35b3',
      },
      {
        module: 'zone',
        type: 'module',
        value: '565fe59257c5d59e60cc35b6',
      },
    ],
  }

  afterEach(() => jest.clearAllMocks())

  it('it returns user details', async () => {
    expect.assertions(4)

    mockFindOne.mockResolvedValue(MOCK_APPLICATION)

    const result = await getUserDetails(MOCK_USER)

    expect(mockGetCollection).toHaveBeenCalledTimes(1)
    expect(mockGetCollection).toBeCalledWith('applications')

    // application query
    expect(mockFindOne).toBeCalledWith({
      _id: new mongo.ObjectId(MOCK_USER.application),
    })

    expect(result).toMatchSnapshot()
  })

  it('handles error when returning applications and returns false', async () => {
    expect.assertions(1)

    const error = new Error('Application error')
    mockFindOne.mockRejectedValue(error)

    const result = await getUserDetails({
      ...MOCK_USER,
      application: '565fe59257c5d59e60cc35d1',
    })

    expect(result).toEqual(undefined)
  })
})
