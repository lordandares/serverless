export const AWS_REGION = 'ap-southeast-2'
export const DEFINITION = { content: ['definition'] }
export const LOGO_URL = 'http://lighthouse.io/logo.png'

export const CLOUDINARY_BASE_URL = 'http://cloudinary.com'
export const S3_BASE_URL = 'http://upload-test.com'
export const S3_BUCKET_UPLOADS = 'testing'
export const SUMMARY_REFERENCE =
  'activity-reports/shifts/111122223333/2000/01/01/2000-01-01-shift-0987654321-summary-946684800000.pdf'

export const DATA = {
  applicationId: '111122223333',
  audits: [
    {
      createdAt: '2000-01-01T15:00:00.000Z',
      files: {
        pdf: {
          path: '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
        },
      },
    },
  ],
  location: {
    _id: '123456789',
  },
  issues: [
    {
      createdAt: '2000-01-01T16:00:00.000Z',
      files: {
        pdf: {
          path: '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
        },
      },
    },
  ],
  tasks: [
    {
      createdAt: '2000-01-01T09:00:00.000Z',
      files: {
        pdf: {
          path: '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
        },
      },
    },
  ],
  timestamp: '2000-01-01T12:00:00.000Z',
  timezone: 'Australia/Melbourne',
  shift: {
    _id: '0987654321',
  },
}

export const BUILD_DATA = {
  data: {
    ...DATA,
    maxScans: 100,
    settings: {
      awsS3BaseUrl: S3_BASE_URL,
      cloudinaryBaseUrl: CLOUDINARY_BASE_URL,
    },
  },
  pdfOptions: {
    logoUrl: LOGO_URL,
    pageSize: 'A4',
  },
}

export const { data: CONFIG_DATA, pdfOptions: PDF_OPTIONS } = BUILD_DATA
