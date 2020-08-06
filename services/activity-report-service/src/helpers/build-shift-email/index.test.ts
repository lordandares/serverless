const mockGetShiftReportLinks = jest.fn()
const datetime = new Date('2019-11-07T11:15:00Z')

jest.mock('../get-shift-report-links', () => ({
  getShiftReportLinks: mockGetShiftReportLinks,
}))

import * as MockDate from 'mockdate'

import { buildShiftEmail } from './'
import * as mockData from './fixtures'

describe('helpers:buildShiftEmail', () => {
  beforeEach(() => {
    process.env.SES_CONFIGURATION_SET_NAME = ''
    process.env.STAGE = mockData.STAGE
    MockDate.set('2000-01-01T13:00:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('handles error and returns false', async () => {
    const error = new Error('Shift error')
    mockGetShiftReportLinks.mockRejectedValue(error)

    const result = await buildShiftEmail({
      userDetails: mockData.user_details_summary_and_forms,
      datetime,
    })

    expect(result).toEqual(false)
  })

  it('it returns email data', async () => {
    mockGetShiftReportLinks
      .mockResolvedValueOnce(mockData.active_link)
      .mockResolvedValue(mockData.inactive_link)

    const result = await buildShiftEmail({
      userDetails: mockData.user_details_summary_and_forms,
      datetime,
    })

    expect(mockGetShiftReportLinks).toHaveBeenCalledTimes(2)
    expect(mockGetShiftReportLinks).toHaveBeenCalledWith({
      datetime,
      shift: {
        _id: '565fe59257c5d59e60cc35a3',
      },
      withFormSubmissions: true,
    })
    expect(mockGetShiftReportLinks).toHaveBeenCalledWith({
      datetime,
      shift: {
        _id: '565fe59257c5d59e60cc35a2',
      },
      withFormSubmissions: true,
    })

    expect(result).toMatchSnapshot()
    expect.assertions(4)
  })

  it('it returns email data ordered by lastName and Timestamp', async () => {
    mockGetShiftReportLinks
      .mockResolvedValueOnce(mockData.long_active_links_1)
      .mockResolvedValueOnce(mockData.long_active_links_2)
      .mockResolvedValue(mockData.long_active_links_3)

    const result = await buildShiftEmail({
      userDetails: mockData.long_user_details_summary,
      datetime,
    })

    expect(mockGetShiftReportLinks).toHaveBeenCalledTimes(3)
    expect(mockGetShiftReportLinks).toHaveBeenCalledWith({
      datetime,
      shift: {
        _id: '565fe59257c5d59e60cc35a9',
      },
      withFormSubmissions: false,
    })
    expect(mockGetShiftReportLinks).toHaveBeenCalledWith({
      datetime,
      shift: {
        _id: '565fe59257c5d59e60cc35a6',
      },
      withFormSubmissions: false,
    })

    expect(mockGetShiftReportLinks).toHaveBeenCalledWith({
      datetime,
      shift: {
        _id: '565fe59257c5d59e60cc35a9',
      },
      withFormSubmissions: false,
    })

    expect(result).toMatchSnapshot()
    expect.assertions(5)
  })

  it('it returns email data with formSubmissions', async () => {
    mockGetShiftReportLinks.mockResolvedValueOnce(mockData.formSubmission)

    const result = await buildShiftEmail({
      userDetails: mockData.user_details_summary_and_forms,
      datetime,
    })

    expect(mockGetShiftReportLinks).toHaveBeenCalledWith({
      datetime,
      shift: {
        _id: '565fe59257c5d59e60cc35a2',
      },
      withFormSubmissions: true,
    })

    expect(result).toMatchSnapshot()
    expect.assertions(2)
  })

  it('it returns email data without formSubmissions', async () => {
    mockGetShiftReportLinks.mockResolvedValueOnce(
      mockData.withoutFormSubmission,
    )

    const result = await buildShiftEmail({
      userDetails: mockData.user_details_summary,
      datetime,
    })

    expect(mockGetShiftReportLinks).toHaveBeenCalledWith({
      datetime,
      shift: {
        _id: '565fe59257c5d59e60cc35a3',
      },
      withFormSubmissions: false,
    })

    expect(result).toMatchSnapshot()
    expect.assertions(2)
  })

  it('it returns email data with configuration set when the environment var is set', async () => {
    process.env.SES_CONFIGURATION_SET_NAME = 'ses-configuration-set'
    mockGetShiftReportLinks
      .mockResolvedValueOnce(mockData.active_link)
      .mockResolvedValue(mockData.inactive_link)

    const result = await buildShiftEmail({
      userDetails: mockData.user_details_summary_and_forms,
      datetime,
    })

    expect(result).toMatchSnapshot()
  })

  describe('when not running in production', () => {
    beforeEach(() => {
      process.env.STAGE = 'testing'
    })

    it('it sets isProduction as false, adds stage to subject line and uses test template', async () => {
      mockGetShiftReportLinks.mockResolvedValueOnce(mockData.active_link)

      const result = await buildShiftEmail({
        userDetails: mockData.user_details_summary_and_forms,
        datetime,
      })
      expect(result).toMatchSnapshot()
    })
  })

  describe('when no active or inactive shift', () => {
    it('it returns email data with hasNoShifts set to true', async () => {
      const userDetails = {
        ...mockData.user_details_summary_and_forms,
        shifts: [],
      }

      const result = await buildShiftEmail({
        userDetails,
        datetime,
      })
      expect(result).toMatchSnapshot()
    })
  })
})
