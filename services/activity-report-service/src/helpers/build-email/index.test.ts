const mockGetLocationReportLinks = jest.fn()

jest.mock('../get-location-report-links', () => ({
  getLocationReportLinks: mockGetLocationReportLinks,
}))

import * as MockDate from 'mockdate'

import { buildEmail } from './'

describe('helpers:buildEmail', () => {
  const MOCK_ACTIVE_LINK = {
    id: '565fe59257c5d59e60cc35a2',
    name: 'Active Location',
    link: 'http://link.com',
  }

  const MOCK_INACTIVE_LINK = {
    id: '565fe59257c5d59e60cc35a3',
    name: 'Inactive Location',
    link: null,
  }

  const MOCK_STAGE = 'production'

  const MOCK_USER_DETAILS = {
    email: 'testing@test.com',
    firstName: 'Steve',
    locations: [
      {
        _id: '565fe59257c5d59e60cc35a2',
        name: 'Active Location',
      },
      {
        _id: '565fe59257c5d59e60cc35a3',
        name: 'Inactive Location',
      },
    ],
    preferences: {
      notifications: {
        channels: [
          {
            enabled: true,
            name: 'daily-location-report',
            options: {
              hours: 9,
              timezone: 'America/Los_Angeles',
              formSubmissions: true,
            },
          },
        ],
      },
    },
    timezone: 'America/Los_Angeles',
  }

  const MOCK_USER_DETAILS_SUMMARY = {
    email: 'testing@test.com',
    firstName: 'Steve',
    locations: [
      {
        _id: '565fe59257c5d59e60cc35a2',
        name: 'Active Location',
      },
      {
        _id: '565fe59257c5d59e60cc35a3',
        name: 'Inactive Location',
      },
    ],
    preferences: {
      notifications: {
        channels: [
          {
            enabled: true,
            name: 'daily-location-report',
            options: {
              hours: 9,
              timezone: 'America/Los_Angeles',
              formSubmissions: false,
            },
          },
        ],
      },
    },
    timezone: 'America/Los_Angeles',
  }

  beforeEach(() => {
    process.env.SES_CONFIGURATION_SET_NAME = ''
    process.env.STAGE = MOCK_STAGE
    MockDate.set('2000-01-01T13:00:00.000Z') // LA 2000-01-01T05:00:00.000Z UTC -7
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('handles error and returns false', async () => {
    const error = new Error('Location error')
    mockGetLocationReportLinks.mockRejectedValue(error)

    const result = await buildEmail(MOCK_USER_DETAILS)

    expect(result).toEqual(false)
  })

  it('it returns email data', async () => {
    mockGetLocationReportLinks
      .mockResolvedValueOnce(MOCK_ACTIVE_LINK)
      .mockResolvedValue(MOCK_INACTIVE_LINK)

    const result = await buildEmail(MOCK_USER_DETAILS)

    expect(mockGetLocationReportLinks).toHaveBeenCalledTimes(2)
    expect(mockGetLocationReportLinks).toHaveBeenCalledWith({
      location: {
        _id: '565fe59257c5d59e60cc35a2',
        name: 'Active Location',
      },
      withFormSubmissions: true,
    })
    expect(mockGetLocationReportLinks).toHaveBeenCalledWith({
      location: {
        _id: '565fe59257c5d59e60cc35a3',
        name: 'Inactive Location',
      },
      withFormSubmissions: true,
    })

    expect(result).toMatchSnapshot()
  })

  it('it returns email data with formSubmissions', async () => {
    mockGetLocationReportLinks
      .mockResolvedValueOnce(MOCK_ACTIVE_LINK)
      .mockResolvedValue(MOCK_INACTIVE_LINK)

    const result = await buildEmail(MOCK_USER_DETAILS)

    expect(mockGetLocationReportLinks).toHaveBeenCalledWith({
      location: {
        _id: '565fe59257c5d59e60cc35a2',
        name: 'Active Location',
      },
      withFormSubmissions: true,
    })

    expect(result).toMatchSnapshot()
  })

  it('it returns email data without formSubmissions', async () => {
    mockGetLocationReportLinks
      .mockResolvedValueOnce(MOCK_ACTIVE_LINK)
      .mockResolvedValue(MOCK_INACTIVE_LINK)

    const result = await buildEmail(MOCK_USER_DETAILS_SUMMARY)

    expect(mockGetLocationReportLinks).toHaveBeenCalledWith({
      location: {
        _id: '565fe59257c5d59e60cc35a2',
        name: 'Active Location',
      },
      withFormSubmissions: false,
    })

    expect(result).toMatchSnapshot()
  })

  it('it returns email data with configuration set when the environment var is set', async () => {
    process.env.SES_CONFIGURATION_SET_NAME = 'ses-configuration-set'
    mockGetLocationReportLinks
      .mockResolvedValueOnce(MOCK_ACTIVE_LINK)
      .mockResolvedValue(MOCK_INACTIVE_LINK)

    const result = await buildEmail(MOCK_USER_DETAILS)

    expect(result).toMatchSnapshot()
  })

  describe('when not running in production', () => {
    beforeEach(() => {
      process.env.STAGE = 'testing'
    })

    it('it sets isProduction as false, adds stage to subject line and uses test template', async () => {
      mockGetLocationReportLinks.mockResolvedValueOnce(MOCK_ACTIVE_LINK)

      const result = await buildEmail(MOCK_USER_DETAILS)
      expect(result).toMatchSnapshot()
    })
  })

  describe('when no active or inactive locations', () => {
    it('it returns email data with hasNoLocations set to true', async () => {
      const userDetails = {
        ...MOCK_USER_DETAILS,
        locations: [],
      }

      const result = await buildEmail(userDetails)
      expect(result).toMatchSnapshot()
    })
  })

  describe('skipNoActivity Tests', () => {
    it('it returns email data with skipNoActivity set to true', async () => {
      const userDetails = {
        ...MOCK_USER_DETAILS,
        preferences: {
          notifications: {
            channels: [
              {
                enabled: true,
                name: 'daily-location-report',
                options: {
                  hours: 9,
                  timezone: 'America/Los_Angeles',
                  formSubmissions: false,
                  skipNoActivity: true,
                },
              },
            ],
          },
        },
      }

      mockGetLocationReportLinks
        .mockResolvedValueOnce(MOCK_ACTIVE_LINK)
        .mockResolvedValue(MOCK_INACTIVE_LINK)

      const result = await buildEmail(userDetails)
      expect(result).toMatchSnapshot()
    })

    it('it returns false with no active locations and skipNoActivity set to true', async () => {
      const userDetails = {
        ...MOCK_USER_DETAILS,
        locations: [
          {
            _id: '565fe59257c5d59e60cc35a3',
            name: 'Inactive Location',
          },
        ],
        preferences: {
          notifications: {
            channels: [
              {
                enabled: true,
                name: 'daily-location-report',
                options: {
                  hours: 9,
                  timezone: 'America/Los_Angeles',
                  formSubmissions: false,
                  skipNoActivity: true,
                },
              },
            ],
          },
        },
      }

      mockGetLocationReportLinks.mockResolvedValue(MOCK_INACTIVE_LINK)

      const result = await buildEmail(userDetails)
      expect(result).toBeFalsy()
    })
  })
})
