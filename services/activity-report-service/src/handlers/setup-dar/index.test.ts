jest.mock('../../helpers/build-location-summary-pdf')
jest.mock('../../helpers/get-references')
jest.mock('../../helpers/get-summary-data')

const buildLocationSummaryPdf = require('../../helpers/build-location-summary-pdf')
  .buildLocationSummaryPdf
const getFormS3Paths = require('../../helpers/get-references').getFormS3Paths
const getSummaryData = require('../../helpers/get-summary-data').getSummaryData

import setupDar from './'

describe('handlers:setupDar', () => {
  const MOCK_DATA = {
    application: {},
    audits: [{ _id: '5b36816ea008a70015a330d1' }],
    events: [{ _id: '5b36816ea008a70015a330d2' }],
    issues: [{ _id: '5b36816ea008a70015a330d3' }],
    location: {},
    tasks: [{ _id: '5b36816ea008a70015a330d4' }],
    timestamp: '2018-11-29T00:25:19.020Z',
    timezone: 'Australia/Melbourne',
  }

  const MOCK_BODY = {
    _id: '1234567890',
    name: 'Testing Location',
    timezone: 'Australia/Melbourne',
  }

  const MOCK_FORM_S3_PATHS = [
    '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
    '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
    '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
  ]

  const MOCK_SUMMARY_S3_PATH =
    '123456789/pdfs/2018-11-26/1543450822684-dar-123456789.pdf'

  const MOCK_REFERENCES_SHOULD_SKIP = {
    formS3Paths: [
      '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
      '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
      '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
    ],
    skip: false,
    summaryS3Path: '123456789/pdfs/2018-11-26/1543450822684-dar-123456789.pdf',
  }

  afterEach(() => jest.clearAllMocks())

  it('should process stringified event body and return results', async () => {
    const event = { body: JSON.stringify(MOCK_BODY) }

    getSummaryData.mockResolvedValue(MOCK_DATA)
    buildLocationSummaryPdf.mockResolvedValue(MOCK_SUMMARY_S3_PATH)
    getFormS3Paths.mockResolvedValue(MOCK_FORM_S3_PATHS)

    const result = await setupDar(event)

    expect(getSummaryData).toHaveBeenCalledTimes(1)
    expect(getSummaryData).toBeCalledWith(MOCK_BODY)

    expect(buildLocationSummaryPdf).toHaveBeenCalledTimes(1)
    expect(buildLocationSummaryPdf).toBeCalledWith(MOCK_DATA)

    expect(getFormS3Paths).toHaveBeenCalledTimes(1)
    expect(getFormS3Paths).toBeCalledWith(MOCK_DATA)

    expect(result).toEqual(MOCK_REFERENCES_SHOULD_SKIP)
  })

  it('should process object event and return results', async () => {
    const MOCK_EMPTY_DATA = {
      ...MOCK_DATA,
      audits: [],
      events: [],
      issues: [],
      tasks: [],
    }

    const event = MOCK_BODY

    getSummaryData.mockResolvedValue(MOCK_EMPTY_DATA)
    buildLocationSummaryPdf.mockResolvedValue(MOCK_SUMMARY_S3_PATH)
    getFormS3Paths.mockResolvedValue(MOCK_FORM_S3_PATHS)

    const result = await setupDar(event)

    expect(getSummaryData).toHaveBeenCalledTimes(1)
    expect(getSummaryData).toBeCalledWith(MOCK_BODY)

    expect(buildLocationSummaryPdf).toHaveBeenCalledTimes(0)
    expect(getFormS3Paths).toHaveBeenCalledTimes(0)

    expect(result).toEqual({
      skip: true,
    })
  })

  it('should handle no data and return results ', async () => {
    const event = MOCK_BODY

    getSummaryData.mockResolvedValue(MOCK_DATA)
    buildLocationSummaryPdf.mockResolvedValue(MOCK_SUMMARY_S3_PATH)
    getFormS3Paths.mockResolvedValue(MOCK_FORM_S3_PATHS)

    const result = await setupDar(event)

    expect(getSummaryData).toHaveBeenCalledTimes(1)
    expect(getSummaryData).toBeCalledWith(MOCK_BODY)

    expect(buildLocationSummaryPdf).toHaveBeenCalledTimes(1)
    expect(buildLocationSummaryPdf).toBeCalledWith(MOCK_DATA)

    expect(getFormS3Paths).toHaveBeenCalledTimes(1)
    expect(getFormS3Paths).toBeCalledWith(MOCK_DATA)

    expect(result).toEqual(MOCK_REFERENCES_SHOULD_SKIP)
  })

  it('should handle error when querying data', async () => {
    const event = {}
    const error = new Error('Error Message')

    getSummaryData.mockRejectedValue(error)

    await expect(setupDar(event)).rejects.toThrow(error)
  })

  it('should handle error when building references', async () => {
    const event = {}
    const error = new Error('Error message')

    getSummaryData.mockResolvedValue(MOCK_DATA)
    buildLocationSummaryPdf.mockRejectedValue(error)

    await expect(setupDar(event)).rejects.toThrow(error)
  })
})
