import * as dateFns from 'date-fns'
import * as MockDate from 'mockdate'

import { getLocationReportLinks } from './'

describe('helpers:getLocationReportLinks', () => {
  const MOCK_S3_BASE_URL = 'http://baseurl.com'

  beforeEach(() => {
    process.env.S3_BASE_URL = MOCK_S3_BASE_URL
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    MockDate.reset()
    jest.clearAllMocks()
  })

  it('should process location and return link details for summary report for user', async () => {
    const summaryReportPath =
      '5be365d9c68b740001d27ba7/1999/12/1999-12-30-dar-1548194730622.pdf'
    const summmaryReportAndFormsPath =
      'activity-reports/5be365d9c68b740001d27ba7/1999/12/1999-12-30-1548194730622.pdf'
    const timestamp = dateFns.subHours(new Date(), 6)

    const MOCK_LOCATION = {
      _id: '5be365d9c68b740001d27ba7',
      name: 'Testing Location',
      files: {
        activityReportSummary: { path: summaryReportPath, timestamp },
        activityReportSummaryAndForms: {
          path: summmaryReportAndFormsPath,
          timestamp,
        },
      },
    }

    const result = await getLocationReportLinks({
      location: MOCK_LOCATION,
      withFormSubmissions: false,
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: `${MOCK_S3_BASE_URL}/${summaryReportPath}`,
      name: MOCK_LOCATION.name,
    })
  })

  it('should process location and return link details for full report for user', async () => {
    const summaryReportPath =
      '5be365d9c68b740001d27ba7/1999/12/1999-12-30-dar-1548194730622.pdf'
    const summmaryReportAndFormsPath =
      'activity-reports/5be365d9c68b740001d27ba7/1999/12/1999-12-30-1548194730622.pdf'
    const timestamp = dateFns.subHours(new Date(), 6)

    const MOCK_LOCATION = {
      _id: '5be365d9c68b740001d27ba7',
      name: 'Testing Location',
      files: {
        activityReportSummary: { path: summaryReportPath, timestamp },
        activityReportSummaryAndForms: {
          path: summmaryReportAndFormsPath,
          timestamp,
        },
      },
    }

    const result = await getLocationReportLinks({
      location: MOCK_LOCATION,
      withFormSubmissions: true,
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: `${MOCK_S3_BASE_URL}/${summmaryReportAndFormsPath}`,
      name: MOCK_LOCATION.name,
    })
  })

  it('should process location and return link details for legacy pdf reference', async () => {
    // NOTE this is a simulation for reports generated prior to the new files
    // key names being deployed. This test can be removed in future, once we've
    // processed 24 hours worth of reports
    const pdfPath =
      'activity-reports/5be365d9c68b740001d27ba7/1999/12/1999-12-30-1548194730622.pdf'
    const timestamp = dateFns.subHours(new Date(), 6)

    const MOCK_LOCATION = {
      _id: '5be365d9c68b740001d27ba7',
      name: 'Testing Location',
      files: {
        pdf: { path: pdfPath, timestamp },
      },
    }

    const result = await getLocationReportLinks({
      location: MOCK_LOCATION,
      withFormSubmissions: true,
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: `${MOCK_S3_BASE_URL}/${pdfPath}`,
      name: MOCK_LOCATION.name,
    })
  })

  it('should set the link to null if timestamp greater than 24 hours ago', async () => {
    const summaryReportPath =
      '5be365d9c68b740001d27ba7/1999/12/1999-12-30-dar-1548194730622.pdf'
    const summmaryReportAndFormsPath =
      'activity-reports/5be365d9c68b740001d27ba7/1999/12/1999-12-30-1548194730622.pdf'
    const timestamp = dateFns.subDays(new Date(), 2)

    const MOCK_LOCATION = {
      _id: '5be365d9c68b740001d27ba7',
      name: 'Testing Location',
      files: { activityReportSummary: { path: summaryReportPath, timestamp } },
    }

    const result = await getLocationReportLinks({
      location: MOCK_LOCATION,
      withFormSubmissions: false,
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: null,
      name: MOCK_LOCATION.name,
    })
  })

  it('should set link to null if no pdf data on location', async () => {
    const MOCK_LOCATION = {
      _id: '5be365d9c68b740001d27ba7',
      name: 'Testing Location',
    }

    const result = await getLocationReportLinks({
      location: MOCK_LOCATION,
      withFormSubmissions: true,
    })

    expect(result).toEqual({
      id: '5be365d9c68b740001d27ba7',
      link: null,
      name: MOCK_LOCATION.name,
    })
  })
})
