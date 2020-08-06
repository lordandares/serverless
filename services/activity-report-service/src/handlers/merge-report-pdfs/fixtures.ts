export const PAYLOAD = {
  locationId: '5b68d7411f7b2b288279417a',
  pdfs: {
    pdfsToMerge: [
      'activity-reports/5b68d7411f7b2b288279417a/2000/01/2000-01-01-summary-946684800000.pdf',
      '123456789/pdfs/2000-01-01/1543450822683-tasks-12345.pdf',
      '123456789/pdfs/2000-01-01/1543450822683-audit-12345.pdf',
      '123456789/pdfs/2000-01-01/1543450822683-issue-12345.pdf',
    ],
    summaryS3Path:
      'activity-reports/5b68d7411f7b2b288279417a/2000/01/2000-01-01-summary-946684800000.pdf',
    mergedS3Path:
      'activity-reports/5b68d7411f7b2b288279417a/2000/01/2000-01-01-summary-and-forms-946684800000.pdf',
  },
}

export const BUFFER = 'buffer'
export const UUID = '9999-8888-7777-6666'
export const DIRECTORY = `/tmp/${UUID}`
export const FILE_PATH = `${DIRECTORY}/1111-2222-3333-4444.pdf`
export const FILES_PATHS = [`${DIRECTORY}/5555-4444-3333-2222.pdf`]
export const MERGED_S3_PATH =
  'activity-reports/5b68d7411f7b2b288279417a/2000/01/2000-01-01-summary-and-forms-946684800000.pdf'
export const S3_BUCKET_UPLOADS = 'testing'
