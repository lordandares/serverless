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

import mergeShiftPdfs from '.'
import * as mockData from './fixtures'

describe('handlers:mergeReportPdfs', () => {
  beforeEach(() => {
    process.env.S3_BUCKET_UPLOADS = mockData.S3_BUCKET_UPLOADS
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should process stringified event body and return file path', async () => {
    mockV4.mockReturnValue(mockData.UUID)

    const event = { body: JSON.stringify(mockData.PAYLOAD) }

    downloadFiles.mockResolvedValue(mockData.FILES_PATHS)
    concatPdfs.mockResolvedValue(mockData.FILE_PATH)
    mockReadFile.mockResolvedValue(mockData.BUFFER)

    const result = await mergeShiftPdfs(event)

    expect(mockMkdirp).toHaveBeenCalledTimes(1)
    expect(mockMkdirp).toBeCalledWith(mockData.DIRECTORY)

    expect(downloadFiles).toHaveBeenCalledTimes(1)
    expect(downloadFiles).toBeCalledWith(
      mockS3Client,
      mockData.PAYLOAD.pdfs.pdfsToMerge,
      mockData.DIRECTORY,
    )

    expect(concatPdfs).toHaveBeenCalledTimes(1)
    expect(concatPdfs).toBeCalledWith(mockData.FILES_PATHS, mockData.DIRECTORY)

    expect(mockReadFile).toHaveBeenCalledTimes(1)
    expect(mockReadFile).toBeCalledWith(mockData.FILE_PATH)

    expect(s3.put).toHaveBeenCalledTimes(1)
    expect(s3.put).toBeCalledWith(mockS3Client, {
      bucket: mockData.S3_BUCKET_UPLOADS,
      buffer: mockData.BUFFER,
      contentDisposition: 'inline',
      contentType: 'application/pdf',
      key: mockData.MERGED_S3_PATH,
    })

    expect(mockRemove).toHaveBeenCalledTimes(1)
    expect(mockRemove).toBeCalledWith(mockData.DIRECTORY)

    expect(result).toEqual(mockData.MERGED_S3_PATH)
    expect.assertions(13)
  })

  it('should process object event', async () => {
    mockV4.mockReturnValue(mockData.UUID)
    const event = mockData.PAYLOAD

    downloadFiles.mockResolvedValue(mockData.FILES_PATHS)
    concatPdfs.mockResolvedValue(mockData.FILE_PATH)
    mockReadFile.mockResolvedValue(mockData.BUFFER)

    const result = await mergeShiftPdfs(event)

    expect(mockMkdirp).toHaveBeenCalledTimes(1)
    expect(mockMkdirp).toBeCalledWith(mockData.DIRECTORY)

    expect(downloadFiles).toHaveBeenCalledTimes(1)
    expect(downloadFiles).toBeCalledWith(
      mockS3Client,
      mockData.PAYLOAD.pdfs.pdfsToMerge,
      mockData.DIRECTORY,
    )

    expect(concatPdfs).toHaveBeenCalledTimes(1)
    expect(concatPdfs).toBeCalledWith(mockData.FILES_PATHS, mockData.DIRECTORY)

    expect(mockReadFile).toHaveBeenCalledTimes(1)
    expect(mockReadFile).toBeCalledWith(mockData.FILE_PATH)

    expect(s3.put).toHaveBeenCalledTimes(1)
    expect(s3.put).toBeCalledWith(mockS3Client, {
      bucket: mockData.S3_BUCKET_UPLOADS,
      buffer: mockData.BUFFER,
      contentDisposition: 'inline',
      contentType: 'application/pdf',
      key: mockData.MERGED_S3_PATH,
    })

    expect(mockRemove).toHaveBeenCalledTimes(1)
    expect(mockRemove).toBeCalledWith(mockData.DIRECTORY)

    expect(result).toEqual(mockData.MERGED_S3_PATH)
    expect.assertions(13)
  })

  it('should process return s3 key', async () => {
    const event = mockData.PAYLOAD

    downloadFiles.mockResolvedValue(mockData.FILES_PATHS)
    concatPdfs.mockResolvedValue(mockData.FILE_PATH)
    mockReadFile.mockResolvedValue(mockData.BUFFER)

    const result = await mergeShiftPdfs(event)
    expect(result).toEqual(mockData.MERGED_S3_PATH)
    expect.assertions(1)
  })

  it('should handle error when downloading files', async () => {
    const event = { pdfs: {} }
    const error = new Error('Error Message')

    downloadFiles.mockRejectedValue(error)

    await expect(mergeShiftPdfs(event)).rejects.toThrow(error)
    expect.assertions(1)
  })

  it('should handle error when merging pdfs', async () => {
    const event = { pdfs: {} }
    const error = new Error('Error Message')

    concatPdfs.mockRejectedValue(error)

    await expect(mergeShiftPdfs(event)).rejects.toThrow(error)
    expect.assertions(1)
  })
})
