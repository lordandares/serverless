export {}

/* tslint:disable */
// NOTE Convert these to imports. Needs workaround for mockResolvedValue usage below
const s3 = require('../../s3')
const verifyS3Resources = require('./index').verifyS3Resources
/* tslint:enable */

jest.mock('../../s3')

const S3_BUCKET_UPLOADS = 'lighthouse-uploads'

describe('verifyS3Resources', () => {
  const resources = [
    {
      bucket: 'lighthouse-uploads',
      key:
        '565e42d3d4c628373ab25231/C26C3E36-B363-43DA-8C35-B134F8E2E7BD-D07F854C-4C64-46C4-B5AB-017ED13F0FE7.jpg',
    },
  ]

  it('should return a resolved promise when all resources exist', done => {
    s3.exists.mockResolvedValue()

    expect.assertions(1)

    verifyS3Resources(resources).then(() => {
      expect(s3.exists).toHaveBeenCalledTimes(1)
      done()
    })
  })

  it('should return a rejected promise with original error when unknown error', done => {
    const error = new Error('test')
    s3.exists.mockRejectedValue(error)

    expect.assertions(1)

    verifyS3Resources(resources).catch(err => {
      expect(err).toEqual(error)
      done()
    })
  })

  it('should return a rejected promise with MissingS3Resource error when Forbidden error', done => {
    const error = new Error()
    error.name = 'Forbidden'

    s3.exists.mockRejectedValue(error)

    expect.assertions(2)

    verifyS3Resources(resources).catch(err => {
      expect(err.name).toEqual('MissingS3Resource')
      expect(err.message).toEqual(
        'Missing resource: lighthouse-uploads/565e42d3d4c628373ab25231/C26C3E36-B363-43DA-8C35-B134F8E2E7BD-D07F854C-4C64-46C4-B5AB-017ED13F0FE7.jpg',
      )
      done()
    })
  })
})
