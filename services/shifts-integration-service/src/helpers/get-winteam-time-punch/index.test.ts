import {
  activeShift,
  activeShiftWithBreak,
  endedShift,
  standardUser,
  validAreaLocation,
  validLegacyLocation,
  winteamUser,
} from './fixtures'

const mockFindOne = jest.fn()
const mockGetCollection = jest.fn()

import { mongo } from '@lighthouse/serverless-common'
import * as _ from 'lodash'

mongo.getCollection = mockGetCollection

import {
  getEmployeeReference,
  getJobReference,
  getShiftEntity,
  getWinTeamMessages,
  getWinTeamTimePunch,
} from './'

describe('helpers::getWinteamTimePunch', () => {
  beforeEach(() => jest.resetAllMocks())
  afterAll(() => jest.restoreAllMocks())

  it('should throw an error if event is missing', async () => {
    expect.assertions(1)

    const event = {
      event: '',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        start: {
          area: {
            location: {
              id: 'xxx-yyy-zzz',
            },
          },
          gps: {
            geometry: [45, 60],
          },
          time: '2019-01-23T12:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            enabled: true,
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }
    try {
      await getWinTeamTimePunch(event)
    } catch (err) {
      expect(err.message).toMatch(/Missing event from TimePunch/)
    }
  })

  it('should throw an error if timestamp is missing', async () => {
    expect.assertions(1)

    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        start: {
          area: {
            location: {
              id: 'xxx-yyy-zzz',
            },
          },
          gps: {
            geometry: [45, 60],
          },
          time: '',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }
    try {
      await getWinTeamTimePunch(event)
    } catch (err) {
      expect(err.message).toMatch(/Missing timestamp from TimePunch/)
    }
  })

  it('should return if a WinTeam employee reference (id or number) cannot be found', async () => {
    expect.assertions(1)
    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        start: {
          gps: {
            geometry: [45, 60],
          },
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {},
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toBeUndefined()
  })

  it('should return an employeeId and Punch Time if no location data is present', async () => {
    expect.assertions(1)

    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        start: {
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toEqual({
      EmployeeNumber: 'wt-valid-employee-id',
      PunchTime: '2019-01-23 00:00:00.000+0000',
    })
  })

  it('should prioritise employeeId as an employee reference for the WinTeam payload', async () => {
    expect.assertions(1)
    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        start: {
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toEqual({
      EmployeeNumber: 'wt-valid-employee-id',
      GeoCoordinate: {
        Latitude: 60,
        Longitude: 45,
      },
      PunchTime: '2019-01-23 00:00:00.000+0000',
    })
  })

  it('should fallback to employeeNumber as an employee reference for the WinTeam payload', async () => {
    expect.assertions(1)
    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        start: {
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeNumber: 'wt-valid-employee-number',
            },
          },
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toEqual({
      EmployeeNumber: 'wt-valid-employee-number',
      GeoCoordinate: {
        Latitude: 60,
        Longitude: 45,
      },
      PunchTime: '2019-01-23 00:00:00.000+0000',
    })
  })

  it('should process the shift as an end shift, if an end time is defined', async () => {
    expect.assertions(1)
    const event = {
      event: 'shift-end',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        end: {
          gps: {
            geometry: {
              coordinates: [46, 61],
            },
          },
          time: '2019-01-23T06:00:00.000Z',
        },
        start: {
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toEqual({
      EmployeeNumber: 'wt-valid-employee-id',
      GeoCoordinate: {
        Latitude: 61,
        Longitude: 46,
      },
      PunchTime: '2019-01-23 06:00:00.000+0000',
    })
  })

  it('should attach a Job ID from a legacy location', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValue({
      ...validLegacyLocation,
      plugins: {
        winteam: {
          enabled: true,
          options: {
            jobId: 'wt-valid-job-id',
          },
        },
      },
    })

    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b7000000',
        breaks: [],
        location: '5d5a3fabfc13ae07b7000001',
        start: {
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toEqual({
      EmployeeNumber: 'wt-valid-employee-id',
      GeoCoordinate: {
        Latitude: 60,
        Longitude: 45,
      },
      JobNumber: 'wt-valid-job-id',
      PunchTime: '2019-01-23 00:00:00.000+0000',
    })
  })

  it('should attach a Job number from a legacy location', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValue({
      ...validLegacyLocation,
      plugins: {
        winteam: {
          enabled: true,
          options: {
            jobNumber: 'wt-valid-job-number',
          },
        },
      },
    })

    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        location: '5d5a3fabfc13ae07b7000001',
        start: {
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T12:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toEqual({
      EmployeeNumber: 'wt-valid-employee-id',
      GeoCoordinate: {
        Latitude: 60,
        Longitude: 45,
      },
      JobNumber: 'wt-valid-job-number',
      PunchTime: '2019-01-23 12:00:00.000+0000',
    })
  })

  it('should attach a Job reference (id or number) from an area location', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValue({
      ...validAreaLocation,
      plugins: {
        winteam: {
          enabled: true,
          options: {
            jobId: 'wt-valid-job-id',
          },
        },
      },
    })

    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        start: {
          area: {
            location: {
              id: '5d5a3fabfc13ae07b7000000',
            },
          },
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T12:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toEqual({
      EmployeeNumber: 'wt-valid-employee-id',
      GeoCoordinate: {
        Latitude: 60,
        Longitude: 45,
      },
      JobNumber: 'wt-valid-job-id',
      PunchTime: '2019-01-23 12:00:00.000+0000',
    })
  })

  it('should not attach a Job reference if a location cannot be matched', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValue(null)

    const event = {
      event: 'shift-start',
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        breaks: [],
        start: {
          area: {
            location: {
              id: '5d5a3fabfc13ae07b7000000',
            },
          },
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T12:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamTimePunch(event)

    expect(result).toEqual({
      EmployeeNumber: 'wt-valid-employee-id',
      GeoCoordinate: {
        Latitude: 60,
        Longitude: 45,
      },
      PunchTime: '2019-01-23 12:00:00.000+0000',
    })
  })
})

describe('helpers::getWinTeamMessages', () => {
  beforeEach(() => jest.resetAllMocks())
  afterAll(() => jest.restoreAllMocks())

  it('should return a valid query string', async () => {
    expect.assertions(1)

    const event = {
      result: {
        JobNumber: 'wt-valid-job-id',
      },
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        start: {
          area: {
            location: {
              id: validAreaLocation._id,
            },
          },
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamMessages(event)

    expect(result).toEqual(
      'EmployeeNumber=wt-valid-employee-id&JobNumber=wt-valid-job-id&PunchTime=2019-01-23%2000%3A00%3A00.000%2B0000',
    )
  })

  it('should return with no employee reference', async () => {
    expect.assertions(1)

    const event = {
      result: {
        JobNumber: 'valid-job-id',
      },
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        start: {
          area: {
            location: {
              ...validAreaLocation,
            },
          },
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {},
      },
    }

    const result = await getWinTeamMessages(event)

    expect(result).toBeUndefined()
  })

  it('should return with no job reference', async () => {
    expect.assertions(1)

    const event = {
      result: {
        JobNumber: '',
      },
      shift: {
        application: '5d5a3fabfc13ae07b0000000',
        start: {
          area: {
            location: {
              ...validAreaLocation,
            },
          },
          gps: {
            geometry: {
              coordinates: [45, 60],
            },
          },
          time: '2019-01-23T00:00:00.000Z',
        },
        user: standardUser._id,
      },
      user: {
        ...standardUser,
        plugins: {
          winteam: {
            options: {
              employeeId: 'wt-valid-employee-id',
            },
          },
        },
      },
    }

    const result = await getWinTeamMessages(event)

    expect(result).toBeUndefined()
  })
})

describe('helpers::getEmployeeReference', () => {
  it('should return an employeeId when present on the user', () => {
    expect.assertions(1)

    expect(getEmployeeReference(winteamUser)).toEqual({
      EmployeeNumber: 'wt-employee-id',
    })
  })

  it('should return an employeeNumber when present on the user', () => {
    expect.assertions(1)

    const user = {
      ...standardUser,
      plugins: {
        winteam: {
          options: {
            employeeNumber: 'wt-employee-number',
          },
        },
      },
    }

    expect(getEmployeeReference(user)).toEqual({
      EmployeeNumber: 'wt-employee-number',
    })
  })

  it('should not return a reference if it cannot match an employeeId or employeeNumber', () => {
    expect.assertions(1)

    expect(getEmployeeReference(standardUser)).toBeUndefined()
  })
})

describe('helpers::getShiftEntity', () => {
  it('should return the start shift entity on a shift-start event', () => {
    expect.assertions(1)

    expect(getShiftEntity(activeShift, 'shift-start')).toEqual(
      activeShift.start,
    )
  })

  it('should return the start shift entity on a shift-end event', () => {
    expect.assertions(1)

    expect(getShiftEntity(endedShift, 'shift-end')).toEqual(endedShift.end)
  })

  it('should return the break start entity on a break-start event', () => {
    expect.assertions(1)

    expect(getShiftEntity(activeShiftWithBreak, 'shift-break-start')).toEqual(
      activeShiftWithBreak.breaks[0].start,
    )
  })

  it('should return the break end entity on a break-end event', () => {
    expect.assertions(1)

    expect(getShiftEntity(activeShiftWithBreak, 'shift-break-end')).toEqual(
      activeShiftWithBreak.breaks[0].end,
    )
  })

  it('should return an empty object on an unknown event', () => {
    expect.assertions(1)

    expect(getShiftEntity(activeShiftWithBreak, 'unknown-event')).toEqual({})
  })
})

describe('helpers::getJobReference', () => {
  it('should return a jobId when present on the location', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValue({
      id: validAreaLocation._id,
      plugins: {
        winteam: {
          enabled: true,
          options: {
            jobId: 'wt-valid-job-id',
          },
        },
      },
    })

    expect(
      await getJobReference(
        { area: { location: { id: validAreaLocation._id } } },
        validAreaLocation.application,
      ),
    ).toEqual({
      JobNumber: 'wt-valid-job-id',
    })
  })

  it('should return a jobNumber when present on a legacy location', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValue({
      id: validLegacyLocation._id,
      plugins: {
        winteam: {
          enabled: true,
          options: {
            jobNumber: 'wt-valid-job-number',
          },
        },
      },
    })

    expect(
      await getJobReference(
        {},
        '5d5a3fabfc13ae07b0000000',
        validLegacyLocation._id,
      ),
    ).toEqual({
      JobNumber: 'wt-valid-job-number',
    })
  })

  it('should return undefined with no job number or id', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValue({
      id: validLegacyLocation._id,
      plugins: {
        winteam: {
          enabled: true,
          options: {},
        },
      },
    })

    expect(
      await getJobReference(
        {},
        '5d5a3fabfc13ae07b0000000',
        validLegacyLocation._id,
      ),
    ).toBeUndefined()
  })
})
