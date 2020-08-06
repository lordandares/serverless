import { get, listObjects, put } from './'

describe('helpers:s3', () => {
  const mockS3Client = {
    getObject: jest.fn().mockReturnValue({
      promise: () => Promise.resolve({ bucket: 'bucket', key: 'key' }),
    }),
    listObjects: jest.fn().mockReturnValue({
      promise: () => Promise.resolve(),
    }),
    putObject: jest.fn().mockReturnValue({
      promise: () => Promise.resolve(),
    }),
  }

  it('should call getObject with params', () => {
    expect.assertions(1)

    return get(mockS3Client, {
      bucket: 'my-s3-bucket',
      key: 's3-key',
    }).then(() => {
      expect(mockS3Client.getObject).toBeCalledWith({
        Bucket: 'my-s3-bucket',
        Key: 's3-key',
      })
    })
  })

  it('should call listObjects with params', () => {
    expect.assertions(1)

    return listObjects(mockS3Client, {
      bucket: 'my-s3-bucket',
      delimiter: '/',
      prefix: 'activity-reports/2012/12',
    }).then(() => {
      expect(mockS3Client.listObjects).toBeCalledWith({
        Bucket: 'my-s3-bucket',
        Delimiter: '/',
        Prefix: 'activity-reports/2012/12',
      })
    })
  })

  it('should call putObject with params', () => {
    expect.assertions(2)

    return put(mockS3Client, {
      bucket: 'my-s3-bucket',
      buffer: Buffer.from('1'),
      contentDisposition: 'inline',
      contentType: 'application/pdf',
      key: 's3-key',
    }).then(response => {
      expect(mockS3Client.putObject).toBeCalledWith({
        Body: expect.anything(),
        Bucket: 'my-s3-bucket',
        ContentDisposition: 'inline',
        ContentType: 'application/pdf',
        Key: 's3-key',
      })
      expect(response).toBe('https://my-s3-bucket.s3.amazonaws.com/s3-key')
    })
  })
})
