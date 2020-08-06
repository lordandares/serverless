export {}

/* tslint:disable */
// NOTE Convert these to imports. Needs workaround for mockResolvedValue usage below
const s3 = require('../../s3')
const findS3Resources = require('./index').findS3Resources
const getPdfS3Paths = require('./index').getPdfS3Paths
/* tslint:enable */

jest.mock('../../s3')

const S3_BUCKET_UPLOADS = 'lighthouse-uploads'

describe('getPdfS3Paths', () => {
  beforeEach(() => {
    process.env.S3_BUCKET_UPLOADS = S3_BUCKET_UPLOADS
  })

  const payload = {
    bucket: 'my-bucket',
    key: 'object-key',
  }

  const s3Data = {
    filename: 'file.pdf',
    type: 'task',
    options: {
      logoUrl:
        'https://s3.amazonaws.com/assets-lighthouse-io/img/logos/pdf/test.png',
    },
    data: {
      entity: {
        entry: {
          formGroups: [
            {
              label: 'Grafitti Register',
              fieldGroups: [
                {
                  fields: [
                    {
                      label: 'Photo of Grafitti',
                      fieldtype: 'list',
                      options: { type: 'media' },
                      value: [
                        '565e42d3d4c628373ab25231/C26C3E36-B363-43DA-8C35-B134F8E2E7BD-D07F854C-4C64-46C4-B5AB-017ED13F0FE7.jpg',
                        '565e42d3d4c628373ab25231/C26C3E36-B363-43DA-8C35-B134F8E2E7BD-D07F854C-4C64-46C4-B5AB-017ED13F0FE8.jpg',
                        '565e42d3d4c628373ab25231/C26C3E36-B363-43DA-8C35-B134F8E2E7BD-D07F854C-4C64-46C4-B5AB-017ED13F0FE9.jpg',
                        '565e42d3d4c628373ab25231/C26C3E36-B363-43DA-8C35-B134F8E2E7BD-D07F854C-4C64-46C4-B5AB-017ED13F0FE0.jpg',
                      ],
                      validation: { enum: [] },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      locations: {},
      timezone: 'Australia/Melbourne',
      users: {},
      zones: {},
    },
  }

  it('should return a resolved promise with count and values', done => {
    s3.get.mockResolvedValue({
      Body: JSON.stringify(s3Data),
    })

    expect.assertions(2)

    getPdfS3Paths(payload).then(results => {
      expect(s3.get).toHaveBeenCalledTimes(1)
      expect(results).toMatchSnapshot()
      done()
    })
  })

  it('should return a rejected promise with error when unknown error', done => {
    const error = new Error('Error')

    s3.get.mockRejectedValue(error)

    expect.assertions(1)

    getPdfS3Paths(payload).catch(err => {
      expect(err).toEqual(error)
      done()
    })
  })

  it('should return a rejected promise when json body not parsed', done => {
    s3.get.mockResolvedValue({
      Body: '',
    })

    expect.assertions(2)

    getPdfS3Paths(payload).catch(err => {
      expect(err.name).toEqual('Error')
      expect(err.message).toEqual('Invalid S3 `Body` received')
      done()
    })
  })
})

describe('findS3Resources', () => {
  beforeEach(() => {
    process.env.S3_BUCKET_UPLOADS = S3_BUCKET_UPLOADS
  })

  it('should return an empty array if no data is passed', () => {
    const resources = findS3Resources()

    expect(resources).toEqual([])
  })

  it('should return an empty array if S3_BUCKET_UPLOADS is missing', () => {
    process.env.S3_BUCKET_UPLOADS = ''

    const data = {
      type: 'audit',
      entity: {
        items: [
          {
            assets: [
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff0.jpg',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff1.jpg',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff2.png',
            ],
          },
          {
            assets: [
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff3.pdf',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff4.docx',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff5.jpeg',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff6.JPG',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff7.JPEG',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff8.PNG',
            ],
          },
        ],
      },
    }

    const resources = findS3Resources(data)
    expect(resources).toEqual([])
  })

  it('should return an empty array if no matches are found', () => {
    const data = {}

    const resources = findS3Resources(data)
    expect(resources).toEqual([])
  })

  it('should parse JPG images from an event payload', () => {
    const data = {
      type: 'audit',
      entity: {
        items: [
          {
            assets: [
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff0.jpg',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff1.jpg',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff2.png',
            ],
          },
          {
            assets: [
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff3.pdf',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff4.docx',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff5.jpeg',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff6.JPG',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff7.JPEG',
              '5bf4eb5b8d7c870001974be4/3e670f8ebe2efaec-image-3c928b94-0482-4477-b72b-ca9859790ff8.PNG',
            ],
          },
        ],
      },
    }

    const resources = findS3Resources(data)
    expect(resources).toMatchSnapshot()
  })
})
