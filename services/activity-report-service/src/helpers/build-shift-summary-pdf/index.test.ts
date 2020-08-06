const mockBuildShiftPdf = jest.fn().mockResolvedValue({})
const mockBuildConfig = jest.fn().mockResolvedValue({})
const mockCreateSummary = jest.fn().mockResolvedValue({})

jest.mock('@lighthouse/common', () => ({
  buildShiftPdf: mockBuildShiftPdf,
}))
jest.mock('../create-summary-pdf', () => ({
  buildConfig: mockBuildConfig,
  createSummaryPdf: mockCreateSummary,
}))

const buildConfig = require('../create-summary-pdf').buildConfig
const createSummaryPdf = require('../create-summary-pdf').createSummaryPdf

import { buildShiftPdf } from '@lighthouse/common'
import * as MockDate from 'mockdate'

import { buildShiftSummaryPdf } from './'
import * as mockData from './fixtures'

describe('helpers:buildShiftSummaryPdf', () => {
  beforeEach(() => {
    process.env.AWS_REGION = mockData.AWS_REGION
    process.env.CLOUDINARY_BASE_URL = mockData.CLOUDINARY_BASE_URL
    process.env.S3_BASE_URL = mockData.S3_BASE_URL
    process.env.S3_BUCKET_UPLOADS = mockData.S3_BUCKET_UPLOADS
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('creates shift summary pdf, uploads and returns reference', async () => {
    buildConfig.mockReturnValue(mockData.BUILD_DATA)
    buildShiftPdf.mockReturnValue(mockData.DEFINITION)
    createSummaryPdf.mockReturnValue(mockData.SUMMARY_REFERENCE)

    const reference = await buildShiftSummaryPdf(mockData.DATA)

    expect(buildConfig).toHaveBeenCalledTimes(1)
    expect(buildConfig).toBeCalledWith(mockData.DATA)

    expect(buildShiftPdf).toHaveBeenCalledTimes(1)
    expect(buildShiftPdf).toBeCalledWith(
      mockData.PDF_OPTIONS,
      mockData.CONFIG_DATA,
    )

    expect(createSummaryPdf).toHaveBeenCalledTimes(1)

    expect(createSummaryPdf).toBeCalledWith(
      mockData.DEFINITION,
      mockData.SUMMARY_REFERENCE,
    )

    expect(reference).toEqual(mockData.SUMMARY_REFERENCE)
    expect.assertions(7)
  })
})
