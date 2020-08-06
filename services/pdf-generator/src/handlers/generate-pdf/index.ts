// eslint-disable-next-line no-unused-vars
import { attachFileToEntry } from '../../attach-file-to-entry'
import handleGeneratePdf from '../../handle-generate-pdf'

interface Env {
  env: {
    AWS_REGION: string
    CLOUDINARY_BASE_URL: string
    S3_BASE_URL: string
    S3_BUCKET_UPLOADS: string
  }
}

declare var process: Env

export async function generatePdf(event) {
  assertEnvVars(process.env)

  const isJson = typeof event.body === 'string'
  const data = isJson ? JSON.parse(event.body) : event

  const pageSize = getPageSize(process.env.AWS_REGION)

  const pdfOptions = {
    cloudinaryBaseUrl: process.env.CLOUDINARY_BASE_URL,
    pageSize,
    s3BaseUrl: process.env.S3_BASE_URL,
    s3Bucket: process.env.S3_BUCKET_UPLOADS,
  }

  const result = await handleGeneratePdf(data, pdfOptions)
  const { applicationId, entityId, key, type, ...file } = result

  const fileOptions = {
    applicationId,
    entityId,
    key,
    type,
  }

  await attachFileToEntry(fileOptions)

  return file
}

function assertEnvVars(env: any) {
  if (!env.CLOUDINARY_BASE_URL || !env.S3_BASE_URL || !env.S3_BUCKET_UPLOADS) {
    throw new Error('Missing required environment variables')
  }
}

// NOTE there's an issue with typescript compiled code and the branch coverage
// of istanbul. Disabling until finding an appropriate solution
// See: https://www.npmjs.com/package/ts-es5-istanbul-coverage

/* istanbul ignore next */
function getPageSize(region: string = '') {
  return region.startsWith('us-') ? 'LETTER' : 'A4'
}
