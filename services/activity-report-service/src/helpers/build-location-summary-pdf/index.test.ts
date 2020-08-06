const mockBuildActivityPdf = jest.fn().mockResolvedValue({})
const mockBuildConfig = jest.fn().mockResolvedValue({})
const mockBuildSummary = jest.fn().mockResolvedValue({})

jest.mock('@lighthouse/common', () => ({
  buildActivityPdf: mockBuildActivityPdf,
}))
jest.mock('../create-summary-pdf', () => ({
  buildConfig: mockBuildConfig,
  createSummaryPdf: mockBuildSummary,
}))

const buildConfig = require('../create-summary-pdf').buildConfig
const createSummaryPdf = require('../create-summary-pdf').createSummaryPdf

import * as MockDate from 'mockdate'
import { buildActivityPdf } from '@lighthouse/common'

import { buildLocationSummaryPdf } from '.'

describe('helpers:buildSummaryPdf', () => {
  const MOCK_AWS_REGION = 'ap-southeast-2'
  const MOCK_DEFINITION = { content: ['definition'] }
  const MOCK_LOGO_URL = 'http://lighthouse.io/logo.png'

  const MOCK_DATA = {
    application: {
      _id: '123456789',
      flags: {
        darMaxScans: 100,
        darAlternateSummary: false,
      },
      theme: {
        logos: {
          pdf: MOCK_LOGO_URL,
        },
      },
    },
    audits: [
      {
        createdAt: '2000-01-01T15:00:00.000Z',
        files: {
          pdf: {
            path: '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
          },
        },
      },
    ],
    location: {
      _id: '123456789',
    },
    issues: [
      {
        createdAt: '2000-01-01T16:00:00.000Z',
        files: {
          pdf: {
            path: '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
          },
        },
      },
    ],
    tasks: [
      {
        createdAt: '2000-01-01T09:00:00.000Z',
        files: {
          pdf: {
            path: '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
          },
        },
      },
    ],
    timestamp: '2000-01-01T12:00:00.000Z',
    timezone: 'Australia/Melbourne',
  }

  const MOCK_CLOUDINARY_BASE_URL = 'http://cloudinary.com'
  const MOCK_S3_BASE_URL = 'http://upload-test.com'
  const MOCK_S3_BUCKET_UPLOADS = 'testing'
  const MOCK_SUMMARY_REFERENCE =
    'activity-reports/123456789/2000/01/2000-01-01-summary-946684800000.pdf'

  beforeEach(() => {
    process.env.AWS_REGION = MOCK_AWS_REGION
    process.env.CLOUDINARY_BASE_URL = MOCK_CLOUDINARY_BASE_URL
    process.env.S3_BASE_URL = MOCK_S3_BASE_URL
    process.env.S3_BUCKET_UPLOADS = MOCK_S3_BUCKET_UPLOADS
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('creates summary pdf, uploads and returns reference', async () => {
    const MOCK_BUILD_DATA = {
      data: {
        ...MOCK_DATA,
        maxScans: 100,
        settings: {
          awsS3BaseUrl: MOCK_S3_BASE_URL,
          cloudinaryBaseUrl: MOCK_CLOUDINARY_BASE_URL,
        },
        showAlternate: false,
      },
      pdfOptions: {
        logoUrl: MOCK_LOGO_URL,
        pageSize: 'A4',
      },
    }
    const { data: MOCK_CONFIG_DATA, pdfOptions: MOCK_OPTIONS } = MOCK_BUILD_DATA

    buildConfig.mockReturnValue(MOCK_BUILD_DATA)
    buildActivityPdf.mockReturnValue(MOCK_DEFINITION)
    createSummaryPdf.mockReturnValue(MOCK_SUMMARY_REFERENCE)

    const reference = await buildLocationSummaryPdf(MOCK_DATA)

    expect(buildConfig).toHaveBeenCalledTimes(1)
    expect(buildConfig).toBeCalledWith(MOCK_DATA)

    expect(buildActivityPdf).toHaveBeenCalledTimes(1)
    expect(buildActivityPdf).toBeCalledWith(MOCK_OPTIONS, MOCK_CONFIG_DATA)

    expect(createSummaryPdf).toHaveBeenCalledTimes(1)
    expect(createSummaryPdf).toBeCalledWith(
      MOCK_DEFINITION,
      MOCK_SUMMARY_REFERENCE,
    )

    expect(reference).toEqual(MOCK_SUMMARY_REFERENCE)
    expect.assertions(7)
  })
})
