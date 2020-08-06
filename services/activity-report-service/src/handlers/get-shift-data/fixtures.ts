export const body = {
  shiftId: '1234567890',
}

export const data = {
  applicationId: '9c89816ea008a66615a220d1',
  audits: [{ _id: '5b36816ea008a70015a330d1' }],
  events: [{ _id: '5b36816ea008a70015a330d2' }],
  issues: [{ _id: '5b36816ea008a70015a330d3' }],
  location: {},
  shift: {},
  tasks: [{ _id: '5b36816ea008a70015a330d4' }],
  timestamp: '2018-11-29T00:25:19.020Z',
  timezone: 'Australia/Melbourne',
  user: {},
  zones: [{ _id: '5b36816ea008a70015a330d5' }],
}

export const emptyData = {
  ...data,
  audits: [],
  events: [],
  issues: [],
  tasks: [],
}

export const summaryS3Path =
  '123456789/pdfs/2018-11-26/1543450822684-dar-123456789.pdf'

export const formS3Path = [
  '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
  '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
  '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
]

export const references = {
  formS3Paths: [
    '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
    '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
    '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
  ],
  summaryS3Path: '123456789/pdfs/2018-11-26/1543450822684-dar-123456789.pdf',
}

export const referencesShouldNotSkip = {
  mergedS3Path:
    'activity-reports/shifts/9c89816ea008a66615a220d1/2000/01/01/2000-01-01-shift-1234567890-summary-and-forms-946684800000.pdf',
  pdfsToMerge: [
    '123456789/pdfs/2018-11-26/1543450822684-dar-123456789.pdf',
    '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
    '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
    '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
  ],
  skip: false,
  summaryS3Path: '123456789/pdfs/2018-11-26/1543450822684-dar-123456789.pdf',
}
