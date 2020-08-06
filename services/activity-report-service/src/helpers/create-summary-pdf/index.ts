import * as AWS from 'aws-sdk'
import { getOr } from 'lodash/fp'

import getPdfBuffer from '../get-pdf-buffer'
import * as s3 from '../s3'

interface Env {
  env: {
    S3_BUCKET_UPLOADS: string
    AWS_REGION: string
    S3_BASE_URL: string
    CLOUDINARY_BASE_URL: string
  }
}

declare var process: Env

export function buildConfig(data) {
  const { application } = data

  // pdf options
  const pageSize = getPageSize(process.env.AWS_REGION)
  const logoUrl = getOr(undefined, 'theme.logos.pdf', application)
  const pdfOptions = { logoUrl, pageSize }

  // custom application/dar settings
  const maxScans = getOr(undefined, 'settings.darMaxScans', application)
  const showAlternate = getOr(false, 'flags.darAlternateSummary', application)

  const settings = {
    awsS3BaseUrl: process.env.S3_BASE_URL,
    cloudinaryBaseUrl: process.env.CLOUDINARY_BASE_URL,
  }

  return {
    data: {
      ...data,
      maxScans,
      settings,
      showAlternate,
    },
    pdfOptions,
  }
}

export async function createSummaryPdf(pdfDefinition, s3FullPath) {
  const s3Client = new AWS.S3()
  const s3Bucket = process.env.S3_BUCKET_UPLOADS

  const buffer = await getPdfBuffer(pdfDefinition)
  await s3.put(s3Client, {
    buffer,
    bucket: s3Bucket,
    key: s3FullPath,
  })
}

// NOTE there's an issue with typescript compiled code and the branch coverage
// of istanbul. Disabling until finding an appropriate solution
// See: https://www.npmjs.com/package/ts-es5-istanbul-coverage

/* istanbul ignore next */
function getPageSize(region: string = '') {
  return region.startsWith('us-') ? 'LETTER' : 'A4'
}
