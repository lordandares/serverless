export {}

/* tslint:disable */
// NOTE Convert these to imports. Needs workaround for mockResolvedValue usage below
const {
  buildAuditPdf,
  buildIssuePdf,
  buildTaskPdf,
} = require('@lighthouse/common')

const buildPdfDefinition = require('./').default
/* tslint:enable */

jest.mock('@lighthouse/common', () => ({
  buildAuditPdf: jest.fn().mockResolvedValue({}),
  buildIssuePdf: jest.fn().mockResolvedValue({}),
  buildTaskPdf: jest.fn().mockResolvedValue({}),
}))

it('should error for unknown type', () => {
  expect.assertions(1)

  const pdfData = {
    entity: {
      _id: 'id1',
      application: 'application1',
    },
    timezone: 'Australia/Melbourne',
    locations: {},
    users: {},
    zones: {},
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'A4',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    type: 'unknown',
  }

  const promise = buildPdfDefinition(pdfData, options)

  expect(promise).rejects.toHaveProperty(
    'message',
    'Invalid type:unknown value supplied to buildPdfDefinition',
  )
})

it('should call audit pdf helper with arguments', () => {
  expect.assertions(1)

  const pdfData = {
    entity: {
      _id: 'id1',
      application: 'application1',
    },
    timezone: 'Australia/Melbourne',
    locations: {},
    users: {},
    zones: {},
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'A4',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    type: 'audit',
  }

  return buildPdfDefinition(pdfData, options).then(() => {
    expect(buildAuditPdf).toBeCalledWith(
      {
        pageSize: 'A4',
      },
      {
        entity: pdfData.entity,
        locations: pdfData.locations,
        settings: {
          cloudinaryBaseUrl: options.cloudinaryBaseUrl,
          awsS3BaseUrl: options.s3BaseUrl,
        },
        timezone: pdfData.timezone,
        users: pdfData.users,
        zones: pdfData.zones,
      },
    )
  })
})

it('should call issue pdf helper with arguments', () => {
  expect.assertions(1)

  const pdfData = {
    entity: {
      _id: 'id1',
      application: 'application1',
    },
    timezone: 'Australia/Melbourne',
    locations: {},
    users: {},
    zones: {},
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'Letter',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    type: 'issue',
  }

  return buildPdfDefinition(pdfData, options).then(() => {
    expect(buildIssuePdf).toBeCalledWith(
      {
        pageSize: 'Letter',
      },
      {
        entity: pdfData.entity,
        locations: pdfData.locations,
        settings: {
          cloudinaryBaseUrl: options.cloudinaryBaseUrl,
          awsS3BaseUrl: options.s3BaseUrl,
        },
        timezone: pdfData.timezone,
        users: pdfData.users,
        zones: pdfData.zones,
      },
    )
  })
})

it('should call task pdf helper with arguments', () => {
  expect.assertions(1)

  const pdfData = {
    entity: {
      _id: 'id1',
      application: 'application1',
    },
    timezone: 'Australia/Melbourne',
    locations: {},
    users: {},
    zones: {},
  }

  const options = {
    cloudinaryBaseUrl: 'http://mock-cloudinary.com',
    pageSize: 'A4',
    s3BaseUrl: 'http://s3.lighthouse-io.com',
    type: 'task',
  }

  return buildPdfDefinition(pdfData, options).then(() => {
    expect(buildTaskPdf).toBeCalledWith(
      {
        pageSize: 'A4',
      },
      {
        entity: pdfData.entity,
        locations: pdfData.locations,
        settings: {
          cloudinaryBaseUrl: options.cloudinaryBaseUrl,
          awsS3BaseUrl: options.s3BaseUrl,
        },
        timezone: pdfData.timezone,
        users: pdfData.users,
        zones: pdfData.zones,
      },
    )
  })
})
