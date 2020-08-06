const mockToArray = jest.fn()
const mockSort = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFind = jest.fn().mockReturnValue({ sort: mockSort })
const mockFindOne = jest.fn()
const datetime = new Date('2019-11-07T11:15:00Z')
const dateTimestamp = new Date('2019-11-07T05:15:00.000Z')

const mockGetCollection = jest.fn().mockResolvedValue({
  find: mockFind,
  findOne: mockFindOne,
})

import { mongo } from '@lighthouse/serverless-common'
import * as dateFns from 'date-fns'
import * as MockDate from 'mockdate'

import { getShiftReportLinks } from './'
import * as mockData from './fixtures'

mongo.getCollection = mockGetCollection

describe('helpers:getShiftReportLinks', () => {
  beforeEach(() => {
    process.env.S3_BASE_URL = mockData.S3_BASE_URL
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    MockDate.reset()
    jest.clearAllMocks()
  })

  it('should process shift and return link details for summary report for user', async () => {
    mockFindOne.mockResolvedValue(mockData.user)

    const result = await getShiftReportLinks({
      datetime,
      shift: mockData.shift,
      withFormSubmissions: false,
    })

    expect(mockGetCollection).toHaveBeenCalledTimes(1)
    expect(mockGetCollection).toBeCalledWith('users')

    // user query
    expect(mockFindOne).toBeCalledWith({
      _id: new mongo.ObjectId('5be365d9c68b740001d20001'),
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: `${mockData.S3_BASE_URL}/${mockData.SUMMARY_REPORT_PATH}`,
      lastName: 'Jobs',
      fullName: 'Steve Jobs',
      timestamp: dateTimestamp,
    })
  })

  it('should process shift and return link details for full report for user', async () => {
    const result = await getShiftReportLinks({
      datetime,
      shift: mockData.shift,
      withFormSubmissions: true,
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: `${mockData.S3_BASE_URL}/${mockData.SUMMARY_REPORT_AND_FORMS_PATH}`,
      lastName: 'Jobs',
      fullName: 'Steve Jobs',
      timestamp: dateTimestamp,
    })
  })

  it('should set the link to null if timestamp greater than 24 hours ago', async () => {
    const timestamp = dateFns.subDays(new Date(), 2)

    const MOCK_SHIFT = {
      ...mockData.shift,
      files: {
        activityReportSummary: {
          path: mockData.SUMMARY_REPORT_PATH,
          timestamp,
        },
      },
    }

    const result = await getShiftReportLinks({
      datetime,
      shift: MOCK_SHIFT,
      withFormSubmissions: false,
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: null,
      lastName: 'Jobs',
      fullName: 'Steve Jobs',
      timestamp: timestamp,
    })
  })

  it('should set link to null if no pdf data on location', async () => {
    const MOCK_SHIFT = {
      _id: '5be365d9c68b740001d27ba7',
      user: '5be365d9c68b740001d20001',
    }

    const result = await getShiftReportLinks({
      datetime,
      shift: MOCK_SHIFT,
      withFormSubmissions: true,
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: null,
      lastName: 'Jobs',
      fullName: 'Steve Jobs',
      timestamp: null,
    })
  })
})
