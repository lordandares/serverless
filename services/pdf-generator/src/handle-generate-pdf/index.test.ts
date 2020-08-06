export {}

/* tslint:disable */
// NOTE Convert these to imports. Needs workaround for mockResolvedValue usage below
const handleGeneratePdf = require('./index').default
const findS3Resources = require('./index').findS3Resources
const buildPdfDefinition = require('../build-pdf-definition/index').default
const getPdfBuffer = require('../get-pdf-buffer/index').default
const s3 = require('../s3/index')
/* tslint:enable */

jest.mock('../build-pdf-definition')
jest.mock('../get-pdf-buffer')
jest.mock('../s3')

it('should call build pdf definition and return s3 url', () => {
  expect.assertions(3)

  buildPdfDefinition.mockResolvedValue({})
  getPdfBuffer.mockResolvedValue('mock-buffer')

  const applicationId = '5c04805afc13ae2cb7000000'
  const entityId = '5c04805afc13ae2cb7000001'

  const s3Data = {
    data: {
      entity: {
        _id: entityId,
        application: applicationId,
      },
      locations: {},
      timezone: 'Australia/Melbourne',
      users: {},
      zones: {},
    },
    filename: 'file.pdf',
    type: 'task',
    options: {
      logoUrl:
        'https://s3.amazonaws.com/assets-lighthouse-io/img/logos/pdf/test.png',
    },
  }

  s3.get.mockResolvedValue({
    Body: JSON.stringify(s3Data),
  })
  s3.put.mockResolvedValue('http://s3.com/pdf-url')

  const payload = {
    bucket: 'my-bucket',
    key: 'object-key',
  }
  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'A4',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    s3Bucket: 'my-test-bucket',
  }

  // regexr.com/3t0s6
  const regex = /5c04805afc13ae2cb7000000\/pdfs\/\d{4}-\d{2}-\d{2}\/\d+-task-5c04805afc13ae2cb7000001\.pdf/

  return handleGeneratePdf(payload, options).then(result => {
    expect(buildPdfDefinition).toBeCalledWith(s3Data.data, {
      cloudinaryBaseUrl: options.cloudinaryBaseUrl,
      logoUrl: s3Data.options.logoUrl,
      pageSize: 'A4',
      s3BaseUrl: options.s3BaseUrl,
      type: 'task',
    })
    expect(result).toEqual(
      expect.objectContaining({
        applicationId,
        entityId,
        filename: 'file.pdf',
        key: expect.stringMatching(regex),
        type: 'task',
        url: 'http://s3.com/pdf-url',
      }),
    )
    expect(s3.put).toBeCalledWith(expect.anything(), {
      bucket: 'my-test-bucket',
      buffer: 'mock-buffer',
      contentDisposition: 'inline',
      contentType: 'application/pdf',
      key: expect.stringMatching(regex),
    })
  })
})

it('should error for invalid s3 data', () => {
  expect.assertions(1)

  const s3Data = 'invalid-non-json-string'

  s3.get.mockResolvedValue({
    Body: s3Data,
  })
  s3.put.mockResolvedValue('http://s3.com/pdf-url')

  const payload = {
    bucket: 'my-bucket',
    key: 'object-key',
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'LETTER',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    s3Bucket: 'my-test-bucket',
  }

  const promise = handleGeneratePdf(payload, options)

  return expect(promise).rejects.toHaveProperty(
    'message',
    'Invalid S3 `Body` received',
  )
})

it('should error if type is missing', () => {
  expect.assertions(1)

  const s3Data = {
    data: {
      entity: {
        _id: 'id1',
        application: 'application1',
      },
      locations: {},
      timezone: 'Australia/Melbourne',
      users: {},
      zones: {},
    },
    filename: 'file.pdf',
  }

  s3.get.mockResolvedValue({
    Body: JSON.stringify(s3Data),
  })
  s3.put.mockResolvedValue('http://s3.com/pdf-url')

  const payload = {
    bucket: 'my-bucket',
    key: 'object-key',
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'LETTER',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    s3Bucket: 'my-test-bucket',
  }

  const promise = handleGeneratePdf(payload, options)

  return expect(promise).rejects.toHaveProperty(
    'message',
    'Missing `type` supplied to handleGeneratePdf',
  )
})

it('should error if filename is missing', () => {
  expect.assertions(1)

  const s3Data = {
    data: {
      entity: {},
      locations: {},
      timezone: 'Australia/Melbourne',
      users: {},
      zones: {},
    },
    type: 'audit',
  }

  s3.get.mockResolvedValue({
    Body: JSON.stringify(s3Data),
  })
  s3.put.mockResolvedValue('http://s3.com/pdf-url')

  const payload = {
    bucket: 'my-bucket',
    key: 'object-key',
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'LETTER',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    s3Bucket: 'my-test-bucket',
  }

  const promise = handleGeneratePdf(payload, options)

  return expect(promise).rejects.toHaveProperty(
    'message',
    'Missing `filename` supplied to handleGeneratePdf',
  )
})

it('should error if entity is empty', () => {
  expect.assertions(1)

  buildPdfDefinition.mockResolvedValue({})
  getPdfBuffer.mockResolvedValue('mock-buffer')

  const s3Data = {
    data: {
      entity: {},
      locations: {},
      timezone: 'Australia/Melbourne',
      users: {},
      zones: {},
    },
    filename: 'file.pdf',
    options: {
      logoUrl:
        'https://s3.amazonaws.com/assets-lighthouse-io/img/logos/pdf/test.png',
    },
    type: 'audit',
  }

  s3.get.mockResolvedValue({
    Body: JSON.stringify(s3Data),
  })
  s3.put.mockResolvedValue('http://s3.com/pdf-url')

  const payload = {
    bucket: 'my-bucket',
    key: 'object-key',
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'LETTER',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    s3Bucket: 'my-test-bucket',
  }

  const promise = handleGeneratePdf(payload, options)

  return expect(promise).rejects.toHaveProperty(
    'message',
    'Invalid `data` supplied to handleGeneratePdf',
  )
})

it('should handle build error', () => {
  expect.assertions(1)

  buildPdfDefinition.mockRejectedValue(new Error('Error building definition'))

  const s3Data = {
    data: {
      entity: {
        _id: 'id1',
        application: 'application1',
      },
      locations: {},
      timezone: 'Australia/Melbourne',
      users: {},
      zones: {},
    },
    filename: 'file.pdf',
    options: {
      logoUrl:
        'https://s3.amazonaws.com/assets-lighthouse-io/img/logos/pdf/test.png',
    },
    type: 'task',
  }

  s3.get.mockResolvedValue({
    Body: JSON.stringify(s3Data),
  })
  s3.put.mockResolvedValue('http://s3.com/pdf-url')

  const payload = {
    bucket: 'my-bucket',
    key: 'object-key',
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'LETTER',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    s3Bucket: 'my-test-bucket',
  }

  const promise = handleGeneratePdf(payload, options)

  return expect(promise).rejects.toHaveProperty(
    'message',
    'Error building definition',
  )
})
