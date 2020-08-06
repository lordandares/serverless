export {}

jest.mock('../../attach-file-to-entry')
jest.mock('../../handle-generate-pdf')

/* tslint:disable */
// NOTE Convert these to imports. Needs workaround for mockResolvedValue usage below
const handleGeneratePdf = require('../../handle-generate-pdf').default
const generatePdf = require('./index').generatePdf
/* tslint:enable */

// mock env vars
const AWS_REGION = 'us-east-1'
const CLOUDINARY_BASE_URL = 'https://cloudinary.com/lighthouse-io'
const S3_BASE_URL = 'https://s3.com/lighthouse-io'
const S3_BUCKET_UPLOADS = 'lighthouse-uploads'

jest.mock('@lighthouse/serverless-common', () => ({
  mongo: {
    createClient: jest.fn().mockResolvedValue({
      db: () => ({
        collection: () => ({
          findOneAndUpdate: () => Promise.resolve(),
        }),
      }),
    }),
  },
}))

beforeEach(() => {
  process.env.AWS_REGION = AWS_REGION
  process.env.CLOUDINARY_BASE_URL = CLOUDINARY_BASE_URL
  process.env.S3_BASE_URL = S3_BASE_URL
  process.env.S3_BUCKET_UPLOADS = S3_BUCKET_UPLOADS
})

it('should handle error', async () => {
  handleGeneratePdf.mockRejectedValue(new Error('test'))

  const event = {
    entity: {},
    type: 'issue',
  }

  await expect(generatePdf(event)).rejects.toThrow('test')

  expect(handleGeneratePdf).toBeCalledWith(event, {
    cloudinaryBaseUrl: CLOUDINARY_BASE_URL,
    pageSize: 'LETTER',
    s3BaseUrl: S3_BASE_URL,
    s3Bucket: S3_BUCKET_UPLOADS,
  })
})

it('should error when missing env variables', async () => {
  const event = {
    entity: {},
    type: 'issue',
  }

  process.env.CLOUDINARY_BASE_URL = ''
  await expect(generatePdf(event)).rejects.toThrow()
})

it('should call handleGeneratePdf with event object', async () => {
  handleGeneratePdf.mockResolvedValue({
    applicationId: '5c046fccfc13ae23a5000000',
    entityId: '5c046fccfc13ae23a5000001',
    filename: 'file.pdf',
    key: 'path/file.pdf',
    type: 'audit',
    url: 'https://s3.com/path/file.pdf',
  })

  const event = {
    entity: {
      _id: '5c046fccfc13ae23a5000001',
      application: '5c046fccfc13ae23a5000000',
    },
    type: 'audit',
  }

  const result = await generatePdf(event)

  expect(result).toEqual({
    filename: 'file.pdf',
    url: 'https://s3.com/path/file.pdf',
  })

  expect(handleGeneratePdf).toBeCalledWith(event, {
    cloudinaryBaseUrl: CLOUDINARY_BASE_URL,
    pageSize: 'LETTER',
    s3BaseUrl: S3_BASE_URL,
    s3Bucket: S3_BUCKET_UPLOADS,
  })
})

it('should call handleGeneratePdf with json value', async () => {
  handleGeneratePdf.mockResolvedValue({
    applicationId: '5c046fccfc13ae23a5000002',
    entityId: '5c046fccfc13ae23a5000003',
    filename: 'file.pdf',
    key: 'path/file.pdf',
    type: 'audit',
    url: 'https://s3.com/path/file.pdf',
  })

  const payload = {
    entity: {
      _id: '5c046fccfc13ae23a5000003',
      application: '5c046fccfc13ae23a5000002',
    },
    type: 'audit',
  }

  const event = {
    body: JSON.stringify(payload),
  }

  const result = await generatePdf(event)

  expect(result).toEqual({
    filename: 'file.pdf',
    url: 'https://s3.com/path/file.pdf',
  })
  expect(handleGeneratePdf).toBeCalledWith(payload, {
    cloudinaryBaseUrl: CLOUDINARY_BASE_URL,
    pageSize: 'LETTER',
    s3BaseUrl: S3_BASE_URL,
    s3Bucket: S3_BUCKET_UPLOADS,
  })
})

it('should set pageSize to A4 when not using us region', async () => {
  handleGeneratePdf.mockResolvedValue({
    applicationId: '5c046fccfc13ae23a5000004',
    entityId: '5c046fccfc13ae23a5000005',
    filename: 'file.pdf',
    key: 'path/file.pdf',
    type: 'audit',
    url: 'https://s3.com/path/file.pdf',
  })

  const event = {
    entity: {
      _id: '5c046fccfc13ae23a5000005',
      application: '5c046fccfc13ae23a5000004',
    },
    type: 'audit',
  }

  process.env.AWS_REGION = 'ap-southeast-2'

  const result = await generatePdf(event)

  expect(result).toEqual({
    filename: 'file.pdf',
    url: 'https://s3.com/path/file.pdf',
  })
  expect(handleGeneratePdf).toBeCalledWith(event, {
    cloudinaryBaseUrl: CLOUDINARY_BASE_URL,
    pageSize: 'A4',
    s3BaseUrl: S3_BASE_URL,
    s3Bucket: S3_BUCKET_UPLOADS,
  })
})
