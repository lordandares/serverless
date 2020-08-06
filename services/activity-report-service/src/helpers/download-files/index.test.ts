const mockWriteFile = jest.fn()
const mockV4 = jest.fn()

jest.mock('fs-extra', () => ({ writeFile: mockWriteFile }))
jest.mock('node-uuid', () => ({ v4: mockV4 }))

jest.mock('../s3')

import * as s3 from '../s3'
import { downloadFiles } from './'

describe('helpers:downloadFiles', () => {
  const MOCK_DIRECTORY = '/tmp/1111-2222-3333-4444'
  const MOCK_S3_BUCKET_UPLOADS = 'testing'
  const MOCK_OBJECT = { Body: 'Body' }
  const MOCK_REFERENCES = [
    '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
  ]
  const MOCK_UUID = '9999-8888-7777-6666'

  beforeEach(() => {
    process.env.S3_BUCKET_UPLOADS = MOCK_S3_BUCKET_UPLOADS
  })

  afterEach(() => jest.clearAllMocks())

  it('downloads files and returns file paths', async () => {
    mockV4.mockReturnValue(MOCK_UUID)
    s3.get.mockResolvedValue(MOCK_OBJECT)

    const mockS3Client = jest.fn()
    const filePaths = await downloadFiles(
      mockS3Client,
      MOCK_REFERENCES,
      MOCK_DIRECTORY,
    )

    expect(s3.get).toHaveBeenCalledTimes(1)
    expect(s3.get).toBeCalledWith(mockS3Client, {
      bucket: MOCK_S3_BUCKET_UPLOADS,
      key: MOCK_REFERENCES[0],
    })

    const filePath = `${MOCK_DIRECTORY}/${MOCK_UUID}.pdf`

    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    expect(mockWriteFile).toBeCalledWith(filePath, MOCK_OBJECT.Body)

    expect(filePaths).toEqual([filePath])
  })
})
