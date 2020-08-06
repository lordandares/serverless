jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => mockS3Client),
}))
jest.mock('../get-pdf-buffer')
jest.mock('../s3')

const s3 = require('../s3')
const mockS3Client = jest.fn()

import * as MockDate from 'mockdate'

import { buildConfig, createSummaryPdf } from '.'
import getPdfBuffer from '../get-pdf-buffer'

describe('helpers:buildSummary', () => {
  const MOCK_AWS_REGION = 'ap-southeast-2'
  const MOCK_BUFFER = 'buffer'
  const MOCK_DEFINITION = { content: ['definition'] }
  const MOCK_LOGO_URL = 'http://lighthouse.io/logo.png'

  const MOCK_DATA = {
    application: {
      _id: '123456789',
      flags: {
        darAlternateSummary: false,
      },
      settings: {
        darMaxScans: 100,
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

  it('builds summary config', () => {
    const expectedPdfOptions = {
      logoUrl: MOCK_LOGO_URL,
      pageSize: 'A4',
    }

    const expectedData = {
      ...MOCK_DATA,
      maxScans: 100,
      settings: {
        awsS3BaseUrl: MOCK_S3_BASE_URL,
        cloudinaryBaseUrl: MOCK_CLOUDINARY_BASE_URL,
      },
      showAlternate: false,
    }

    const buildData = buildConfig(MOCK_DATA)
    const { data, pdfOptions } = buildData

    expect(data).toEqual(expectedData)
    expect(pdfOptions).toEqual(expectedPdfOptions)
  })

  it('builds summary, uploads and returns reference', async () => {
    getPdfBuffer.mockResolvedValue(MOCK_BUFFER)
    s3.put.mockResolvedValue(MOCK_SUMMARY_REFERENCE)

    await createSummaryPdf(MOCK_DEFINITION, MOCK_SUMMARY_REFERENCE)

    expect(getPdfBuffer).toHaveBeenCalledTimes(1)
    expect(getPdfBuffer).toBeCalledWith(MOCK_DEFINITION)

    expect(s3.put).toHaveBeenCalledTimes(1)
    expect(s3.put).toBeCalledWith(mockS3Client, {
      bucket: MOCK_S3_BUCKET_UPLOADS,
      buffer: MOCK_BUFFER,
      key: MOCK_SUMMARY_REFERENCE,
    })

    expect.assertions(4)
  })

  describe('page size', () => {
    describe('when no region', () => {
      beforeEach(() => {
        process.env.AWS_REGION = undefined
      })

      it('sets page size as A4', async () => {
        const expectedPdfOptions = {
          logoUrl: MOCK_LOGO_URL,
          pageSize: 'A4',
        }

        const expectedData = {
          ...MOCK_DATA,
          maxScans: 100,
          settings: {
            awsS3BaseUrl: MOCK_S3_BASE_URL,
            cloudinaryBaseUrl: MOCK_CLOUDINARY_BASE_URL,
          },
          showAlternate: false,
        }

        const buildData = buildConfig(MOCK_DATA)
        const { data, pdfOptions } = buildData

        expect(data).toEqual(expectedData)
        expect(pdfOptions).toEqual(expectedPdfOptions)
      })
    })

    describe('when us-east-1 region', () => {
      beforeEach(() => {
        process.env.AWS_REGION = 'us-east-1'
      })

      it('sets page size as LETTER', async () => {
        const expectedPdfOptions = {
          logoUrl: MOCK_LOGO_URL,
          pageSize: 'LETTER',
        }

        const expectedData = {
          ...MOCK_DATA,
          maxScans: 100,
          settings: {
            awsS3BaseUrl: MOCK_S3_BASE_URL,
            cloudinaryBaseUrl: MOCK_CLOUDINARY_BASE_URL,
          },
          showAlternate: false,
        }

        const buildData = buildConfig(MOCK_DATA)
        const { data, pdfOptions } = buildData

        expect(data).toEqual(expectedData)
        expect(pdfOptions).toEqual(expectedPdfOptions)
      })
    })
  })
})
