const mockS3Client = jest.fn()
const mockReadFile = jest.fn()
const mockMkdirp = jest.fn()
const mockRemove = jest.fn()
const mockV4 = jest.fn()

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => mockS3Client),
}))
jest.mock('fs-extra', () => ({
  mkdirp: mockMkdirp,
  readFile: mockReadFile,
  remove: mockRemove,
}))
jest.mock('node-uuid', () => ({ v4: mockV4 }))

jest.mock('../../helpers/concat-pdfs')
jest.mock('../../helpers/download-files')
jest.mock('../../helpers/s3')

import { concatPdfs } from '../../helpers/concat-pdfs'
import { downloadFiles } from '../../helpers/download-files'
import * as s3 from '../../helpers/s3'

import * as MockDate from 'mockdate'
import mergePdfs from './'

describe('handlers:mergePdfs', () => {
  const MOCK_PAYLOAD = {
    locationId: '5b68d7411f7b2b288279417a',
    pdfs: {
      formS3Paths: [
        '123456789/pdfs/2000-01-01/1543450822683-tasks-12345.pdf',
        '123456789/pdfs/2000-01-01/1543450822683-audit-12345.pdf',
        '123456789/pdfs/2000-01-01/1543450822683-issue-12345.pdf',
      ],
      skip: false,
      summaryS3Path:
        'activity-reports/5b68d7411f7b2b288279417a/2000/01/2000-01-01-summary-946684800000.pdf',
    },
  }

  const MOCK_BUFFER = 'buffer'
  const MOCK_UUID = '9999-8888-7777-6666'
  const MOCK_DIRECTORY = `/tmp/${MOCK_UUID}`
  const MOCK_FILE_PATH = `${MOCK_DIRECTORY}/1111-2222-3333-4444.pdf`
  const MOCK_FILES_PATHS = [`${MOCK_DIRECTORY}/5555-4444-3333-2222.pdf`]
  const MOCK_REFERENCE =
    'activity-reports/5b68d7411f7b2b288279417a/2000/01/2000-01-01-summary-and-forms-946684800000.pdf'
  const MOCK_S3_BUCKET_UPLOADS = 'testing'

  beforeEach(() => {
    process.env.S3_BUCKET_UPLOADS = MOCK_S3_BUCKET_UPLOADS
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('should process stringified event body and return file path', async () => {
    mockV4.mockReturnValue(MOCK_UUID)

    const event = { body: JSON.stringify(MOCK_PAYLOAD) }

    downloadFiles.mockResolvedValue(MOCK_FILES_PATHS)
    concatPdfs.mockResolvedValue(MOCK_FILE_PATH)
    mockReadFile.mockResolvedValue(MOCK_BUFFER)

    const result = await mergePdfs(event)

    expect(mockMkdirp).toHaveBeenCalledTimes(1)
    expect(mockMkdirp).toBeCalledWith(MOCK_DIRECTORY)

    expect(downloadFiles).toHaveBeenCalledTimes(1)
    expect(downloadFiles).toBeCalledWith(
      mockS3Client,
      [MOCK_PAYLOAD.pdfs.summaryS3Path, ...MOCK_PAYLOAD.pdfs.formS3Paths],
      MOCK_DIRECTORY,
    )

    expect(concatPdfs).toHaveBeenCalledTimes(1)
    expect(concatPdfs).toBeCalledWith(MOCK_FILES_PATHS, MOCK_DIRECTORY)

    expect(mockReadFile).toHaveBeenCalledTimes(1)
    expect(mockReadFile).toBeCalledWith(MOCK_FILE_PATH)

    expect(s3.put).toHaveBeenCalledTimes(1)
    expect(s3.put).toBeCalledWith(mockS3Client, {
      bucket: MOCK_S3_BUCKET_UPLOADS,
      buffer: MOCK_BUFFER,
      contentDisposition: 'inline',
      contentType: 'application/pdf',
      key: MOCK_REFERENCE,
    })

    expect(mockRemove).toHaveBeenCalledTimes(1)
    expect(mockRemove).toBeCalledWith(MOCK_DIRECTORY)

    expect(result).toEqual(MOCK_REFERENCE)
  })

  it('should process object event', async () => {
    const event = MOCK_PAYLOAD

    downloadFiles.mockResolvedValue(MOCK_FILES_PATHS)
    concatPdfs.mockResolvedValue(MOCK_FILE_PATH)
    mockReadFile.mockResolvedValue(MOCK_BUFFER)

    const result = await mergePdfs(event)

    expect(mockMkdirp).toHaveBeenCalledTimes(1)
    expect(mockMkdirp).toBeCalledWith(MOCK_DIRECTORY)

    expect(downloadFiles).toHaveBeenCalledTimes(1)
    expect(downloadFiles).toBeCalledWith(
      mockS3Client,
      [MOCK_PAYLOAD.pdfs.summaryS3Path, ...MOCK_PAYLOAD.pdfs.formS3Paths],
      MOCK_DIRECTORY,
    )

    expect(concatPdfs).toHaveBeenCalledTimes(1)
    expect(concatPdfs).toBeCalledWith(MOCK_FILES_PATHS, MOCK_DIRECTORY)

    expect(mockReadFile).toHaveBeenCalledTimes(1)
    expect(mockReadFile).toBeCalledWith(MOCK_FILE_PATH)

    expect(s3.put).toHaveBeenCalledTimes(1)
    expect(s3.put).toBeCalledWith(mockS3Client, {
      bucket: MOCK_S3_BUCKET_UPLOADS,
      buffer: MOCK_BUFFER,
      contentDisposition: 'inline',
      contentType: 'application/pdf',
      key: MOCK_REFERENCE,
    })

    expect(mockRemove).toHaveBeenCalledTimes(1)
    expect(mockRemove).toBeCalledWith(MOCK_DIRECTORY)

    expect(result).toEqual(MOCK_REFERENCE)
  })

  it('should process return s3 key', async () => {
    const event = MOCK_PAYLOAD

    downloadFiles.mockResolvedValue(MOCK_FILES_PATHS)
    concatPdfs.mockResolvedValue(MOCK_FILE_PATH)
    mockReadFile.mockResolvedValue(MOCK_BUFFER)

    const result = await mergePdfs(event)
    expect(result).toEqual(MOCK_REFERENCE)
  })

  it('should handle error when downloading files', async () => {
    const event = {}
    const error = new Error('Error Message')

    downloadFiles.mockRejectedValue(error)

    await expect(mergePdfs(event)).rejects.toThrow(error)
  })

  it('should handle error when merging pdfs', async () => {
    const event = {}
    const error = new Error('Error Message')

    concatPdfs.mockRejectedValue(error)

    await expect(mergePdfs(event)).rejects.toThrow(error)
  })
})
