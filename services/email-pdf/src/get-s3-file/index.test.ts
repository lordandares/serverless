/* tslint:disable */
// NOTE Convert these to imports. Needs workaround for mockResolvedValue usage below
const getS3File = require('./index').default
/* tslint:enable */

it('should error for missing s3 client', () => {
  expect.assertions(1)

  const options = {}
  const s3 = undefined
  const promise = getS3File(s3, options)

  expect(promise).rejects.toHaveProperty('message', 'Missing `s3` argument')
})

it('should error for invalid data', () => {
  expect.assertions(2)

  const options = {
    bucket: undefined,
    key: '1234',
  }

  const mockS3Client = getMockS3Client()
  const promise = getS3File(mockS3Client, options)

  expect(promise).rejects.toHaveProperty('message', 'Invalid getS3File options')

  expect(mockS3Client.getObject).not.toHaveBeenCalled()
})

it('should handle getObject error', () => {
  expect.assertions(2)

  const options = {
    bucket: 'bucket',
    key: 'key',
  }

  const mockS3Client = {
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('AWS Error')),
    }),
  }

  const promise = getS3File(mockS3Client, options)

  expect(promise).rejects.toHaveProperty('message', 'AWS Error')

  expect(mockS3Client.getObject).toHaveBeenCalled()
})

it('should get S3 file', () => {
  expect.assertions(2)

  const options = {
    bucket: 'bucket',
    key: 'key',
  }

  const mockS3Client = getMockS3Client()

  getS3File(mockS3Client, options).then(result => {
    expect(result).toBeTruthy()
    expect(mockS3Client.getObject).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Key: 'key',
    })
  })
})

function getMockS3Client() {
  return {
    getObject: jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({
        Body: 'file-data',
      }),
    })),
  }
}
